// backend/config/db.js

const { Pool } = require("pg");

require("dotenv").config();

const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl) {
  console.warn("⚠️ DATABASE_URL is not configured.");
}

const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

const pool = new Pool({
  connectionString: dbUrl,

  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false,
      },
});

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

async function initdb() {
  try {
    // --------------------------------------------------------
    // USERS
    // --------------------------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        smtp_user VARCHAR(255),
        smtp_pass VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;
    `);

    // Existing application users are considered verified.
    await pool.query(`
      UPDATE users
      SET is_verified = TRUE
      WHERE is_verified = FALSE;
    `);

    // --------------------------------------------------------
    // INVOICES
    // --------------------------------------------------------

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,

        user_id INT
          REFERENCES users(id)
          ON DELETE CASCADE,

        invoice_number VARCHAR(100)
          UNIQUE NOT NULL,

        client_name VARCHAR(255)
          NOT NULL,

        client_email VARCHAR(255)
          NOT NULL,

        project_description TEXT,

        amount NUMERIC(10, 2)
          NOT NULL,

        due_date DATE
          NOT NULL,

        -- Payment status
        status VARCHAR(100)
          DEFAULT 'pending',

        -- PDF/email delivery status
        delivery_status VARCHAR(50)
          DEFAULT 'processing',

        delivery_error TEXT,

        created_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP,

        reminder_sent BOOLEAN
          DEFAULT FALSE
      );
    `);

    // --------------------------------------------------------
    // SAFE MIGRATIONS FOR EXISTING DATABASES
    // --------------------------------------------------------

    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS
        user_id INT
        REFERENCES users(id)
        ON DELETE CASCADE;
    `);

    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS
        delivery_status VARCHAR(50)
        DEFAULT 'processing';
    `);

    await pool.query(`
      ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS
        delivery_error TEXT;
    `);

    console.log("✅ Database tables initialized successfully.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);

    throw err;
  }
}

// ============================================================
// INVOICE NUMBER
// ============================================================

async function generateInvoiceNumber(userId) {
  const result = await pool.query(
    `
      SELECT COUNT(*)
      FROM invoices
      WHERE user_id = $1
    `,
    [userId],
  );

  const count = parseInt(result.rows[0].count, 10) + 1;

  return `INV-${String(count).padStart(4, "0")}`;
}

// ============================================================
// FIND OVERDUE INVOICES
// ============================================================

async function findOverDueInvoices() {
  const result = await pool.query(`
    SELECT *
    FROM invoices
    WHERE due_date < CURRENT_DATE
      AND status = 'pending'
      AND reminder_sent = FALSE
    ORDER BY due_date ASC;
  `);

  return result.rows;
}

// ============================================================
// INITIALIZE DATABASE
// ============================================================

initdb().catch((error) => {
  console.error("❌ Database startup initialization failed:", error);
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  pool,
  initdb,
  generateInvoiceNumber,
  findOverDueInvoices,
};
