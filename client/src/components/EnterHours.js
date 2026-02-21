import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  CircularProgress,
  Button
} from "@mui/material";

const API = "http://localhost:3001";

function EnterHours() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState("");
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);

  const [savingRow, setSavingRow] = useState(null);
  const [savedRow, setSavedRow] = useState(null);

  const debounceTimers = useRef({});

  /* ===============================
     LOAD PAY RUNS
  =============================== */
  useEffect(() => {
    axios.get(`${API}/api/payroll/runs`).then(res => {
      setRuns(res.data);
      if (res.data.length > 0) {
        setSelectedRun(res.data[0].id);
      }
    });
  }, []);

  /* ===============================
     LOAD PAYROLL LINES
  =============================== */
  const loadLines = () => {
    if (!selectedRun) return;

    setLoading(true);

    axios
      .get(`${API}/api/payroll/lines/${selectedRun}`)
      .then(res => {
        const sorted = res.data.sort((a, b) =>
          a.employee_code.localeCompare(b.employee_code)
        );
        setLines(sorted);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLines();
  }, [selectedRun]);

  /* ===============================
     ADD MISSING EMPLOYEES
  =============================== */
  const addMissingEmployees = async () => {
    if (!selectedRun) return;

    await axios.post(
      `${API}/api/payroll/runs/${selectedRun}/add-missing`
    );

    loadLines();
  };

  /* ===============================
     DEBOUNCED SAVE
  =============================== */
  const debouncedSave = (id, updatedLine) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    debounceTimers.current[id] = setTimeout(async () => {
      try {
        setSavingRow(id);
        setSavedRow(null);

        await axios.put(`${API}/api/payroll/lines/${id}`, {
          hours_wk1: updatedLine.hours_wk1,
          hours_wk2: updatedLine.hours_wk2,
          ot15_hours: updatedLine.ot15_hours,
          ot20_hours: updatedLine.ot20_hours
        });

        setSavingRow(null);
        setSavedRow(id);

        setTimeout(() => setSavedRow(null), 1500);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSavingRow(null);
      }
    }, 500);
  };

  /* ===============================
     HANDLE FIELD CHANGE
  =============================== */
  const handleChange = (id, field, value) => {
    const numeric = Math.max(0, Number(value));

    const updatedLines = lines.map(line => {
      if (line.id === id) {
        const updatedLine = {
          ...line,
          [field]: numeric
        };

        debouncedSave(id, updatedLine);
        return updatedLine;
      }
      return line;
    });

    setLines(updatedLines);
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Enter Hours
      </Typography>

      {/* PAY RUN SELECTOR */}
      <Select
        value={selectedRun}
        onChange={e => setSelectedRun(e.target.value)}
        sx={{ mb: 2, minWidth: 240 }}
      >
        {runs.map(run => (
          <MenuItem key={run.id} value={run.id}>
            {run.pay_date}
          </MenuItem>
        ))}
      </Select>

      {/* ADD MISSING EMPLOYEES BUTTON */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={addMissingEmployees}
          disabled={!selectedRun}
        >
          Add New Employees To This Run
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell align="center">Week 1</TableCell>
              <TableCell align="center">Week 2</TableCell>
              <TableCell align="center">OT 1.5</TableCell>
              <TableCell align="center">OT 2.0</TableCell>
              <TableCell align="center">Total Hours</TableCell>
              <TableCell align="center">Rate</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Payslip</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {lines.map(line => {
              const totalHours =
                Number(line.hours_wk1 || 0) +
                Number(line.hours_wk2 || 0) +
                Number(line.ot15_hours || 0) +
                Number(line.ot20_hours || 0);

              const hasHours = totalHours > 0;

              return (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.full_name} ({line.employee_code})
                  </TableCell>

                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={line.hours_wk1 || 0}
                      onChange={e =>
                        handleChange(line.id, "hours_wk1", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={line.hours_wk2 || 0}
                      onChange={e =>
                        handleChange(line.id, "hours_wk2", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={line.ot15_hours || 0}
                      onChange={e =>
                        handleChange(line.id, "ot15_hours", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={line.ot20_hours || 0}
                      onChange={e =>
                        handleChange(line.id, "ot20_hours", e.target.value)
                      }
                    />
                  </TableCell>

                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {totalHours}
                  </TableCell>

                  <TableCell align="center">
                    {line.rate_used}
                  </TableCell>

                  <TableCell align="center">
                    {savingRow === line.id && (
                      <Typography variant="caption" color="warning.main">
                        Saving...
                      </Typography>
                    )}
                    {savedRow === line.id && (
                      <Typography variant="caption" color="success.main">
                        Saved ✓
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      disabled={!hasHours}
                      onClick={() =>
                        navigate(`/payslip/${line.id}`)
                      }
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export default EnterHours;
