const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const db = require("../db");

/* ================================
   CREATE SMTP TRANSPORTER
================================ */

function createTransporter(company) {
  return nodemailer.createTransport({
    host: company.smtp_host,
    port: Number(company.smtp_port),
    secure: company.smtp_secure === 1,
    auth: {
      user: company.smtp_user,
      pass: company.smtp_pass
    }
  });
}

/* ================================
   SEND PAYSLIP (PDF FROM FRONTEND)
================================ */

router.post("/send-payslip", async (req, res) => {
  console.log("BODY RECEIVED:", req.body);
  try {
    const { email, full_name, pdfBase64 } = req.body;

    if (!email || !pdfBase64) {
      return res.status(400).json({
        error: "Missing email or PDF data"
      });
    }

    const company = db.prepare("SELECT * FROM company LIMIT 1").get();

    if (!company || !company.smtp_host) {
      return res.status(400).json({
        error: "SMTP not configured"
      });
    }

    const transporter = createTransporter(company);
    await transporter.verify();

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    await transporter.sendMail({
      from: company.smtp_from,
      to: email,
      subject: `Payslip - ${full_name}`,
      text: "Please find your payslip attached.",
      attachments: [
        {
          filename: `Payslip_${full_name}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Send Payslip Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;