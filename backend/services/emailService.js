const nodemailer = require("nodemailer");

// System transporter for application emails (like Account Verification)
function buildSystemTransporter() {
  const appEmail = process.env.APP_EMAIL || process.env.SMTP_USER;
  const appPass = process.env.APP_EMAIL_PASS || process.env.SMTP_PASS;

  if (!appEmail || !appPass) {
    throw new Error(
      "System SMTP credentials (APP_EMAIL, APP_EMAIL_PASS) are missing in environment variables.",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
      user: senderUser.smtp_user.trim(),
      pass: senderUser.smtp_pass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 60000,
  });
}

// User transporter for outgoing customer invoices
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

    auth: {
      user: senderUser.smtp_user.trim(),
      pass: senderUser.smtp_pass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 60000,
  });
}

// 1. NEW: Send Account Verification Email upon registration
async function sendVerificationEmail(userEmail, token) {
  const transporter = buildSystemTransporter();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Settle" <${process.env.APP_EMAIL || process.env.SMTP_USER}>`,
    to: userEmail.trim(),
    subject: "Verify your Settle Account Email",
    html: `
      <div style="font-family: Arial, sans-serif; color: #17140F; padding: 20px;">
        <h2>Welcome to Settle!</h2>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #17140F; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #6E6A5E; font-size: 13px;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

// 2. Send Invoice PDF Email
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

// 3. Send Overdue Reminder Email
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

module.exports = {
  sendVerificationEmail,
  sendInvoiceEmail,
  sendReminderEmail,
};
