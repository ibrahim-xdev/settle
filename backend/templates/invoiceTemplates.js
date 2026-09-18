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

  formattedAmount = Number(parseFloat(amount) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
        font-family: 'Helvetica', Arial, sans-serif;
        color: #1a1a1a;
        padding: 50px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 50px;
      }
      .business-name {
        font-size: 22px;
        font-weight: bold;
      }
      .invoice-label {
        font-size: 28px;
        color: #888;
        text-align: right;
      }
      .invoice-number {
        font-size: 14px;
        color: #555;
        text-align: right;
        margin-top: 4px;
      }
      .details-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
      }
      .details-block h4 {
        font-size: 12px;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 8px;
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
        font-size: 12px;
        text-transform: uppercase;
        color: #888;
        border-bottom: 2px solid #eee;
        padding: 10px 0;
      }
      td {
        padding: 14px 0;
        font-size: 14px;
        border-bottom: 1px solid #eee;
      }
      .amount-col { text-align: right; }
      .total-row {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      .total-box {
        width: 250px;
      }
      .total-line {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 14px;
      }
      .total-line.final {
        border-top: 2px solid #1a1a1a;
        font-weight: bold;
        font-size: 16px;
        margin-top: 6px;
      }
      .footer {
        margin-top: 60px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }
    </style>
  </head>
  <body>
  <div class="header">
      <div class="business-name">Ibrahim — Web Development</div>
      <div>
        <div class="invoice-label">INVOICE</div>
        <div class="invoice-number">${invoice_number}</div>
      </div>
    </div>

    <div class="details-row">
      <div class="details-block">
        <h4>Billed to</h4>
        <p>${client_name}<br>${client_email}</p>
      </div>
      <div class="details-block">
        <h4>Issue date</h4>
        <p>${issueDate}</p>
        <h4 style="margin-top: 16px;">Due date</h4>
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
    </table>

    <div class="total-row">
      <div class="total-box">
        <div class="total-line final">
          <span>Total due</span>
          <span>$${formattedAmount}</span>
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
