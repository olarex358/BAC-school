import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

function AttendanceAlerts() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // filters
  const [classFilter, setClassFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // thresholds
  const [minAttendancePercent, setMinAttendancePercent] = useState(75);
  const [maxAbsences, setMaxAbsences] = useState(5);
  const [consecutiveAbsences, setConsecutiveAbsences] = useState(3);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);

      try {
        const [attRes, stuRes] = await Promise.all([
          apiFetch("/api/schoolPortalAttendance"),
          apiFetch("/api/schoolPortalStudents"),
        ]);

        if (!attRes.ok) {
          const e = await attRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to load attendance (${attRes.status})`);
        }

        if (!stuRes.ok) {
          const e = await stuRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to load students (${stuRes.status})`);
        }

        const att = await attRes.json().catch(() => []);
        const stu = await stuRes.json().catch(() => []);

        setAttendance(Array.isArray(att) ? att : []);
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

  const studentMap = useMemo(() => {
    const m = new Map();
    students.forEach((s) => m.set(s.admissionNo, s));
    return m;
  }, [students]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      // class filter (record might store classSelect)
      if (classFilter && r.classSelect && r.classSelect !== classFilter) return false;

      const d = String(r.date || r.markedAt || "").slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;

      return true;
    });
  }, [attendance, classFilter, fromDate, toDate]);

  // group by student admissionNo
  const grouped = useMemo(() => {
    const map = new Map();

    filteredAttendance.forEach((r) => {
      const adm = r.studentNameSelect || r.admissionNo;
      if (!adm) return;

      if (!map.has(adm)) map.set(adm, []);
      map.get(adm).push(r);
    });

    // sort records by date per student
    for (const [adm, rows] of map.entries()) {
      rows.sort((a, b) => {
        const da = String(a.date || a.markedAt || "").slice(0, 10);
        const db = String(b.date || b.markedAt || "").slice(0, 10);
        return da.localeCompare(db);
      });
      map.set(adm, rows);
    }

    return map;
  }, [filteredAttendance]);

  const computeConsecutiveAbsences = (rows) => {
    let maxRun = 0;
    let run = 0;

    for (const r of rows) {
      const status = String(r.status || r.attendanceStatus || "").toLowerCase();
      if (status === "absent") {
        run += 1;
        if (run > maxRun) maxRun = run;
      } else {
        run = 0;
      }
    }
    return maxRun;
  };

  const alerts = useMemo(() => {
    const list = [];

    for (const [adm, rows] of grouped.entries()) {
      let present = 0;
      let absent = 0;

      rows.forEach((r) => {
        const status = String(r.status || r.attendanceStatus || "").toLowerCase();
        if (status === "present") present += 1;
        else if (status === "absent") absent += 1;
      });

      const total = present + absent;
      const percent = total ? Math.round((present / total) * 100) : 0;
      const consAbs = computeConsecutiveAbsences(rows);

      const s = studentMap.get(adm);
      const studentName =
        s?.fullName ||
        `${s?.firstName || ""} ${s?.lastName || ""}`.trim() ||
        adm;

      const studentClass = s?.studentClass || rows[0]?.classSelect || "-";

      const reasons = [];
      if (percent < Number(minAttendancePercent)) reasons.push(`Low attendance (${percent}%)`);
      if (absent >= Number(maxAbsences)) reasons.push(`Many absences (${absent})`);
      if (consAbs >= Number(consecutiveAbsences)) reasons.push(`Consecutive absences (${consAbs})`);

      if (reasons.length) {
        list.push({
          admissionNo: adm,
          studentName,
          studentClass,
          present,
          absent,
          total,
          attendancePercent: percent,
          consecutiveAbsences: consAbs,
          reasons: reasons.join(" | "),
        });
      }
    }

    // Sort: worst first
    list.sort((a, b) => a.attendancePercent - b.attendancePercent);
    return list;
  }, [grouped, studentMap, minAttendancePercent, maxAbsences, consecutiveAbsences]);

  const exportCSV = () => {
    const header = [
      "admissionNo",
      "studentName",
      "class",
      "present",
      "absent",
      "total",
      "attendancePercent",
      "consecutiveAbsences",
      "reasons",
    ];

    const rows = alerts.map((a) => [
      a.admissionNo,
      a.studentName,
      a.studentClass,
      a.present,
      a.absent,
      a.total,
      a.attendancePercent,
      a.consecutiveAbsences,
      a.reasons,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_alerts${classFilter ? "_" + classFilter : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="content-section">Loading attendance alerts…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Attendance Alerts</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "Admin"}</b>
      </p>

      <div className="sub-section" style={{ display: "grid", gap: 10, maxWidth: 900 }}>
        <h2>Filters</h2>

        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, color: "#666" }}>From</label><br />
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666" }}>To</label><br />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button
            onClick={() => { setClassFilter(""); setFromDate(""); setToDate(""); }}
            style={{ background: "#6c757d" }}
          >
            Clear Filters
          </button>
        </div>

        <h2>Alert Thresholds</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: "#666" }}>Min Attendance %</label>
            <input
              type="number"
              value={minAttendancePercent}
              onChange={(e) => setMinAttendancePercent(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666" }}>Max Absences</label>
            <input
              type="number"
              value={maxAbsences}
              onChange={(e) => setMaxAbsences(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666" }}>Consecutive Absences</label>
            <input
              type="number"
              value={consecutiveAbsences}
              onChange={(e) => setConsecutiveAbsences(e.target.value)}
            />
          </div>
        </div>

        <button onClick={exportCSV}>Export Alerts CSV</button>
      </div>

      <div className="sub-section">
        <h2>Alerts ({alerts.length})</h2>

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Student</th>
                <th style={th}>Admission No</th>
                <th style={th}>Class</th>
                <th style={th}>Present</th>
                <th style={th}>Absent</th>
                <th style={th}>%</th>
                <th style={th}>Consecutive Abs</th>
                <th style={th}>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length ? (
                alerts.map((a) => (
                  <tr key={a.admissionNo}>
                    <td style={td}><b>{a.studentName}</b></td>
                    <td style={td}>{a.admissionNo}</td>
                    <td style={td}>{a.studentClass}</td>
                    <td style={td}>{a.present}</td>
                    <td style={td}>{a.absent}</td>
                    <td style={td}><b>{a.attendancePercent}%</b></td>
                    <td style={td}>{a.consecutiveAbsences}</td>
                    <td style={td}>{a.reasons}</td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="8">No alerts found for current thresholds.</td></tr>
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

export default AttendanceAlerts;
