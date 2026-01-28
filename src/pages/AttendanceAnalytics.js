import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function AttendanceAnalytics() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [classFilter, setClassFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const [attRes, stuRes] = await Promise.all([
          apiFetch("/api/schoolPortalAttendance"),
          apiFetch("/api/schoolPortalStudents"),
        ]);

        if (!attRes.ok) throw new Error("Failed to fetch attendance");
        if (!stuRes.ok) throw new Error("Failed to fetch students");

        const att = await attRes.json().catch(() => []);
        const stu = await stuRes.json().catch(() => []);
        setRecords(Array.isArray(att) ? att : []);
        setStudents(Array.isArray(stu) ? stu : []);
      } catch (e) {
        setErr(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classes = useMemo(() => {
    const list = students.map((s) => s.studentClass).filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (classFilter && r.classSelect && r.classSelect !== classFilter) return false;

      const d = String(r.date || r.markedAt || "").slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;

      return true;
    });
  }, [records, classFilter, fromDate, toDate]);

  // Quick summary
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;

    filtered.forEach((r) => {
      const status = String(r.status || r.attendanceStatus || "").toLowerCase();
      if (status === "present") present += 1;
      else if (status === "absent") absent += 1;
    });

    return { present, absent, total: filtered.length };
  }, [filtered]);

  if (loading) return <div className="content-section">Loading attendance analytics…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Attendance Analytics</h1>

      <div className="sub-section" style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label>From</label><br />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label>To</label><br />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button onClick={() => { setFromDate(""); setToDate(""); setClassFilter(""); }} style={{ background: "#6c757d" }}>
            Clear Filters
          </button>
        </div>

        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <b>Summary:</b> Total = {summary.total} | Present = {summary.present} | Absent = {summary.absent}
        </div>
      </div>

      <div className="sub-section">
        <h2>Records</h2>
        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Class</th>
                <th style={th}>Student</th>
                <th style={th}>Status</th>
                <th style={th}>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((r) => (
                  <tr key={r._id}>
                    <td style={td}>{String(r.date || r.markedAt || "").slice(0, 10)}</td>
                    <td style={td}>{r.classSelect || "-"}</td>
                    <td style={td}>{r.studentNameSelect || r.admissionNo || "-"}</td>
                    <td style={td}>{r.status || r.attendanceStatus || "-"}</td>
                    <td style={td}>{r.markedBy || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="5">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = { border: "1px solid #ddd", padding: 8, background: "#f2f2f2", textAlign: "left" };
const td = { border: "1px solid #ddd", padding: 8 };

export default AttendanceAnalytics;
