# Settle

Automated invoicing for freelancers. Mark a project done, and Settle generates a professional PDF invoice, emails it to your client, and follows up on its own — with an AI-drafted reminder that gets firmer the longer a payment sits overdue.

Built as a solo full-stack project to solve a real problem in my own freelance work: forgetting to invoice promptly, and forgetting to chase late payments.

---

## What it does

- **Create an invoice** from a simple form — client, amount, due date, description
- **PDF generation** — a clean, professional invoice is generated automatically (Puppeteer renders an HTML template to PDF)
- **Auto-emailed** to the client the moment the invoice is created
- **Daily automated check** for overdue, unpaid invoices — no manual tracking required
- **AI-drafted reminder emails** — tone adjusts based on how overdue the payment is (gentle nudge early on, firmer language further out), generated per-invoice via the Gemini API
- **No duplicate reminders** — once a reminder is sent, that invoice won't be reminded again until manually reset
- **Multi-user support** — each user has their own invoices, dashboard, and SMTP sending credentials
- **Dashboard** — total invoiced, invoice count, average invoice value, and a live status table (pending / paid / overdue)

---

## Tech stack

**Frontend**

- React + Vite
- Tailwind CSS v4
- React Router v7 (protected routes, nested dashboard layout)
- Framer Motion (page transitions, staggered reveals, micro-interactions)
- Axios

**Backend**

- Node.js + Express
- PostgreSQL (`pg`, parameterized queries)
- JWT-based authentication
- Puppeteer (HTML → PDF)
- Nodemailer (SMTP email delivery, per-user credentials)
- node-cron (daily scheduled overdue check)
- Google Gemini API (AI-generated, tone-adjusted reminder emails)

---

## How the automation works

```
Invoice created
   → PDF generated + saved
   → Emailed to client immediately

Every day (cron job)
   → Find invoices past due date, still unpaid, not yet reminded
   → For each: calculate days overdue
   → Gemini drafts a reminder in a tone matching how late it is
   → Reminder emailed via the invoice owner's SMTP credentials
   → Invoice marked as reminded (won't be reminded again)
```

---

## Project structure

```
settle/
  backend/
    server.js              # Express app entry point
    db.js                  # PostgreSQL connection + schema setup
    cronJobs.js             # Daily overdue-invoice check
    reminderGenerator.js    # Gemini prompt + days-overdue logic
    pdfGenerator.js          # Puppeteer HTML → PDF
    templates/
      invoiceTemplate.js    # HTML invoice layout
    services/
      emailService.js       # Nodemailer wrapper (invoice + reminder emails)
      findOverDueInvoices.js
    generated_invoices/      # Saved PDF output (gitignored)

  frontend/
    src/
      AppRoutes.jsx          # Route definitions + page transitions
      main.jsx
      pages/
        landingPage.jsx
        LoginPage.jsx
        SignupPage.jsx
        DashboardLayout.jsx
        DashboardOverview.jsx
        SettingsPage.jsx
        NotFound.jsx
      components/
        Header.jsx / Hero.jsx / HowItWorks.jsx / Footer.jsx
        InvoiceMockup.jsx
        CreateInvoiceModel.jsx
        ProtectedRoute.jsx
        motionVariants.js    # Shared animation system
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/ibrahim-xdev/settle.git
cd settle

cd backend
npm install

cd ../frontend
npm install
```

### 2. Set up PostgreSQL

Create a database:

```sql
CREATE DATABASE settle;
```

### 3. Environment variables

Create `backend/.env` (see `backend/.env.example` for the full list):

```dotenv
PORT=5001
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/settle
RESEND_API_KEY=            # or leave blank if using Nodemailer/Gmail SMTP
SENDER_EMAIL=your_email@gmail.com
JWT_SECRET=a_long_random_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
OVERDUE_CRON_SCHEDULE=0 9 * * *
OVERDUE_CRON_TIMEZONE=Asia/Karachi
```

**Never commit `.env`** — only `.env.example` (with placeholder values) should be tracked in git.

If sending via Gmail, generate an [App Password](https://myaccount.google.com/apppasswords) rather than using your normal password.

### 4. Run it

```bash
# backend
cd backend
npm run dev

# frontend, in a separate terminal
cd frontend
npm run dev
```

Visit `http://localhost:5173`.

---

## Known limitations (and what I'd do at scale)

- **`node-cron` assumes a single running server instance.** If deployed across multiple instances for reliability, the cron job would run on each one and send duplicate reminders. At scale, this would move to a proper job queue (BullMQ + Redis) or a managed scheduler that guarantees exactly-once execution.
- **Gmail SMTP has sending limits** and isn't built for volume. A dedicated transactional email provider (Resend, SendGrid, Postmark) with a verified domain would be the production choice.
- **No payment integration yet.** Marking an invoice "paid" is manual. The natural next step is Stripe, with a webhook to auto-update invoice status the moment a client actually pays.
- **PDF generation happens on the request path.** Puppeteer is heavyweight; under real load this would move into a background job rather than blocking the invoice-creation request.

---

## Why this project

Most portfolio AI projects are demos you run once. This one is something I actually use — every invoice I send to a real client goes through this system, and the reminder-tone logic came directly from noticing I was either too soft or too abrupt chasing late payments myself.

---

## License

MIT
