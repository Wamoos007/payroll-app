import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

const API = "http://localhost:3001";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    id: null,
    full_name: "",
    employee_code: "",
    id_number: "",
    hourly_rate: ""
  });

  const loadEmployees = async () => {
    try {
      const res = await axios.get(`${API}/api/employees`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Load employees error:", err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddClick = () => {
    setIsEdit(false);
    setForm({
      id: null,
      full_name: "",
      employee_code: "",
      id_number: "",
      hourly_rate: ""
    });
    setOpenDialog(true);
  };

  const handleEditClick = (emp) => {
    setIsEdit(true);
    setForm(emp);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await axios.put(`${API}/api/employees/${form.id}`, form);
      } else {
        await axios.post(`${API}/api/employees`, form);
      }

      setOpenDialog(false);
      loadEmployees();
    } catch (err) {
      console.error("Save employee error:", err);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.post(`${API}/api/employees/${id}/deactivate`);
      loadEmployees();
    } catch (err) {
      console.error("Deactivate error:", err);
    }
  };

  const handleReactivate = async (id) => {
    try {
      await axios.post(`${API}/api/employees/${id}/reactivate`);
      loadEmployees();
    } catch (err) {
      console.error("Reactivate error:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Employees
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" onClick={handleAddClick}>
          Add New Employee
        </Button>
      </Box>

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
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No employees found
              </TableCell>
            </TableRow>
          ) : (
            employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>{emp.employee_code}</TableCell>
                <TableCell>{emp.full_name}</TableCell>
                <TableCell>{emp.id_number}</TableCell>
                <TableCell>{emp.email || "-"}</TableCell>
                <TableCell>R {emp.hourly_rate}</TableCell>
                <TableCell>
                  {emp.active ? "Active" : "Inactive"}
                </TableCell>

                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => handleEditClick(emp)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>

                  {emp.active ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeactivate(emp.id)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => handleReactivate(emp.id)}
                    >
                      Activate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {isEdit ? "Edit Employee" : "Add Employee"}
        </DialogTitle>

        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 350
          }}
        >
          <TextField
            label="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
          />

          <TextField
            label="Employee Code"
            value={form.employee_code}
            onChange={(e) =>
              setForm({ ...form, employee_code: e.target.value })
            }
          />

          <TextField
            label="ID Number"
            value={form.id_number}
            onChange={(e) =>
              setForm({ ...form, id_number: e.target.value })
            }
          />

          <TextField
            label="Email"
            value={form.email || ""}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <TextField
            label="Hourly Rate"
            type="number"
            value={form.hourly_rate}
            onChange={(e) =>
              setForm({ ...form, hourly_rate: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSave}>
            {isEdit ? "Save Changes" : "Create Employee"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employees;