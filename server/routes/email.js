const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const db = require("../db");

router.post("/test", async (req, res) => {
  const { testEmail } = req.body;

  try {
    const company = db.prepare("SELECT * FROM company LIMIT 1").get();

    if (!company) {
      return res.status(400).json({ error: "Company settings missing" });
    }

    const transporter = nodemailer.createTransport({
      host: company.smtp_host,
      port: Number(company.smtp_port),
      secure: !!company.smtp_secure,
      auth: {
        user: company.smtp_user,
        pass: company.smtp_pass
      }
    });

    const info = await transporter.sendMail({
      from: company.smtp_from,
      to: testEmail,
      subject: "Payroll Test Email",
      text: "SMTP configuration successful."
    });

    res.json({ success: true, messageId: info.messageId });

  } catch (err) {
    console.error("Email test failed:", err);
    res.status(500).json({ error: "Email failed", details: err.message });
  }
});

module.exports = router;