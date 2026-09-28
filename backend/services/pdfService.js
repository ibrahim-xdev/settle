const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  const isProduction = process.env.NODE_ENV === "production";
  const localChromePath =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  // Configure launch options dynamically based on environment
  const launchOptions = {
    headless: "new",
    protocolTimeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  };

  // Only use local Windows Chrome path if NOT on production and the path exists locally
  if (!isProduction && fs.existsSync(localChromePath)) {
    launchOptions.executablePath = localChromePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // Set invoice HTML content
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    let filePath = null;

    // Only write PDF to physical disk in local development environments
    if (!isProduction) {
      const outputDir = path.join(__dirname, "../generated_invoices");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      filePath = path.join(outputDir, `${invoice.invoice_number}.pdf`);
    }

    // Generate PDF buffer (pass path locally, omit path on production)
    const pdfOptions = {
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    };

    if (filePath) {
      pdfOptions.path = filePath;
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    return { pdfBuffer: Buffer.from(pdfBuffer), filePath };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = generateInvoicePDF;
