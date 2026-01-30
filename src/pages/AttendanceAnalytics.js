import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceNav from "../components/AttendanceNav";

const LS_ATT = "schoolPortalAttendance";

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const normalizeAttendance = (r) => ({
  date: r.date || r.attendanceDate || "",
  class: r.class || r.classSelect || r.studentClass || "",
  admissionNo: r.admissionNo || r.studentId || r.studentNameSelect || r.studentAdmissionNo || "",
  status: r.status || r.attendanceStatus || "Present",
});

export default function AttendanceAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState(() => readLS(LS_ATT, []).map(normalizeAttendance));
  const [classSelect, setClassSelect] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!u) return navigate("/login");
    const t = String(u.type || "").toLowerCase();
    if (!(t.includes("staff") || t.includes("admin") || t.includes("teacher"))) {
      return navigate("/login");
    }
    setUser(u);
    setRecords(readLS(LS_ATT, []).map(normalizeAttendance));
  }, [navigate]);

  const uniqueClasses = useMemo(() => {
    const all = records.map((r) => r.class).filter(Boolean);
    return [...new Set(all)].sort();
  }, [records]);

  const filtered = useMemo(() => {
    if (!classSelect) return records;
    return records.filter((r) => r.class === classSelect);
  }, [records, classSelect]);

  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    filtered.forEach((r) => {
      if (r.status === "Present") present++;
      else if (r.status === "Absent") absent++;
      else if (r.status === "Late") late++;
    });
    const total = filtered.length;
    const pct = total ? ((present / total) * 100).toFixed(2) : "0.00";
    return { total, present, absent, late, pct };
  }, [filtered]);

  const byDay = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const d = r.date || "Unknown";
      if (!map.has(d)) map.set(d, { date: d, total: 0, present: 0, absent: 0, late: 0 });
      const row = map.get(d);
      row.total += 1;
      if (r.status === "Present") row.present += 1;
      else if (r.status === "Absent") row.absent += 1;
      else if (r.status === "Late") row.late += 1;
    });
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filtered]);

  if (!user) return <div className="content-section">Loading…</div>;

  return (
    <div className="content-section">
      <AttendanceNav />

      <h1>Attendance Analytics</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <select value={classSelect} onChange={(e) => setClassSelect(e.target.value)}>
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button type="button" onClick={() => setClassSelect("")} style={{ background: "#6c757d" }}>
          Clear
        </button>
      </div>

      <div className="results-summary-card" style={{ marginBottom: 12 }}>
        <div className="summary-item"><h3>Total</h3><p>{stats.total}</p></div>
        <div className="summary-item"><h3>Present</h3><p>{stats.present}</p></div>
        <div className="summary-item"><h3>Absent</h3><p>{stats.absent}</p></div>
        <div className="summary-item"><h3>Late</h3><p>{stats.late}</p></div>
        <div className="summary-item"><h3>Present %</h3><p>{stats.pct}%</p></div>
      </div>

      <h3>Daily Breakdown</h3>
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Date</th><th>Total</th><th>Present</th><th>Absent</th><th>Late</th>
            </tr>
          </thead>
          <tbody>
            {byDay.length ? byDay.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.total}</td>
                <td>{d.present}</td>
                <td>{d.absent}</td>
                <td>{d.late}</td>
              </tr>
            )) : (
              <tr><td colSpan="5">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
