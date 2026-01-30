import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceNav from "../components/AttendanceNav";

const LS_ATT = "schoolPortalAttendance";
const LS_STU = "schoolPortalStudents";

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const norm = (v) => String(v ?? "").trim();

const normalizeAttendance = (r) => ({
  id: r._id || r.id || `${r.date}-${(r.class || r.classSelect)}-${(r.admissionNo || r.studentId || r.studentNameSelect)}`,
  date: r.date || r.attendanceDate || "",
  class: r.class || r.classSelect || r.studentClass || "",
  admissionNo: r.admissionNo || r.studentId || r.studentNameSelect || r.studentAdmissionNo || "",
  status: r.status || r.attendanceStatus || "Present",
  markedBy: r.markedBy || r.teacherId || r.staffId || r.submittedBy || "",
});

export default function AttendanceReports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [students] = useState(() => readLS(LS_STU, []));
  const [records, setRecords] = useState(() => readLS(LS_ATT, []).map(normalizeAttendance));

  const [classSelect, setClassSelect] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const inRange = (d) => {
    if (!d) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (classSelect && r.class !== classSelect) return false;
      if (dateFrom || dateTo) return inRange(r.date);
      return true;
    });
  }, [records, classSelect, dateFrom, dateTo]);

  const summary = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    filtered.forEach((r) => {
      if (r.status === "Present") present++;
      else if (r.status === "Absent") absent++;
      else if (r.status === "Late") late++;
    });
    return { total: filtered.length, present, absent, late };
  }, [filtered]);

  const studentName = (admissionNo) => {
    const s = students.find((x) => String(x.admissionNo) === String(admissionNo));
    if (!s) return admissionNo;
    return `${s.firstName || ""} ${s.lastName || ""}`.trim() || admissionNo;
  };

  if (!user) return <div className="content-section">Loading…</div>;

  return (
    <div className="content-section">
      <AttendanceNav />

      <h1>Attendance Reports</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <select value={classSelect} onChange={(e) => setClassSelect(e.target.value)}>
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <button
          type="button"
          onClick={() => {
            setClassSelect("");
            setDateFrom("");
            setDateTo("");
          }}
          style={{ background: "#6c757d" }}
        >
          Clear
        </button>

        <button type="button" onClick={() => window.print()}>Print</button>
      </div>

      <div className="results-summary-card" style={{ marginBottom: 12 }}>
        <div className="summary-item"><h3>Total</h3><p>{summary.total}</p></div>
        <div className="summary-item"><h3>Present</h3><p>{summary.present}</p></div>
        <div className="summary-item"><h3>Absent</h3><p>{summary.absent}</p></div>
        <div className="summary-item"><h3>Late</h3><p>{summary.late}</p></div>
      </div>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Admission No</th>
              <th>Name</th>
              <th>Status</th>
              <th>Marked By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.class}</td>
                    <td>{r.admissionNo}</td>
                    <td>{studentName(r.admissionNo)}</td>
                    <td>{r.status}</td>
                    <td>{r.markedBy || "-"}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="6">No attendance records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
