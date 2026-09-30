const nodemailer = require("nodemailer");

// ============================================================
// SYSTEM EMAIL TRANSPORTER
// Used for application emails such as account verification.
// ============================================================

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

    // Force IPv4 on Render
    family: 4,

    auth: {
      user: appEmail.trim(),
      pass: appPass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 60000,
  });
}

// ============================================================
// USER EMAIL TRANSPORTER
// Used when sending an invoice from the logged-in user's
// configured Gmail account.
// ============================================================
function buildTransporter(senderUser) {
  if (!senderUser) {
    throw new Error("Sender user information is missing.");
  }

  if (!senderUser.smtp_user || !senderUser.smtp_pass) {
    throw new Error(
      "You must configure your Gmail address and Gmail App Password before sending emails.",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    // Force IPv4 on Render
    family: 4,

    auth: {
      user: senderUser.smtp_user.trim(),
      pass: senderUser.smtp_pass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 60000,
  });
}
// ============================================================
// ACCOUNT VERIFICATION EMAIL
// ============================================================

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

        <p>
          Please click the button below to verify your email address
          and activate your account:
        </p>

        <p style="margin: 24px 0;">
          <a
            href="${verificationUrl}"
            style="
              background-color: #17140F;
              color: #ffffff;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              display: inline-block;
            "
          >
            Verify Email
          </a>
        </p>

        <p style="color: #6E6A5E; font-size: 13px;">
          Or copy and paste this link into your browser:
        </p>

        <p style="font-size: 13px;">
          <a href="${verificationUrl}">
            ${verificationUrl}
          </a>
        </p>

        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </div>
    `,
  };

  const result = await transporter.sendMail(mailOptions);

  console.log(
    `✅ Verification email sent to ${userEmail}. Message ID: ${result.messageId}`,
  );

  return result;
}

// ============================================================
// INVOICE EMAIL
// ============================================================

async function sendInvoiceEmail(invoice, pdfBuffer, senderUser) {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error(
      "Cannot send invoice email because the PDF buffer is empty.",
    );
  }

  const transporter = buildTransporter(senderUser);

  const formattedAmount = Number(
    parseFloat(invoice.amount) || 0,
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dueDate = new Date(invoice.due_date);

  const mailOptions = {
    from: `"${senderUser.name}" <${senderUser.smtp_user.trim()}>`,

    to: invoice.client_email.trim(),

    subject: `Invoice ${invoice.invoice_number} from ${senderUser.name}`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hi ${invoice.client_name},</p>

        <p>
          Please find attached invoice
          <strong>${invoice.invoice_number}</strong>
          for
          <strong>$${formattedAmount}</strong>.
        </p>

        <p>
          Due Date:
          ${dueDate.toLocaleDateString("en-US")}
        </p>

        <br />

        <p>Thank you for your business!</p>

        <p>
          Best regards,<br />
          ${senderUser.name}
        </p>
      </div>
    `,

    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  console.log(
    `📤 Sending email to ${invoice.client_email} using ${senderUser.smtp_user}...`,
  );

  const result = await transporter.sendMail(mailOptions);

  console.log(
    `✅ Email accepted by SMTP server. Message ID: ${result.messageId}`,
  );

  console.log(
    `📬 SMTP response: ${result.response || "No SMTP response provided"}`,
  );

  return result;
}

// ============================================================
// OVERDUE REMINDER EMAIL
// ============================================================

async function sendReminderEmail(invoice, reminderText, senderUser) {
  const transporter = buildTransporter(senderUser);

  const mailOptions = {
    from: `"${senderUser.name}" <${senderUser.smtp_user.trim()}>`,

    to: invoice.client_email.trim(),

    subject: `Reminder: Invoice ${invoice.invoice_number} is overdue`,

    html: `
      <p>
        ${reminderText.replace(/\n/g, "<br/>")}
      </p>
    `,
  };

  const result = await transporter.sendMail(mailOptions);

  console.log(
    `✅ Reminder email sent to ${invoice.client_email}. Message ID: ${result.messageId}`,
  );

  return result;
}

module.exports = {
  sendVerificationEmail,
  sendInvoiceEmail,
  sendReminderEmail,
};
