const cron = require("node-cron");
const findOverDueInvoices = require("./services/findOverDueInvoices");
const {
  getDaysOverdue,
  generateReminderEmail,
} = require("./reminderGenerator");
const { sendReminderEmail } = require("./services/emailService");
const { pool } = require("./config/db");

const CRON_SCHEDULE = process.env.OVERDUE_CRON_SCHEDULE || "0 9 * * *";
const CRON_TIMEZONE = process.env.OVERDUE_CRON_TIMEZONE || "Asia/Karachi";

let isRunning = false;

async function checkOverdueInvoices() {
  if (isRunning) {
    console.log("Overdue invoice check is already running. Skipping this run.");
    return;
  }

  isRunning = true;
  console.log(
    `Running overdue invoice check at ${new Date().toISOString()}...`,
  );

  try {
    const overdueInvoices = await findOverDueInvoices();
    console.log(`Found ${overdueInvoices.length} overdue invoice(s) needing a reminder.`);

    for (const invoice of overdueInvoices) {
      try {
        const senderResult = await pool.query(
          `SELECT id, name, email, smtp_user, smtp_pass
           FROM users
           WHERE id = $1`,
          [invoice.user_id],
        );
        const senderUser = senderResult.rows[0];

        if (!senderUser) {
          console.error(
            `No sender user found for invoice ${invoice.invoice_number} (user_id=${invoice.user_id}). Skipping.`,
          );
          continue;
        }

        if (!senderUser.smtp_user || !senderUser.smtp_pass) {
          console.error(
            `SMTP credentials are missing for ${senderUser.email}. Invoice ${invoice.invoice_number} was not emailed.`,
          );
          continue;
        }

        const daysOverdue = getDaysOverdue(invoice.due_date);
        const reminderText = await generateReminderEmail(invoice, daysOverdue);

        await sendReminderEmail(invoice, reminderText, senderUser);

        await pool.query(
          `UPDATE invoices
           SET reminder_sent = TRUE
           WHERE id = $1`,
          [invoice.id],
        );

        console.log(
          `Reminder sent for ${invoice.invoice_number} (${daysOverdue} day(s) overdue) to ${invoice.client_email}`,
        );
      } catch (innerErr) {
        // Keep processing the remaining invoices if one invoice fails.
        console.error(
          `Failed to send reminder for ${invoice.invoice_number}:`,
          innerErr?.message || innerErr,
        );
      }
    }
  } catch (err) {
    console.error("Overdue check failed:", err?.message || err);
  } finally {
    isRunning = false;
  }
}

function startcronjobs() {
  if (!cron.validate(CRON_SCHEDULE)) {
    throw new Error(`Invalid overdue cron schedule: ${CRON_SCHEDULE}`);
  }

  cron.schedule(CRON_SCHEDULE, checkOverdueInvoices, {
    timezone: CRON_TIMEZONE,
  });

  console.log(
    `Cron job scheduled: overdue invoice check at ${CRON_SCHEDULE} (${CRON_TIMEZONE})`,
  );
}

module.exports = startcronjobs;
module.exports.checkOverdueInvoices = checkOverdueInvoices;
