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

const normalizeAttendance = (r) => ({
  date: r.date || r.attendanceDate || "",
  class: r.class || r.classSelect || r.studentClass || "",
  admissionNo: r.admissionNo || r.studentId || r.studentNameSelect || r.studentAdmissionNo || "",
  status: r.status || r.attendanceStatus || "Present",
  markedBy: r.markedBy || r.teacherId || r.staffId || r.submittedBy || "",
});

const downloadTextFile = (filename, text) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function AttendanceExport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [students] = useState(() => readLS(LS_STU, []));
  const [records, setRecords] = useState(() =>
    readLS(LS_ATT, []).map(normalizeAttendance)
  );

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

  const studentName = (admissionNo) => {
    const s = students.find((x) => String(x.admissionNo) === String(admissionNo));
    if (!s) return "";
    return `${s.firstName || ""} ${s.lastName || ""}`.trim();
  };

  const exportCSV = () => {
    const header = "date,class,admissionNo,name,status,markedBy";
    const rows = filtered.map((r) => {
      const name = studentName(r.admissionNo).replace(/,/g, " ");
      return `${r.date},${r.class},${r.admissionNo},${name},${r.status},${(r.markedBy || "").replace(/,/g, " ")}`;
    });
    downloadTextFile(`attendance_export_${Date.now()}.csv`, [header, ...rows].join("\n"));
  };

  if (!user) return <div className="content-section">Loading…</div>;

  return (
    <div className="content-section">
      <AttendanceNav />

      <h1>Attendance Export</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <select value={classSelect} onChange={(e) => setClassSelect(e.target.value)}>
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <button type="button" onClick={exportCSV}>Export CSV</button>

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
      </div>

      <p>
        Records to export: <b>{filtered.length}</b>
      </p>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Date</th><th>Class</th><th>Admission No</th><th>Name</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((r, idx) => (
              <tr key={idx}>
                <td>{r.date}</td>
                <td>{r.class}</td>
                <td>{r.admissionNo}</td>
                <td>{studentName(r.admissionNo) || "-"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="5">No records to export.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 50 && <p>Showing first 50 rows…</p>}
    </div>
  );
}
