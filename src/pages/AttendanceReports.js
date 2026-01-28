import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function AttendanceReports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [studentOrAdm, setStudentOrAdm] = useState("");

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

  const filtered = useMemo(() => {
    const t = studentOrAdm.trim().toLowerCase();
    if (!t) return records;
    return records.filter((r) =>
      String(r.studentNameSelect || r.admissionNo || "").toLowerCase().includes(t)
    );
  }, [records, studentOrAdm]);

  const groupedByStudent = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.studentNameSelect || r.admissionNo || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
  }, [filtered]);

  if (loading) return <div className="content-section">Loading attendance reports…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Attendance Reports</h1>

      <div className="sub-section">
        <input
          value={studentOrAdm}
          onChange={(e) => setStudentOrAdm(e.target.value)}
          placeholder="Filter by admission no..."
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div className="sub-section">
        <h2>Summary</h2>
        {groupedByStudent.length ? (
          groupedByStudent.map(({ key, rows }) => {
            let present = 0, absent = 0;
            rows.forEach((r) => {
              const s = String(r.status || "").toLowerCase();
              if (s === "present") present += 1;
              else if (s === "absent") absent += 1;
            });
            return (
              <div key={key} style={{ padding: 10, border: "1px solid #eee", borderRadius: 8, marginBottom: 10 }}>
                <b>{key}</b> — Present: {present}, Absent: {absent}, Total: {rows.length}
              </div>
            );
          })
        ) : (
          <p>No records.</p>
        )}
      </div>
    </div>
  );
}

export default AttendanceReports;
