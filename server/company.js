const express = require("express");
const db = require("../db");

const router = express.Router();

/**
 * GET company settings
 */
router.get("/", (req, res) => {
  db.get("SELECT * FROM company WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (!row) {
      return res.json({
        name: "",
        address: "",
        registration_number: "",
        contact_email: "",
        logo_path: null
      });
    }

    res.json(row);
  });
});

/**
 * CREATE / UPDATE company settings
 */
router.post("/", (req, res) => {
  const {
    name,
    address,
    registration_number,
    contact_email,
    logo_path
  } = req.body;

  const sql = `
    INSERT INTO company (id, name, address, registration_number, contact_email, logo_path)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      address = excluded.address,
      registration_number = excluded.registration_number,
      contact_email = excluded.contact_email,
      logo_path = excluded.logo_path
  `;

  db.run(
    sql,
    [name, address, registration_number, contact_email, logo_path || null],
    err => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true });
    }
  );
});

module.exports = router;
