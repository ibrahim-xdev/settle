const fs = require("fs");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  const isProduction = process.env.NODE_ENV === "production";

  let executablePath;

  if (isProduction) {
    executablePath = await chromium.executablePath();
  } else {
    const possibleLocalPaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];

    executablePath = possibleLocalPaths.find((p) => fs.existsSync(p));

    if (!executablePath) {
      throw new Error("Chrome/Chromium executable not found on local machine.");
    }
  }

  console.log("Chromium executable:", executablePath);

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: isProduction
        ? chromium.args
        : [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],

      executablePath,

      headless: isProduction ? "shell" : true,

      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000,
    });

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

    return {
      pdfBuffer: Buffer.from(pdfUint8Array),
    };
  } catch (error) {
    console.error("PDF Generation Error Details:", error);

    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = generateInvoicePDF;
