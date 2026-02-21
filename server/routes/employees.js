const express = require("express");
const router = express.Router();
const db = require("../db");

/* GET ALL EMPLOYEES */
router.get("/", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM employees
      ORDER BY employee_code ASC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error("Load employees error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* CREATE EMPLOYEE */
router.post("/", (req, res) => {
  const { full_name, employee_code, id_number, hourly_rate } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO employees
      (full_name, employee_code, id_number, hourly_rate, active)
      VALUES (?, ?, ?, ?, 1)
    `).run(full_name, employee_code, id_number, hourly_rate);

    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

/* UPDATE EMPLOYEE */
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    employee_code,
    id_number,
    hourly_rate
  } = req.body;

  try {
    db.prepare(`
      UPDATE employees
      SET full_name = ?,
          employee_code = ?,
          id_number = ?,
          hourly_rate = ?
      WHERE id = ?
    `).run(
      full_name,
      employee_code,
      id_number,
      hourly_rate,
      id
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});


/* DEACTIVATE EMPLOYEE */
router.post("/:id/deactivate", (req, res) => {
  try {
    db.prepare(`
      UPDATE employees
      SET active = 0
      WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Deactivate error:", err);
    res.status(500).json({ error: "Deactivate failed" });
  }
});

/* REACTIVATE EMPLOYEE */
router.post("/:id/reactivate", (req, res) => {
  try {
    db.prepare(`
      UPDATE employees
      SET active = 1
      WHERE id = ?
    `).run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Reactivate error:", err);
    res.status(500).json({ error: "Reactivate failed" });
  }
});

module.exports = router;
