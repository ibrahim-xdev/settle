const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const { sendVerificationEmail } = require("../services/emailService");
const {
  registerSchema,
  loginSchema,
  validate,
} = require("../middleware/validate");

const router = express.Router();

// REGISTER (WITH ZOD VALIDATION)
router.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password, smtpUser, smtpPass } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanEmail = email.toLowerCase().trim();

    // Generate secure random verification token & 24-hour expiration date
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Clean App Password string if provided
    const cleanSmtpPass = smtpPass ? smtpPass.replace(/\s+/g, "").trim() : null;

    // Insert user into DB (is_verified defaults to FALSE)
    const result = await pool.query(
      `INSERT INTO users (
        name, 
        email, 
        password_hash, 
        smtp_user, 
        smtp_pass, 
        is_verified, 
        verification_token, 
        verification_expires
      ) 
      VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7) 
      RETURNING id, name, email, is_verified`,
      [
        name,
        cleanEmail,
        hashedPassword,
        smtpUser ? smtpUser.trim().toLowerCase() : cleanEmail,
        cleanSmtpPass,
        verificationToken,
        verificationExpires,
      ],
    );

    const newUser = result.rows[0];

    // Send Verification Email via system SMTP transporter
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message:
        "Registration successful! Please check your email inbox to verify your account.",
      user: newUser,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Email address is already registered." });
    }
    console.error("Register Error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// VERIFY EMAIL ENDPOINT
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required." });
  }

  try {
    // Query for non-expired token match
    const result = await pool.query(
      `SELECT id FROM users 
       WHERE verification_token = $1 AND verification_expires > CURRENT_TIMESTAMP`,
      [token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token." });
    }

    const userId = result.rows[0].id;

    // Activate user account and clear token fields
    await pool.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL 
       WHERE id = $1`,
      [userId],
    );

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ error: "Email verification failed." });
  }
});

// LOGIN (WITH ZOD VALIDATION & VERIFICATION CHECK)
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email.toLowerCase().trim(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = result.rows[0];

    // Password validation using bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Block login if the account hasn't been verified via email
    if (!user.is_verified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in.",
        isUnverified: true,
      });
    }

    // Issue JWT Token
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
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed." });
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
      [name, cleanEmail, cleanPass, req.user.id],
    );

    res.json({ message: "Settings saved successfully." });
  } catch (err) {
    console.error("Settings Update Error:", err);
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

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      smtp_user: user.smtp_user,
      smtp_pass: user.smtp_pass || "",
    });
  } catch (err) {
    console.error("Fetch User Error:", err);
    res.status(500).json({ error: "Failed to fetch user credentials." });
  }
});

module.exports = router;
