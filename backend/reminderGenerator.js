const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_MAX_ATTEMPTS = 2;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function getDaysOverdue(dueDate) {
  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
}

function formatDueDate(dueDate) {
  const date = new Date(`${dueDate}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(dueDate)
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function fallbackReminderEmail(invoice, daysOverDue) {
  const dueDate = formatDueDate(invoice.due_date);
  const amount = Number(invoice.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (daysOverDue <= 3) {
    return `Hi ${invoice.client_name},\n\nJust a friendly reminder that invoice ${invoice.invoice_number} for $${amount} was due on ${dueDate}. It is currently ${daysOverDue} day(s) overdue.\n\nPlease let me know if payment has already been arranged or if you need anything from me.\n\nBest regards,\nIbrahim`;
  }

  if (daysOverDue <= 7) {
    return `Hi ${invoice.client_name},\n\nI’m following up regarding invoice ${invoice.invoice_number} for $${amount}, which was due on ${dueDate}. The invoice is now ${daysOverDue} day(s) overdue.\n\nPlease arrange payment at your earliest convenience, or let me know if there is an issue with the invoice.\n\nBest regards,\nIbrahim`;
  }

  return `Hi ${invoice.client_name},\n\nThis is a follow-up regarding invoice ${invoice.invoice_number} for $${amount}, which was due on ${dueDate} and is now ${daysOverDue} day(s) overdue.\n\nPlease confirm when payment is expected. If there is any issue with the invoice, please let me know so we can resolve it.\n\nBest regards,\nIbrahim`;
}

function getToneInstruction(daysOverDue) {
  if (daysOverDue <= 3) {
    return "Gentle and casual. Assume the client simply forgot. Do not pressure them.";
  }

  if (daysOverDue <= 7) {
    return "Polite but more direct. Mention the due date and request payment.";
  }

  return "Firm and professional, but not rude. Ask for a clear payment timeline.";
}

async function generateReminderEmail(invoice, daysOverDue) {
  if (!genAI) {
    console.warn("GEMINI_API_KEY is not configured. Using fallback reminder email.");
    return fallbackReminderEmail(invoice, daysOverDue);
  }

  const prompt = `Write a short follow-up email reminding a client about an overdue invoice.

Client name: ${invoice.client_name}
Invoice number: ${invoice.invoice_number}
Amount: $${invoice.amount}
Due date: ${formatDueDate(invoice.due_date)}
Days overdue: ${daysOverDue}

Tone: ${getToneInstruction(daysOverDue)}

Requirements:
- Write only the email body.
- No subject line.
- Keep it under 100 words.
- Do not invent payment methods, links, fees, or other facts.
- Sign off as Ibrahim.`;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const interaction = await genAI.interactions.create({
        model: GEMINI_MODEL,
        input: prompt,
      });

      const text = interaction.output_text?.trim();
      if (text) return text;

      throw new Error("Gemini returned an empty response.");
    } catch (error) {
      console.error(
        `Gemini reminder generation failed (attempt ${attempt}/${GEMINI_MAX_ATTEMPTS}):`,
        error?.message || error,
      );

      if (attempt < GEMINI_MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  console.warn(
    `Using fallback reminder for ${invoice.invoice_number} because Gemini was unavailable.`,
  );
  return fallbackReminderEmail(invoice, daysOverDue);
}

module.exports = { getDaysOverdue, generateReminderEmail };
