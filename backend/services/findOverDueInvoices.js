const { pool } = require("../config/db");

async function findOverDueInvoices() {
  const result = await pool.query(`
    SELECT *
    FROM invoices
    WHERE due_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::date
      AND status = 'pending'
      AND reminder_sent = FALSE
    ORDER BY due_date ASC, id ASC
  `);

  return result.rows;
}

module.exports = findOverDueInvoices;
