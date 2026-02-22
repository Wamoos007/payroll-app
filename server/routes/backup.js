const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DB_PATH = process.env.DB_PATH ||
  path.join(__dirname, "../payroll.db");

const BACKUP_DIR = path.join(__dirname, "../backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

/**
 * CREATE BACKUP
 * GET /api/backup
 */
router.get("/", (req, res) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const backupFile = path.join(
      BACKUP_DIR,
      `payroll-backup-${timestamp}.db`
    );

    fs.copyFileSync(DB_PATH, backupFile);

    res.json({
      success: true,
      message: "Backup created successfully",
      file: backupFile
    });
  } catch (err) {
    console.error("Backup error:", err);
    res.status(500).json({ error: "Backup failed" });
  }
});

/**
 * RESTORE LAST BACKUP
 * POST /api/backup/restore
 */
router.post("/restore", (req, res) => {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith(".db"))
      .sort()
      .reverse();

    if (files.length === 0) {
      return res
        .status(400)
        .json({ error: "No backups found" });
    }

    const latestBackup = path.join(
      BACKUP_DIR,
      files[0]
    );

    fs.copyFileSync(latestBackup, DB_PATH);

    res.json({
      success: true,
      message: "Database restored from latest backup"
    });
  } catch (err) {
    console.error("Restore error:", err);
    res.status(500).json({ error: "Restore failed" });
  }
});

module.exports = router;