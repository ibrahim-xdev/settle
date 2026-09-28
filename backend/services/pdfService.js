const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);
  const isProduction = process.env.NODE_ENV === "production";

  // Common local Chrome paths across Windows and Linux
  const possibleLocalPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];

  let executablePath = null;

  if (isProduction) {
    executablePath = await chromium.executablePath();
  } else {
    for (const p of possibleLocalPaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }
    // Fallback to sparticuz chromium if no local Chrome is found in dev
    if (!executablePath) {
      executablePath = await chromium.executablePath();
    }
  }

  // Set up robust production and development launch flags
  const launchArgs = isProduction
    ? [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ]
    : ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport || { width: 1280, height: 720 },
      executablePath,
      headless: isProduction ? chromium.headless : true,
    });

    const page = await browser.newPage();

    // Set HTML content and wait until network idle for external assets/fonts
    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000,
    });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    return { pdfBuffer: Buffer.from(pdfUint8Array) };
  } catch (error) {
    console.error("PDF Generation Error Details:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

module.exports = generateInvoicePDF;
