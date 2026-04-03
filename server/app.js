const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const { getUploadsPath } = require("./paths");
const {
  getSessionStatus,
  getWriteLockError,
  hasWriteAccess,
  initializeSessionLock,
  refreshSessionLock
} = require("./sessionLock");

const app = express();

/* ===========================
   MIDDLEWARE
=========================== */

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/email/")) {
    return next();
  }

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  if (hasWriteAccess()) {
    return next();
  }

  return res.status(423).json(getWriteLockError());
});

/* ===============================
              EMAIL
  ===============================*/
const emailRoutes = require("./routes/email");
app.use("/api/email", emailRoutes);


/* ===========================
   STATIC UPLOADS
=========================== */

const uploadsPath = getUploadsPath();

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

/* ===========================
   API ROUTES
=========================== */

const payrollRoutes = require("./routes/payroll");
const employeeRoutes = require("./routes/employees");
const companyRoutes = require("./routes/company");
const ytdRoutes = require("./routes/ytd");
const backupRoutes = require("./routes/backup");
const settingsRoutes = require("./routes/settings");

app.use("/api/payroll", payrollRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/ytd", ytdRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/settings", settingsRoutes);

/* ===========================
   VERSION CHECK
=========================== */

const packageJson = require("../package.json");

app.get("/api/version", (req, res) => {
  res.json({ version: packageJson.version });
});

app.get("/api/session", (req, res) => {
  res.json(refreshSessionLock());
});

/* ===========================
   PRODUCTION REACT SERVE
   (MUST BE LAST)
=========================== */

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");

  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

/* ===========================
   START SERVER
=========================== */

function startServer(port = Number(process.env.PORT || 3001)) {
  const session = initializeSessionLock(packageJson.version);

  console.log(
    `Session mode: ${session.accessMode} (${session.currentSession.holderName})`
  );

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      resolve(server);
    });

    server.on("error", reject);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
