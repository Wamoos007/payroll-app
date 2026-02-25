const express = require("express");
const router = express.Router();
const db = require("../db");

/* GET SETTINGS */
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();

    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

/* UPDATE SETTING */
router.put("/:key", (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

module.exports = router;