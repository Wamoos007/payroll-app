import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton
} from "@mui/material";
import { MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";


/* ================= API BASE ================= */
const API = "http://localhost:3001";

function PayRuns() {
  const [runs, setRuns] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    pay_date: ""
  });

  /* ================= LOAD RUNS ================= */
  const loadRuns = async () => {
  try {
    const res = await axios.get(
      `${API}/api/payroll/runs`,
      { params: { year } }
    );

    setRuns(res.data || []);
  } catch (err) {
    console.error("Load runs error:", err);
    setRuns([]);
  }
};

  useEffect(() => {
  loadRuns();
}, [year]);

  /* ================= ADD RUN ================= */
  const handleAdd = async () => {
    try {
      if (!form.period_start || !form.period_end || !form.pay_date) {
        alert("Please complete all fields.");
        return;
      }

      await axios.post(`${API}/api/payroll/runs`, form);

      setOpenAdd(false);
      setForm({
        period_start: "",
        period_end: "",
        pay_date: ""
      });

      loadRuns();
    } catch (err) {
      console.error("Add run error:", err);
      alert("Failed to create pay run.");
    }
  };

  /* ================= EDIT RUN ================= */
  const handleEdit = async () => {
    try {
      if (!selected) return;

      await axios.patch(
        `${API}/api/payroll/runs/${selected.id}`,
        form
      );

      setOpenEdit(false);
      setSelected(null);

      loadRuns();
    } catch (err) {
      console.error("Edit run error:", err);
      alert("Failed to update pay run.");
    }
  };

  /* ================= DELETE RUN ================= */
  const handleDelete = async id => {
    if (!window.confirm("Delete this pay run?")) return;

    try {
      await axios.delete(`${API}/api/payroll/runs/${id}`);
      loadRuns();
    } catch (err) {
      console.error("Delete run error:", err);
      alert("Failed to delete pay run.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pay Runs
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => setOpenAdd(true)}
      >
        + Add New Pay Run
      </Button>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
  <TextField
    select
    label="Year"
    value={year}
    onChange={(e) => setYear(e.target.value)}
    size="small"
    sx={{ width: 120 }}
  >
    {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
      <MenuItem key={y} value={y}>
        {y}
      </MenuItem>
    ))}
  </TextField>
</Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Period Start</TableCell>
            <TableCell>Period End</TableCell>
            <TableCell>Pay Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {runs.map(run => (
            <TableRow key={run.id}>
              <TableCell>{run.period_start}</TableCell>
              <TableCell>{run.period_end}</TableCell>
              <TableCell>{run.pay_date}</TableCell>

              <TableCell align="right">
                <IconButton
                  onClick={() => {
                    setSelected(run);
                    setForm({
                      period_start: run.period_start,
                      period_end: run.period_end,
                      pay_date: run.pay_date
                    });
                    setOpenEdit(true);
                  }}
                >
                  <EditIcon />
                </IconButton>

                <IconButton
                  color="error"
                  onClick={() => handleDelete(run.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}

          {runs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No pay runs found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ================= ADD DIALOG ================= */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Pay Run</DialogTitle>
        <DialogContent>
          <TextField
            label="Period Start"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_start}
            onChange={e =>
              setForm({ ...form, period_start: e.target.value })
            }
          />
          <TextField
            label="Period End"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_end}
            onChange={e =>
              setForm({ ...form, period_end: e.target.value })
            }
          />
          <TextField
            label="Pay Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.pay_date}
            onChange={e =>
              setForm({ ...form, pay_date: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Pay Run</DialogTitle>
        <DialogContent>
          <TextField
            label="Period Start"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_start}
            onChange={e =>
              setForm({ ...form, period_start: e.target.value })
            }
          />
          <TextField
            label="Period End"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_end}
            onChange={e =>
              setForm({ ...form, period_end: e.target.value })
            }
          />
          <TextField
            label="Pay Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.pay_date}
            onChange={e =>
              setForm({ ...form, pay_date: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PayRuns;