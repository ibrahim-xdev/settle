require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const { initdb } = require("./config/db");
const startcronjobs = require("./cronjobs");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);

app.get("/", (req, res) => {
  res.send("Auto-Invoice Generator backend is running");
});

const PORT = process.env.PORT || 5001;
initdb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startcronjobs();
  });
});
