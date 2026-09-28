const { z } = require("zod");

// User Registration Schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// User Login Schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Invoice Creation & Editing Schema
const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid client email address"),
  projectDescription: z.string().min(1, "Project description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

// Validation Middleware Generator
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      error: err.errors ? err.errors[0].message : "Validation failed",
    });
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  invoiceSchema,
  validate,
};
