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

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

function PayRuns() {
  const [runs, setRuns] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    pay_date: ""
  });

  const loadRuns = async () => {
    const res = await axios.get("http://localhost:3001/api/payroll/runs");
    setRuns(res.data);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleAdd = async () => {
    await axios.post("http://localhost:3001/api/payroll/runs", form);
    setOpenAdd(false);
    setForm({ period_start: "", period_end: "", pay_date: "" });
    loadRuns();
  };

  const handleEdit = async () => {
    await axios.patch(
      `http://localhost:3001/api/payroll/runs/${selected.id}`,
      form
    );
    setOpenEdit(false);
    loadRuns();
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this pay run?")) return;
    await axios.delete(`http://localhost:3001/api/payroll/runs/${id}`);
    loadRuns();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pay Runs
      </Typography>

      <Button variant="contained" onClick={() => setOpenAdd(true)}>
        + Add New Pay Run
      </Button>

      <Table sx={{ mt: 2 }}>
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
                    setForm(run);
                    setOpenEdit(true);
                  }}
                >
                  <EditIcon />
                </IconButton>

                <IconButton onClick={() => handleDelete(run.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ADD DIALOG */}
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
          <Button onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
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
          <Button onClick={handleEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PayRuns;
