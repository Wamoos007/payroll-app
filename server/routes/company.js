const express = require("express");
const router = express.Router();
const db = require("../db");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ======================================================
   ENSURE UPLOAD DIRECTORY EXISTS
====================================================== */

const { app } = require("electron");

const uploadDir = process.env.DB_PATH
  ? path.join(
      path.dirname(process.env.DB_PATH),
      "uploads"
    )
  : path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ======================================================
   MULTER STORAGE CONFIG
====================================================== */

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, "logo.png"); // overwrite existing logo
  }
});

const upload = multer({ storage });

/* ======================================================
   GET COMPANY
====================================================== */

router.get("/", (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM company LIMIT 1").get();
    res.json(row || {});
  } catch (err) {
    console.error("Company load error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* ======================================================
   SAVE COMPANY (UPDATED WITH REGISTRATION NUMBER)
====================================================== */

router.post("/", (req, res) => {
  const {
    name,
    registration_number,
    address,
    contact_email,
    contact_number,
    logo_path,
    signature_image
  } = req.body;

  try {
    const existing = db.prepare("SELECT id FROM company LIMIT 1").get();

    if (existing) {
      db.prepare(`
        UPDATE company
        SET name = ?,
            registration_number = ?,
            address = ?,
            contact_email = ?,
            contact_number = ?,
            logo_path = ?,
            signature_image = ?
        WHERE id = ?
      `).run(
        name,
        registration_number,
        address,
        contact_email,
        contact_number,
        logo_path,
        signature_image,
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO company
        (name, registration_number, address, contact_email, contact_number, logo_path, signature_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        name,
        registration_number,
        address,
        contact_email,
        contact_number,
        logo_path,
        signature_image
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Company save error:", err);
    res.status(500).json({ error: "Save failed" });
  }
});

/* ======================================================
   UPLOAD LOGO
====================================================== */

router.post("/upload-logo", upload.single("logo"), (req, res) => {
  try {
    res.json({
      logo_path: "/uploads/logo.png"
    });
  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;