// backend/config/db.js
const { Pool } = require("pg");
require("dotenv").config();

const dbUrl = process.env.DATABASE_URL || "";

// Detect if running locally (localhost / 127.0.0.1) vs remote production database
const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

const pool = new Pool({
  connectionString: dbUrl,
  // Use SSL for remote production DBs, disable for local PostgreSQL
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function initdb() {
  try {
    // 1. Create Users Table
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

    // 2. Add email verification columns safely
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;
    `);

    await pool.query(`UPDATE users 
SET is_verified = TRUE 
WHERE is_verified = FALSE`);

    // 3. Create Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        project_description TEXT,
        amount NUMERIC(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(100) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reminder_sent BOOLEAN DEFAULT FALSE
      );
    `);

    // Safely apply schema migration if table was created previously without user_id
    await pool.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
    `);

    console.log("✅ Database tables initialized successfully.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
}

// Automatically initialize schema on startup
initdb();

async function generateInvoiceNumber(userId) {
  const result = await pool.query(
    "SELECT COUNT(*) FROM invoices WHERE user_id = $1",
    [userId],
  );
  const count = parseInt(result.rows[0].count, 10) + 1;
  return `INV-${String(count).padStart(4, "0")}`;
}

module.exports = { pool, initdb, generateInvoiceNumber };
