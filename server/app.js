const express = require("express");
const path = require("path");
const cors = require("cors");

/* ===========================
   ROUTES
=========================== */

const payrollRoutes = require("./routes/payroll");
const employeeRoutes = require("./routes/employees");
const companyRoutes = require("./routes/company");
const emailRoutes = require("./routes/email");
const ytdRoutes = require("./routes/ytd");
const backupRoutes = require("./routes/backup");

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/* ===========================
   STATIC UPLOADS
=========================== */

const fs = require("fs");

const uploadsPath = process.env.APPDATA
  ? path.join(process.env.APPDATA, "payroll-app", "uploads")
  : path.join(__dirname, "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

/* ===========================
   API ROUTES
=========================== */

app.use("/api/payroll", payrollRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/ytd", ytdRoutes);
app.use("/api/backup", backupRoutes);

/* ===========================
   VERSION CHECK
=========================== */

const packageJson = require("../package.json");

app.get("/api/version", (req, res) => {
  res.json({ version: packageJson.version });
});

/* ===========================
   PRODUCTION REACT SERVE
   (MUST BE LAST)
=========================== */

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../client/build/index.html")
    );
  });
}

/* ===========================
   START SERVER
=========================== */

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

