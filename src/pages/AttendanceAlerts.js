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

export default function AttendanceAlerts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [students] = useState(() => readLS(LS_STU, []));
  const [records, setRecords] = useState(() => readLS(LS_ATT, []).map(normalizeAttendance));

  const [threshold, setThreshold] = useState(75); // percent
  const [minRecords, setMinRecords] = useState(5);

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

  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((s) => map.set(String(s.admissionNo), s));
    return map;
  }, [students]);

  const statsByStudent = useMemo(() => {
    const map = new Map();

    records.forEach((r) => {
      if (!r.admissionNo) return;
      if (!map.has(r.admissionNo)) {
        map.set(r.admissionNo, { admissionNo: r.admissionNo, present: 0, total: 0, class: r.class || "" });
      }
      const row = map.get(r.admissionNo);
      row.total += 1;
      if (r.status === "Present") row.present += 1;
      if (!row.class && r.class) row.class = r.class;
    });

    return Array.from(map.values()).map((x) => ({
      ...x,
      pct: x.total ? (x.present / x.total) * 100 : 0,
    }));
  }, [records]);

  const alerts = useMemo(() => {
    const th = Number(threshold) || 0;
    const min = Number(minRecords) || 0;
    return statsByStudent
      .filter((s) => s.total >= min && s.pct < th)
      .sort((a, b) => a.pct - b.pct);
  }, [statsByStudent, threshold, minRecords]);

  const nameOf = (admissionNo) => {
    const s = studentMap.get(String(admissionNo));
    if (!s) return "";
    return `${s.firstName || ""} ${s.lastName || ""}`.trim();
  };

  const exportCSV = () => {
    const header = "admissionNo,name,class,present,total,percentage";
    const rows = alerts.map((a) => {
      const nm = nameOf(a.admissionNo).replace(/,/g, " ");
      return `${a.admissionNo},${nm},${(a.class || "").replace(/,/g, " ")},${a.present},${a.total},${a.pct.toFixed(2)}`;
    });
    downloadTextFile(`attendance_alerts_${Date.now()}.csv`, [header, ...rows].join("\n"));
  };

  if (!user) return <div className="content-section">Loading…</div>;

  return (
    <div className="content-section">
      <AttendanceNav />

      <h1>Attendance Alerts</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <label>
          Threshold %
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            style={{ width: 90, marginLeft: 6 }}
          />
        </label>

        <label>
          Min Records
          <input
            type="number"
            value={minRecords}
            onChange={(e) => setMinRecords(e.target.value)}
            style={{ width: 90, marginLeft: 6 }}
          />
        </label>

        <button type="button" onClick={exportCSV}>Export CSV</button>
      </div>

      <p>
        Students below <b>{threshold}%</b> attendance (min records: <b>{minRecords}</b>) →{" "}
        <b>{alerts.length}</b>
      </p>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Admission No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Present</th>
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length ? alerts.map((a) => (
              <tr key={a.admissionNo}>
                <td>{a.admissionNo}</td>
                <td>{nameOf(a.admissionNo) || "-"}</td>
                <td>{a.class || "-"}</td>
                <td>{a.present}</td>
                <td>{a.total}</td>
                <td><b>{a.pct.toFixed(2)}%</b></td>
              </tr>
            )) : (
              <tr><td colSpan="6">No alerts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
