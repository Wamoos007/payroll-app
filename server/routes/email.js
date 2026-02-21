const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const db = require("../db");

/* ======================================================
   SEND TEST EMAIL
====================================================== */

router.post("/test", async (req, res) => {
  try {
    const company = db.prepare("SELECT * FROM company LIMIT 1").get();

    if (!company || !company.smtp_host) {
      return res.status(400).json({
        error: "SMTP settings not configured"
      });
    }

    const transporter = nodemailer.createTransport({
      host: company.smtp_host,
      port: Number(company.smtp_port),
      secure: company.smtp_secure === 1,
      auth: {
        user: company.smtp_user,
        pass: company.smtp_pass
      }
    });

    await transporter.sendMail({
      from: company.smtp_from,
      to: company.smtp_from, // send to yourself
      subject: "Payroll App Test Email",
      text: "SMTP configuration is working correctly."
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SMTP Test Error:", err);
    res.status(500).json({
      error: "Failed to send test email",
      details: err.message
    });
  }
});

module.exports = router;