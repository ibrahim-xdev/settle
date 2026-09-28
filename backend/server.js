const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import Routes using require
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

// 1. Helmet Security Headers
app.use(helmet());

// 2. Strict CORS Configuration
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation: Access denied."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

app.use(express.json());

// 3. Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const invoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Higher limit for invoice reads/writes
  message: {
    error:
      "Too many invoice operations from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Mount Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/invoices", invoiceLimiter, invoiceRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message);
  res.status(500).json({ error: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🔒 CommonJS Settle Server running on port ${PORT}`);
});
