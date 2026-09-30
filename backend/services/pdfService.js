const fs = require("fs");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium").default;
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  let browser = null;

  try {
    console.log(`📄 Starting PDF generation for ${invoice.invoice_number}...`);

    const html = generateInvoiceHTML(invoice);

    /*
     * Render / production environments should always use
     * @sparticuz/chromium.
     *
     * We don't rely only on NODE_ENV because deployment
     * environments don't always have it configured exactly
     * as expected.
     */
    const isRender =
      process.env.RENDER === "true" ||
      process.env.RENDER_SERVICE_ID ||
      process.env.NODE_ENV === "production";

    let executablePath;
    let launchArgs;
    let headlessMode;

    if (isRender) {
      console.log("🌐 Production/Render environment detected.");
      console.log("📦 Loading Sparticuz Chromium...");

      executablePath = await chromium.executablePath();

      if (!executablePath) {
        throw new Error(
          "Chromium executable path could not be resolved in production.",
        );
      }

      launchArgs = [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ];

      headlessMode = "shell";

      console.log(`✅ Chromium executable: ${executablePath}`);
    } else {
      console.log("💻 Local development environment detected.");

      const possibleLocalPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
      ];

      executablePath = possibleLocalPaths.find((filePath) =>
        fs.existsSync(filePath),
      );

      if (!executablePath) {
        throw new Error(
          "Chrome/Chromium executable not found on local machine.",
        );
      }

      launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ];

      headlessMode = true;

      console.log(`✅ Local Chrome executable: ${executablePath}`);
    }

    console.log("🚀 Launching browser...");

    browser = await puppeteer.launch({
      executablePath,
      args: launchArgs,
      headless: headlessMode,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    console.log("✅ Browser launched.");

    const page = await browser.newPage();

    /*
     * Prevent external resources from causing PDF generation
     * to wait indefinitely.
     */
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    /*
     * Wait for fonts if the browser supports the Font Loading API.
     * This is safer than waiting for networkidle0.
     */
    try {
      await page.evaluate(async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
      });
    } catch (fontError) {
      console.warn(
        "⚠️ Font loading wait failed, continuing with PDF generation:",
        fontError.message,
      );
    }

    console.log("🖨️ Creating PDF...");

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    const pdfBuffer = Buffer.from(pdfUint8Array);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("PDF was generated but the resulting buffer is empty.");
    }

    console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);

    return {
      pdfBuffer,
    };
  } catch (error) {
    console.error(
      `❌ PDF Generation Error for ${invoice.invoice_number}:`,
      error,
    );

    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("🧹 Browser closed.");
      } catch (closeError) {
        console.error("⚠️ Failed to close browser:", closeError);
      }
    }
  }
}

module.exports = generateInvoicePDF;
