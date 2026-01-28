import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function AttendanceExport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await apiFetch("/api/schoolPortalAttendance");
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data = await res.json().catch(() => []);
        setRecords(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classes = useMemo(() => {
    const list = records.map((r) => r.classSelect).filter(Boolean);
    return [...new Set(list)].sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => !classFilter || r.classSelect === classFilter);
  }, [records, classFilter]);

  const exportCSV = () => {
    const header = ["date", "class", "student", "status", "markedBy"];
    const rows = filtered.map((r) => [
      String(r.date || r.markedAt || "").slice(0, 10),
      r.classSelect || "",
      r.studentNameSelect || r.admissionNo || "",
      r.status || "",
      r.markedBy || "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_export${classFilter ? `_${classFilter}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="content-section">Loading export data…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Attendance Export</h1>

      <div className="sub-section" style={{ display: "grid", gap: 10, maxWidth: 600 }}>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button onClick={exportCSV}>Export CSV</button>

        <div style={{ color: "#555" }}>
          Export rows: <b>{filtered.length}</b>
        </div>
      </div>
    </div>
  );
}

export default AttendanceExport;
