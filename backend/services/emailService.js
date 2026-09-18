const nodemailer = require("nodemailer");

function buildTransporter(senderUser) {
  if (!senderUser.smtp_pass) {
    throw new Error(
      "You must configure your Gmail App Password / SMTP settings before sending emails.",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: senderUser.smtp_user.trim(),
      pass: senderUser.smtp_pass,
    },
  });
}

async function sendInvoiceEmail(invoice, pdfBuffer, senderUser) {
  const transporter = buildTransporter(senderUser);

  const formattedAmount = Number(
    parseFloat(invoice.amount) || 0,
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const mailOptions = {
    from: `"${senderUser.name}" <${senderUser.smtp_user || senderUser.email}>`,
    to: invoice.client_email.trim(),
    subject: `Invoice ${invoice.invoice_number} from ${senderUser.name}`,
    html: `
    <p>Hi ${invoice.client_name},</p>
    <p>Please find attached invoice <strong>${invoice.invoice_number}</strong> for <strong>$${formattedAmount}</strong>.</p>
    <p>Due Date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
    <br/>
    <p>Thank you for your business!</p>
    <p>Best regards,<br/>${senderUser.name}</p>
    `,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      },
    ],
  };

  return await transporter.sendMail(mailOptions);
}

async function sendReminderEmail(invoice, reminderText, senderUser) {
  const transporter = buildTransporter(senderUser);

  const mailOptions = {
    from: `"${senderUser.name}" <${senderUser.smtp_user || senderUser.email}>`,
    to: invoice.client_email.trim(),
    subject: `Reminder: Invoice ${invoice.invoice_number} is overdue`,
    html: `<p>${reminderText.replace(/\n/g, "<br/>")}</p>`,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { sendInvoiceEmail, sendReminderEmail };
