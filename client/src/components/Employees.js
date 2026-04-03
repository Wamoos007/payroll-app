import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import API from "../api";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";

function getApiErrorMessage(err, fallback) {
  return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
}

const cardStyle = {
  p: 2.5,
  borderRadius: 3,
  border: "1px solid rgba(15,76,129,0.08)",
  background: "linear-gradient(180deg, #ffffff, #f8fbff)"
};

const emptyStateStyle = {
  p: 5,
  textAlign: "center",
  borderRadius: 3,
  border: "1px dashed rgba(15,76,129,0.18)",
  background: "linear-gradient(180deg, #fcfdff, #f7fbff)"
};

function Employees({ readOnly = false }) {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [filter, setFilter] = useState("active");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    id: null,
    full_name: "",
    employee_code: "",
    id_number: "",
    email: "",
    hourly_rate: ""
  });

  const loadEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/employees`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Load employees error:", err);
      setEmployees([]);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Could not load employees.")
      });
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const visibleEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filter === "active") return emp.active;
      if (filter === "inactive") return !emp.active;
      return true;
    });
  }, [employees, filter]);

  const stats = useMemo(() => {
    const active = employees.filter(emp => emp.active).length;
    const inactive = employees.length - active;
    const averageRate = employees.length
      ? employees.reduce((sum, emp) => sum + Number(emp.hourly_rate || 0), 0) / employees.length
      : 0;

    return {
      total: employees.length,
      active,
      inactive,
      averageRate
    };
  }, [employees]);

  const resetForm = () => {
    setForm({
      id: null,
      full_name: "",
      employee_code: "",
      id_number: "",
      email: "",
      hourly_rate: ""
    });
  };

  const handleAddClick = () => {
    setIsEdit(false);
    resetForm();
    setOpenDialog(true);
  };

  const handleEditClick = emp => {
    setIsEdit(true);
    setForm({
      ...emp,
      email: emp.email || "",
      hourly_rate: emp.hourly_rate ?? ""
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      if (!form.full_name || !form.employee_code || form.hourly_rate === "") {
        setStatus({
          type: "warning",
          message: "Please complete the employee name, code, and hourly rate."
        });
        return;
      }

      if (isEdit) {
        await axios.put(`${API}/api/employees/${form.id}`, form);
      } else {
        await axios.post(`${API}/api/employees`, form);
      }

      setStatus({
        type: "success",
        message: isEdit ? "Employee updated successfully." : "Employee created successfully."
      });
      handleCloseDialog();
      loadEmployees();
    } catch (err) {
      console.error("Save employee error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(
          err,
          "Please check the employee details and try again."
        )
      });
    }
  };

  const handleDeactivate = async id => {
    try {
      await axios.post(`${API}/api/employees/${id}/deactivate`);
      setStatus({
        type: "success",
        message: "Employee deactivated."
      });
      loadEmployees();
    } catch (err) {
      console.error("Deactivate error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Could not deactivate employee.")
      });
    }
  };

  const handleReactivate = async id => {
    try {
      await axios.post(`${API}/api/employees/${id}/reactivate`);
      setStatus({
        type: "success",
        message: "Employee reactivated."
      });
      loadEmployees();
    } catch (err) {
      console.error("Reactivate error:", err);
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Could not reactivate employee.")
      });
    }
  };

  const handleImport = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/api/employees/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setStatus({
        type: "success",
        message: `Import complete. Inserted: ${res.data.inserted}. Skipped: ${res.data.skipped}.`
      });
      loadEmployees();
    } catch (err) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(err, "Import failed.")
      });
    } finally {
      e.target.value = "";
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
              Employees
            </Typography>
            <Typography color="text.secondary">
              Add staff, keep their payroll details current, and manage who is active in the system.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={readOnly}
            >
              Import CSV
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleImport}
              />
            </Button>

            <Button
              variant="contained"
              onClick={handleAddClick}
              startIcon={<PersonAddAlt1Icon />}
              disabled={readOnly}
            >
              Add Employee
            </Button>
          </Box>
        </Box>
      </Paper>

      {status.message ? (
        <Alert severity={status.type || "info"} sx={{ mb: 3 }}>
          {status.message}
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Total employees
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {stats.total}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Active
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {stats.active}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Inactive
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {stats.inactive}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={cardStyle}>
            <Typography color="text.secondary" variant="body2">
              Average hourly rate
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              R {stats.averageRate.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <TextField
          select
          label="Filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          size="small"
          sx={{ width: 220 }}
        >
          <MenuItem value="active">Active only</MenuItem>
          <MenuItem value="inactive">Inactive only</MenuItem>
          <MenuItem value="all">All employees</MenuItem>
        </TextField>
      </Box>

      {visibleEmployees.length === 0 ? (
        <Paper sx={emptyStateStyle}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            No employees to show
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }}>
            Add your first employee or switch the filter to view another employee group.
          </Typography>
          <Button variant="contained" onClick={handleAddClick} disabled={readOnly}>
            {readOnly ? "Read-only mode" : "Create Employee"}
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ overflow: "hidden", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>ID Number</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleEmployees.map(emp => (
                  <TableRow key={emp.id} hover>
                    <TableCell>{emp.employee_code}</TableCell>
                    <TableCell>{emp.full_name}</TableCell>
                    <TableCell>{emp.id_number || "-"}</TableCell>
                    <TableCell>{emp.email || "-"}</TableCell>
                    <TableCell>R {Number(emp.hourly_rate || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={emp.active ? "Active" : "Inactive"}
                        color={emp.active ? "success" : "default"}
                        variant={emp.active ? "filled" : "outlined"}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <IconButton onClick={() => handleEditClick(emp)} disabled={readOnly}>
                        <EditIcon />
                      </IconButton>

                      {emp.active ? (
                        <IconButton
                          color="warning"
                          onClick={() => handleDeactivate(emp.id)}
                          disabled={readOnly}
                        >
                          <BlockIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          color="success"
                          onClick={() => handleReactivate(emp.id)}
                          disabled={readOnly}
                        >
                          <CheckCircleOutlineIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {isEdit ? "Edit Employee" : "Add Employee"}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={form.full_name}
                disabled={readOnly}
                onChange={e =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee Code"
                value={form.employee_code}
                disabled={readOnly}
                onChange={e =>
                  setForm({ ...form, employee_code: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Number"
                value={form.id_number}
                disabled={readOnly}
                onChange={e =>
                  setForm({ ...form, id_number: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={form.email || ""}
                disabled={readOnly}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={form.hourly_rate}
                disabled={readOnly}
                onChange={e =>
                  setForm({ ...form, hourly_rate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave} disabled={readOnly}>
            {isEdit ? "Save Changes" : "Create Employee"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employees;
