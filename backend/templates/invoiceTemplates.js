function generateInvoiceHTML(invoice) {
  const {
    invoice_number,
    client_name,
    client_email,
    project_description,
    amount,
    due_date,
    created_at,
  } = invoice;

  // Fixed missing 'const' variable declaration
  const formattedAmount = Number(parseFloat(amount) || 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  const issueDate = new Date(created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDate = new Date(due_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #1a1a1a;
        padding: 40px;
        background-color: #ffffff;
      }
      .clearfix::after {
        content: "";
        clear: both;
        display: table;
      }
      .header {
        margin-bottom: 40px;
      }
      .header-left {
        float: left;
      }
      .header-right {
        float: right;
        text-align: right;
      }
      .business-name {
        font-size: 20px;
        font-weight: bold;
      }
      .invoice-label {
        font-size: 26px;
        color: #888;
        font-weight: bold;
      }
      .invoice-number {
        font-size: 14px;
        color: #555;
        margin-top: 4px;
      }
      .details-row {
        margin-bottom: 30px;
      }
      .details-left {
        float: left;
        width: 50%;
      }
      .details-right {
        float: right;
        width: 50%;
        text-align: right;
      }
      .details-block h4 {
        font-size: 11px;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .details-block p {
        font-size: 14px;
        line-height: 1.5;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      th {
        text-align: left;
        font-size: 11px;
        text-transform: uppercase;
        color: #888;
        border-bottom: 2px solid #eee;
        padding: 10px 0;
        letter-spacing: 0.5px;
      }
      td {
        padding: 14px 0;
        font-size: 14px;
        border-bottom: 1px solid #eee;
      }
      .amount-col { text-align: right; }
      .total-container {
        float: right;
        width: 250px;
        margin-top: 10px;
      }
      .total-line {
        padding: 8px 0;
        font-size: 14px;
      }
      .total-line.final {
        border-top: 2px solid #1a1a1a;
        font-weight: bold;
        font-size: 16px;
        margin-top: 6px;
      }
      .total-label { float: left; }
      .total-value { float: right; }
      .footer {
        margin-top: 80px;
        font-size: 12px;
        color: #888;
        text-align: center;
        clear: both;
      }
    </style>
  </head>
  <body>
    <div class="header clearfix">
      <div class="header-left">
        <div class="business-name">Ibrahim — Web Development</div>
      </div>
      <div class="header-right">
        <div class="invoice-label">INVOICE</div>
        <div class="invoice-number">${invoice_number}</div>
      </div>
    </div>

    <div class="details-row clearfix">
      <div class="details-left details-block">
        <h4>Billed to</h4>
        <p>${client_name}<br>${client_email}</p>
      </div>
      <div class="details-right details-block">
        <h4>Issue date</h4>
        <p>${issueDate}</p>
        <h4 style="margin-top: 14px;">Due date</h4>
        <p>${dueDate}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount-col">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${project_description}</td>
          <td class="amount-col">$${formattedAmount}</td>
        </tr>
      </tbody>
     Kue
    </table>

    <div class="clearfix">
      <div class="total-container">
        <div class="total-line final clearfix">
          <span class="total-label">Total due</span>
          <span class="total-value">$${formattedAmount}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Thank you for your business. Please pay by the due date above.
    </div>
  </body>
  </html>
  `;
}

module.exports = generateInvoiceHTML;
