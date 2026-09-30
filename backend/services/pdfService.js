const fs = require("fs");
const os = require("os");
const path = require("path");

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;

const generateInvoiceHTML = require("../templates/invoiceTemplates");

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((error) => {
      browserPromise = null;
      throw error;
    });
  }

  return browserPromise;
}

async function launchBrowser() {
  const isRender =
    process.env.RENDER === "true" ||
    process.env.RENDER_SERVICE_ID ||
    process.env.NODE_ENV === "production";

  let executablePath;

  if (isRender) {
    console.log("🚀 Running Chromium in Render environment...");

    executablePath = await chromium.executablePath();

    console.log("📍 Chromium executable:", executablePath);

    if (!executablePath) {
      throw new Error("Chromium executable path could not be determined.");
    }

    if (!fs.existsSync(executablePath)) {
      throw new Error(`Chromium executable does not exist: ${executablePath}`);
    }

    const stats = fs.statSync(executablePath);

    console.log("📦 Chromium size:", stats.size);
    console.log("📁 Chromium path:", executablePath);

    return puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });
  }

  // Local development
  const possibleLocalPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  executablePath = possibleLocalPaths.find((p) => fs.existsSync(p));

  if (!executablePath) {
    throw new Error("Chrome/Chromium executable not found.");
  }

  console.log("💻 Local Chromium:", executablePath);

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  });
}

async function generateInvoicePDF(invoice) {
  console.log(`📄 Starting PDF generation for ${invoice.invoice_number}`);

  const html = generateInvoiceHTML(invoice);

  let browser;

  try {
    browser = await getBrowser();

    console.log(`🌐 Opening PDF page for ${invoice.invoice_number}`);

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    console.log(`🖨️ Creating PDF for ${invoice.invoice_number}`);

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await page.close();

    const pdfBuffer = Buffer.from(pdfUint8Array);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF is empty.");
    }

    console.log(
      `✅ PDF generated successfully: ${invoice.invoice_number} (${pdfBuffer.length} bytes)`,
    );

    return {
      pdfBuffer,
    };
  } catch (error) {
    console.error(
      `❌ PDF Generation Error for ${invoice.invoice_number}:`,
      error,
    );

    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

module.exports = generateInvoicePDF;
