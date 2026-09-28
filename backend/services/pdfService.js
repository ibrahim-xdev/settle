const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);
  const isProduction = process.env.NODE_ENV === "production";
  const localChromePath =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  let executablePath;
  if (isProduction) {
    executablePath = await chromium.executablePath();
  } else if (fs.existsSync(localChromePath)) {
    executablePath = localChromePath;
  } else {
    executablePath = await chromium.executablePath();
  }

  const browser = await puppeteer.launch({
    args: isProduction
      ? chromium.args
      : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: isProduction ? chromium.headless : "new",
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    return { pdfBuffer: Buffer.from(pdfBuffer) };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = generateInvoicePDF;
