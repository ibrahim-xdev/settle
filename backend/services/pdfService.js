const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const generateInvoiceHTML = require("../templates/invoiceTemplates");

async function generateInvoicePDF(invoice) {
  const html = generateInvoiceHTML(invoice);

  const browser = await puppeteer.launch({
    args: ["--no--sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.emulateMediaType("print");
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  const outputDir = path.join(__dirname, "../generated_invoices");

  await browser.close();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${invoice.invoice_number}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);

  return { pdfBuffer: Buffer.from(pdfBuffer), filePath };
}

module.exports = generateInvoicePDF;
