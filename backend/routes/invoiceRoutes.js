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
// CREATE & SEND INVOICE (One-Click)
router.post("/", async (req, res) => {
  const { clientName, clientEmail, projectDescription, amount, dueDate } =
    req.body;

  if (!clientName || !clientEmail || !amount || !dueDate) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // 1. Verify User & Check SMTP Credentials
    const userResult = await pool.query(
      "SELECT id, name, email, smtp_user, smtp_pass FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];

    if (!user || !user.smtp_user || !user.smtp_pass) {
      return res.status(400).json({
        error:
          "SMTP credentials missing. Please configure your Gmail App Password in Settings before sending invoices.",
      });
    }

    // 2. Generate unique invoice number & insert into DB
    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    const result = await pool.query(
      `INSERT INTO invoices (user_id, invoice_number, client_name, client_email, project_description, amount, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
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

    let pdfBuffer;

    // 3. Generate PDF Buffer with strict error capture
    try {
      const pdfResult = await generateInvoicePDF(invoice);
      pdfBuffer = pdfResult.pdfBuffer;
    } catch (pdfErr) {
      console.error("PDF Generation Failed:", pdfErr);

      // Delete created DB invoice to prevent orphan records
      await pool.query("DELETE FROM invoices WHERE id = $1", [invoice.id]);

      return res.status(500).json({
        error: "PDF generation failed. Please check browser service settings.",
        details: pdfErr.message,
      });
    }

    // 4. Send Email via Nodemailer
    try {
      await sendInvoiceEmail(invoice, pdfBuffer, user);
    } catch (emailErr) {
      console.error("Email Dispatch Failed:", emailErr);

      // Return invoice ID so frontend can show invoice was saved but not mailed
      return res.status(207).json({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: "created_but_not_sent",
        error:
          "Invoice saved, but email delivery failed. Please verify SMTP settings.",
        details: emailErr.message,
      });
    }

    // 5. Complete success response
    return res.status(201).json({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: "created_and_sent",
      message: `Invoice ${invoice.invoice_number} created and emailed to ${invoice.client_email}`,
    });
  } catch (err) {
    console.error("Create & Send Root Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create and send invoice." });
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
