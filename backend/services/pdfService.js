const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  const browser = await puppeteer.launch({
    headless: "new",
    // Points directly to installed Chrome on Windows
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    protocolTimeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
    ],
  });

  try {
    const page = await browser.newPage();

    // Bypass Network domain enablement hanging by setting direct HTML content
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    const outputDir = path.join(__dirname, "../generated_invoices");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, `${invoice.invoice_number}.pdf`);

    const pdfBuffer = await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    return { pdfBuffer: Buffer.from(pdfBuffer), filePath };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = generateInvoicePDF;
