const express = require("express");
const path = require("path");
const {
  pool,
  generateInvoiceNumber,
  findOverDueInvoices,
} = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const generateInvoicePDF = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/emailService");

const router = express.Router();

router.use(authenticateToken);

async function processInvoiceDelivery(invoice, user) {
  console.log(`🚀 Starting delivery for ${invoice.invoice_number}`);

  let pdfBuffer;

  // --------------------------------------------------
  // Generate PDF
  // --------------------------------------------------

  try {
    console.log(`📄 Generating PDF for ${invoice.invoice_number}...`);

    const pdfResult = await generateInvoicePDF(invoice);

    pdfBuffer = pdfResult.pdfBuffer;

    console.log(`✅ PDF generated for ${invoice.invoice_number}`);
  } catch (error) {
    console.error(
      `❌ PDF generation failed for ${invoice.invoice_number}:`,
      error,
    );

    await pool.query(
      `UPDATE invoices
       SET delivery_status = 'failed',
           delivery_error = $1
       WHERE id = $2`,
      [`PDF generation failed: ${error.message}`, invoice.id],
    );

    return;
  }

  // --------------------------------------------------
  // Send email
  // --------------------------------------------------

  try {
    console.log(
      `📧 Sending invoice ${invoice.invoice_number} to ${invoice.client_email}...`,
    );

    await sendInvoiceEmail(invoice, pdfBuffer, user);

    console.log(`✅ Invoice ${invoice.invoice_number} emailed successfully`);

    // --------------------------------------------------
    // Mark delivery successful
    // --------------------------------------------------

    await pool.query(
      `UPDATE invoices
       SET delivery_status = 'sent',
           delivery_error = NULL
       WHERE id = $1`,
      [invoice.id],
    );

    console.log(`🎉 Invoice ${invoice.invoice_number} completed successfully`);
  } catch (error) {
    console.error(`❌ Email failed for ${invoice.invoice_number}:`, error);

    await pool.query(
      `UPDATE invoices
       SET delivery_status = 'failed',
           delivery_error = $1
       WHERE id = $2`,
      [`Email delivery failed: ${error.message}`, invoice.id],
    );
  }
}

// CREATE & SEND INVOICE (One-Click)
router.post("/", async (req, res) => {
  const { clientName, clientEmail, projectDescription, amount, dueDate } =
    req.body;

  if (!clientName || !clientEmail || !amount || !dueDate) {
    return res.status(400).json({
      error: "Missing required fields.",
    });
  }

  try {
    // --------------------------------------------------
    // 1. Get authenticated user's SMTP credentials
    // --------------------------------------------------

    const userResult = await pool.query(
      `SELECT id, name, email, smtp_user, smtp_pass
       FROM users
       WHERE id = $1`,
      [req.user.id],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (!user.smtp_user || !user.smtp_pass) {
      return res.status(400).json({
        error:
          "SMTP credentials missing. Please configure your Gmail App Password in Settings before sending invoices.",
      });
    }

    // --------------------------------------------------
    // 2. Generate invoice number
    // --------------------------------------------------

    const invoiceNumber = await generateInvoiceNumber(req.user.id);

    // --------------------------------------------------
    // 3. Create invoice immediately
    // --------------------------------------------------

    const result = await pool.query(
      `INSERT INTO invoices (
        user_id,
        invoice_number,
        client_name,
        client_email,
        project_description,
        amount,
        due_date,
        delivery_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing')
      RETURNING *`,
      [
        req.user.id,
        invoiceNumber,
        clientName,
        clientEmail,
        projectDescription,
        parseFloat(amount),
        dueDate,
      ],
    );

    const invoice = result.rows[0];

    console.log(
      `📄 Invoice ${invoice.invoice_number} created. Starting background delivery...`,
    );

    // --------------------------------------------------
    // 4. RESPOND TO FRONTEND IMMEDIATELY
    // --------------------------------------------------

    res.status(201).json({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: "processing",
      message: `Invoice ${invoice.invoice_number} created successfully. PDF generation and email delivery are processing.`,
    });

    // --------------------------------------------------
    // 5. Background PDF + Email processing
    // --------------------------------------------------

    processInvoiceDelivery(invoice, user).catch(async (error) => {
      console.error(
        `❌ Background invoice delivery failed for ${invoice.invoice_number}:`,
        error,
      );

      try {
        await pool.query(
          `UPDATE invoices
           SET delivery_status = 'failed',
               delivery_error = $1
           WHERE id = $2`,
          [error?.message || "Unknown delivery error", invoice.id],
        );
      } catch (dbError) {
        console.error("❌ Failed to update invoice delivery status:", dbError);
      }
    });
  } catch (err) {
    console.error("Create Invoice Error:", err);

    return res.status(500).json({
      error: err.message || "Failed to create invoice.",
    });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Delete invoice only if it belongs to the authenticated user
    const result = await pool.query(
      "DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Invoice not found or unauthorized." });
    }

    res.json({
      message: "Invoice deleted successfully.",
      deletedInvoice: result.rows[0],
    });
  } catch (err) {
    console.error("Delete Invoice Error:", err);
    res.status(500).json({ error: "Failed to delete invoice." });
  }
});

// PUT /api/invoices/:id
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { clientName, clientEmail, projectDescription, amount, dueDate } =
    req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE invoices 
       SET client_name = $1, client_email = $2, project_description = $3, amount = $4, due_date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        clientName,
        clientEmail,
        projectDescription,
        amount,
        dueDate,
        id,
        userId,
      ],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Invoice not found or unauthorized." });
    }

    res.json({
      message: "Invoice updated successfully.",
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error("Update Invoice Error:", err);
    res.status(500).json({ error: "Failed to update invoice." });
  }
});

// FETCH ALL INVOICES FOR LOGGED-IN USER
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
});

// DOWNLOAD PDF
router.get("/:id/pdf", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    const invoice = result.rows[0];
    const filePath = path.join(
      __dirname,
      "../generated_invoices",
      `${invoice.invoice_number}.pdf`,
    );

    res.download(filePath, `${invoice.invoice_number}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PDF." });
  }
});

// RESEND INVOICE EMAIL TO CLIENT
router.post("/:id/send-email", async (req, res) => {
  try {
    const invoiceResult = await pool.query(
      "SELECT * FROM invoices WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    const userResult = await pool.query(
      "SELECT id, name, email, smtp_user, smtp_pass FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];

    if (!user || !user.smtp_user || !user.smtp_pass) {
      return res.status(400).json({
        error: "SMTP credentials missing. Update Settings before resending.",
      });
    }

    const invoice = invoiceResult.rows[0];
    const { pdfBuffer } = await generateInvoicePDF(invoice);
    await sendInvoiceEmail(invoice, pdfBuffer, user);

    res.json({
      status: "success",
      message: `Invoice resent to ${invoice.client_email}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to resend email." });
  }
});

// UPDATE INVOICE STATUS (e.g. mark as 'paid' or 'pending')
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status field is required." });
  }

  const ALLOWED = ["pending", "paid"];
  const normalized = status.toLowerCase();

  if (!ALLOWED.includes(normalized)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  try {
    const result = await pool.query(
      `UPDATE invoices 
       SET status = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [status.toLowerCase(), req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    res.json({
      message: `Invoice marked as ${status}`,
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error("Status Update Error:", err);
    res.status(500).json({ error: "Failed to update invoice status." });
  }
});

router.get("/test-overdue", async (req, res) => {
  const overdue = await findOverDueInvoices();
  res.json(overdue);
});

module.exports = router;
