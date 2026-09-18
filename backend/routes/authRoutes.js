const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, smtpUser, smtpPass } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, smtp_user, smtp_pass) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, smtp_user`,
      [
        name,
        email.toLowerCase().trim(),
        hashedPassword,
        smtpUser ? smtpUser.trim() : email.toLowerCase().trim(),
        smtpPass ? smtpPass.trim() : null,
      ],
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already Registered." });
    }
    console.error(err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email.toLowerCase().trim(),
    ]);

    if (result.rows[0].length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasSmtpConfigured: !!user.smtp_pass,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login Failed." });
  }
});

// PUT /api/auth/settings
router.put("/settings", authenticateToken, async (req, res) => {
  const { name, smtp_user, smtp_pass } = req.body;

  if (!smtp_user || !smtp_pass) {
    return res.status(400).json({
      error:
        "Both SMTP Email (user) and Gmail App Password (pass) are required.",
    });
  }

  const cleanEmail = smtp_user.trim().toLowerCase();
  const cleanPass = smtp_pass.replace(/\s+/g, "").trim();

  try {
    await pool.query(
      "UPDATE users SET name = $1, smtp_user = $2, smtp_pass = $3 WHERE id = $4",
      [name, cleanEmail, cleanPass.replace(/\s+/g, ""), req.user.id],
    );

    res.json({ message: "Settings saved successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings in database." });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, smtp_user, smtp_pass FROM users WHERE id = $1",
      [req.user.id],
    );
    res.json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user credentials." });
  }
});

module.exports = router;
