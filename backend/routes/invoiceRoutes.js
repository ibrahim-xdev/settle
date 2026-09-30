const express = require("express");

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

// ============================================================
// BACKGROUND PDF + EMAIL DELIVERY
// ============================================================

async function processInvoiceDelivery(invoice, user) {
  console.log(`🚀 Starting delivery for ${invoice.invoice_number}`);

  let pdfBuffer;

  // ----------------------------------------------------------
  // 1. Generate PDF
  // ----------------------------------------------------------

  try {
    console.log(`📄 Generating PDF for ${invoice.invoice_number}...`);

    const pdfResult = await generateInvoicePDF(invoice);

    if (!pdfResult || !pdfResult.pdfBuffer) {
      throw new Error("PDF service returned no PDF buffer.");
    }

    pdfBuffer = pdfResult.pdfBuffer;

    console.log(
      `✅ PDF generated for ${invoice.invoice_number} (${pdfBuffer.length} bytes)`,
    );

    await pool.query(
      `
        UPDATE invoices
        SET delivery_status = 'pdf_generated',
            delivery_error = NULL
        WHERE id = $1
      `,
      [invoice.id],
    );
  } catch (error) {
    console.error(
      `❌ PDF generation failed for ${invoice.invoice_number}:`,
      error,
    );

    try {
      await pool.query(
        `
          UPDATE invoices
          SET delivery_status = 'failed',
              delivery_error = $1
          WHERE id = $2
        `,
        [`PDF generation failed: ${error.message}`, invoice.id],
      );
    } catch (dbError) {
      console.error("❌ Failed to save PDF error to database:", dbError);
    }

    return;
  }

  // ----------------------------------------------------------
  // 2. Send Email
  // ----------------------------------------------------------

  try {
    console.log(
      `📧 Sending invoice ${invoice.invoice_number} to ${invoice.client_email}...`,
    );

    await sendInvoiceEmail(invoice, pdfBuffer, user);

    console.log(`✅ Invoice ${invoice.invoice_number} emailed successfully.`);

    await pool.query(
      `
        UPDATE invoices
        SET delivery_status = 'sent',
            delivery_error = NULL
        WHERE id = $1
      `,
      [invoice.id],
    );

    console.log(`🎉 Invoice ${invoice.invoice_number} completed successfully.`);
  } catch (error) {
    console.error(`❌ Email failed for ${invoice.invoice_number}:`, error);

    try {
      await pool.query(
        `
          UPDATE invoices
          SET delivery_status = 'failed',
              delivery_error = $1
          WHERE id = $2
        `,
        [`Email delivery failed: ${error.message}`, invoice.id],
      );
    } catch (dbError) {
      console.error("❌ Failed to save email error to database:", dbError);
    }
  }
}

// ============================================================
// CREATE & SEND INVOICE
// ============================================================

router.post("/", async (req, res) => {
  const { clientName, clientEmail, projectDescription, amount, dueDate } =
    req.body;

  if (!clientName || !clientEmail || !amount || !dueDate) {
    return res.status(400).json({
      error: "Missing required fields.",
    });
  }

  try {
    // --------------------------------------------------------
    // 1. Get logged-in user
    // --------------------------------------------------------

    const userResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          smtp_user,
          smtp_pass
        FROM users
        WHERE id = $1
      `,
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
          "SMTP credentials missing. Please configure your Gmail address and Gmail App Password in Settings before sending invoices.",
      });
    }

    // --------------------------------------------------------
    // 2. Generate invoice number
    // --------------------------------------------------------

    const invoiceNumber = await generateInvoiceNumber(req.user.id);

    // --------------------------------------------------------
    // 3. Insert invoice
    // --------------------------------------------------------

    const result = await pool.query(
      `
        INSERT INTO invoices (
          user_id,
          invoice_number,
          client_name,
          client_email,
          project_description,
          amount,
          due_date,
          delivery_status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'processing'
        )
        RETURNING *
      `,
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

    console.log(`📝 Invoice ${invoice.invoice_number} created in database.`);

    // --------------------------------------------------------
    // 4. Respond immediately
    // --------------------------------------------------------

    res.status(201).json({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: "created",
      deliveryStatus: "processing",
      message: `Invoice ${invoice.invoice_number} created successfully. PDF generation and email delivery are processing.`,
    });

    // --------------------------------------------------------
    // 5. Start background delivery
    // --------------------------------------------------------

    processInvoiceDelivery(invoice, user).catch(async (error) => {
      console.error(
        `❌ Unexpected background delivery error for ${invoice.invoice_number}:`,
        error,
      );

      try {
        await pool.query(
          `
              UPDATE invoices
              SET delivery_status = 'failed',
                  delivery_error = $1
              WHERE id = $2
            `,
          [error?.message || "Unknown background delivery error", invoice.id],
        );
      } catch (dbError) {
        console.error("❌ Failed to update delivery status:", dbError);
      }
    });
  } catch (err) {
    console.error("❌ Create Invoice Error:", err);

    // Only send a response if the response hasn't already been sent.
    if (!res.headersSent) {
      return res.status(500).json({
        error: err.message || "Failed to create invoice.",
      });
    }
  }
});

// ============================================================
// DELETE INVOICE
// ============================================================

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
        DELETE FROM invoices
        WHERE id = $1
          AND user_id = $2
        RETURNING *
      `,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Invoice not found or unauthorized.",
      });
    }

    res.json({
      message: "Invoice deleted successfully.",
      deletedInvoice: result.rows[0],
    });
  } catch (err) {
    console.error("Delete Invoice Error:", err);

    res.status(500).json({
      error: "Failed to delete invoice.",
    });
  }
});

// ============================================================
// UPDATE INVOICE
// ============================================================

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const { clientName, clientEmail, projectDescription, amount, dueDate } =
    req.body;

  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
        UPDATE invoices
        SET
          client_name = $1,
          client_email = $2,
          project_description = $3,
          amount = $4,
          due_date = $5
        WHERE id = $6
          AND user_id = $7
        RETURNING *
      `,
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
      return res.status(404).json({
        error: "Invoice not found or unauthorized.",
      });
    }

    res.json({
      message: "Invoice updated successfully.",
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error("Update Invoice Error:", err);

    res.status(500).json({
      error: "Failed to update invoice.",
    });
  }
});

// ============================================================
// FETCH ALL INVOICES
// ============================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM invoices
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.user.id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Invoices Error:", err);

    res.status(500).json({
      error: "Failed to fetch invoices.",
    });
  }
});

// ============================================================
// DOWNLOAD / GENERATE PDF
// ============================================================

router.get("/:id/pdf", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM invoices
        WHERE id = $1
          AND user_id = $2
      `,
      [req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    const invoice = result.rows[0];

    console.log(`📥 Generating PDF download for ${invoice.invoice_number}...`);

    const { pdfBuffer } = await generateInvoicePDF(invoice);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoice_number}.pdf"`,
    );

    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Download Error:", err);

    res.status(500).json({
      error: err.message || "Failed to generate PDF.",
    });
  }
});

// ============================================================
// RESEND INVOICE EMAIL
// ============================================================

router.post("/:id/send-email", async (req, res) => {
  try {
    const invoiceResult = await pool.query(
      `
        SELECT *
        FROM invoices
        WHERE id = $1
          AND user_id = $2
      `,
      [req.params.id, req.user.id],
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    const userResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          smtp_user,
          smtp_pass
        FROM users
        WHERE id = $1
      `,
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

    await pool.query(
      `
        UPDATE invoices
        SET
          delivery_status = 'sent',
          delivery_error = NULL
        WHERE id = $1
      `,
      [invoice.id],
    );

    res.json({
      status: "success",
      message: `Invoice resent to ${invoice.client_email}`,
    });
  } catch (err) {
    console.error("Resend Email Error:", err);

    res.status(500).json({
      error: err.message || "Failed to resend email.",
    });
  }
});

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: "Status field is required.",
    });
  }

  const ALLOWED = ["pending", "paid"];

  const normalized = status.toLowerCase();

  if (!ALLOWED.includes(normalized)) {
    return res.status(400).json({
      error: "Invalid status value.",
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE invoices
        SET status = $1
        WHERE id = $2
          AND user_id = $3
        RETURNING *
      `,
      [normalized, req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Invoice not found.",
      });
    }

    res.json({
      message: `Invoice marked as ${normalized}`,
      invoice: result.rows[0],
    });
  } catch (err) {
    console.error("Status Update Error:", err);

    res.status(500).json({
      error: "Failed to update invoice status.",
    });
  }
});

// ============================================================
// TEST OVERDUE INVOICES
// ============================================================

router.get("/test-overdue", async (req, res) => {
  try {
    const overdue = await findOverDueInvoices();

    res.json(overdue);
  } catch (error) {
    console.error("Test Overdue Error:", error);

    res.status(500).json({
      error: error.message || "Failed to fetch overdue invoices.",
    });
  }
});

module.exports = router;
