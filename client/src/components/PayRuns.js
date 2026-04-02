import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import API from "../api";
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
  IconButton,
  Paper,
  TableContainer,
  Grid
} from "@mui/material";
import { MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

function getApiErrorMessage(err, fallback) {
  return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return "—";

  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateValue;

  return parsed.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

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

  const loadRuns = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/payroll/runs`, {
        params: { year }
      });

      setRuns(res.data || []);
    } catch (err) {
      console.error("Load runs error:", err);
      setRuns([]);
    }
  }, [year]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const metrics = useMemo(
    () => ({
      count: runs.length,
      latest: runs[0]?.pay_date || null,
      earliest: runs[runs.length - 1]?.pay_date || null
    }),
    [runs]
  );

  const validateForm = () => {
    if (!form.period_start || !form.period_end || !form.pay_date) {
      return "Please complete all fields.";
    }

    if (form.period_start > form.period_end) {
      return "Period start must be before period end.";
    }

    if (form.pay_date < form.period_start || form.pay_date > form.period_end) {
      return "Pay date must fall within the pay period.";
    }

    return null;
  };

  const resetForm = () => {
    setForm({
      period_start: "",
      period_end: "",
      pay_date: ""
    });
  };

  const handleAdd = async () => {
    try {
      const validationError = validateForm();
      if (validationError) {
        alert(validationError);
        return;
      }

      await axios.post(`${API}/api/payroll/runs`, form);

      setOpenAdd(false);
      resetForm();
      loadRuns();
    } catch (err) {
      console.error("Add run error:", err);
      alert(
        `Failed to create pay run.\n${getApiErrorMessage(
          err,
          "Please check the dates and try again."
        )}`
      );
    }
  };

  const handleEdit = async () => {
    try {
      if (!selected) return;

      const validationError = validateForm();
      if (validationError) {
        alert(validationError);
        return;
      }

      await axios.patch(`${API}/api/payroll/runs/${selected.id}`, form);

      setOpenEdit(false);
      setSelected(null);
      resetForm();
      loadRuns();
    } catch (err) {
      console.error("Edit run error:", err);
      alert(
        `Failed to update pay run.\n${getApiErrorMessage(err, "Please try again.")}`
      );
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this pay run?")) return;

    try {
      await axios.delete(`${API}/api/payroll/runs/${id}`);
      loadRuns();
    } catch (err) {
      console.error("Delete run error:", err);
      alert(
        `Failed to delete pay run.\n${getApiErrorMessage(err, "Please try again.")}`
      );
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(15,76,129,0.08), rgba(37,99,235,0.03))",
          border: "1px solid rgba(15,76,129,0.12)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Pay Runs
            </Typography>
            <Typography color="text.secondary">
              Create, review, and manage pay runs for the selected year.
            </Typography>
          </Box>

          <Button variant="contained" onClick={() => setOpenAdd(true)}>
            + Add New Pay Run
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={metricCard}>
            <Typography color="text.secondary" variant="body2">
              Runs in view
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {metrics.count}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={metricCard}>
            <Typography color="text.secondary" variant="body2">
              Latest pay date
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatDisplayDate(metrics.latest)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={metricCard}>
            <Typography color="text.secondary" variant="body2">
              Earliest pay date
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatDisplayDate(metrics.earliest)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          select
          label="Year"
          value={year}
          onChange={e => setYear(e.target.value)}
          size="small"
          sx={{ width: 140 }}
        >
          {[currentYear - 2, currentYear - 1, currentYear].map(y => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
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
                <TableRow key={run.id} hover>
                  <TableCell>{formatDisplayDate(run.period_start)}</TableCell>
                  <TableCell>{formatDisplayDate(run.period_end)}</TableCell>
                  <TableCell>{formatDisplayDate(run.pay_date)}</TableCell>

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
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                      No pay runs found
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Create a pay run to start collecting hours and generating payslips.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openAdd}
        onClose={() => {
          setOpenAdd(false);
          resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Pay Run</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Choose a pay period that matches the pay date. The server will pick the correct tax year automatically.
          </Typography>

          <TextField
            label="Period Start"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_start}
            onChange={e => setForm({ ...form, period_start: e.target.value })}
          />
          <TextField
            label="Period End"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_end}
            onChange={e => setForm({ ...form, period_end: e.target.value })}
          />
          <TextField
            label="Pay Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.pay_date}
            onChange={e => setForm({ ...form, pay_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAdd(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAdd}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setSelected(null);
          resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Pay Run</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Update the pay period details. Existing payroll lines stay linked to this run.
          </Typography>

          <TextField
            label="Period Start"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_start}
            onChange={e => setForm({ ...form, period_start: e.target.value })}
          />
          <TextField
            label="Period End"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.period_end}
            onChange={e => setForm({ ...form, period_end: e.target.value })}
          />
          <TextField
            label="Pay Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.pay_date}
            onChange={e => setForm({ ...form, pay_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEdit(false);
              setSelected(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const metricCard = {
  p: 2.5,
  borderRadius: 3,
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
  border: "1px solid rgba(15,23,42,0.06)",
  height: "100%"
};

export default PayRuns;
