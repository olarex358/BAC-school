// src/pages/ViewReports.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

function ViewReports() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // filters
  const [classSelect, setClassSelect] = useState("");
  const [studentSelect, setStudentSelect] = useState("");

  // report mode
  const [mode, setMode] = useState("individual"); // "individual" | "class"

  // message
  const [msg, setMsg] = useState(null);

  /* =========================
     Load data (online-first)
  ========================= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const [stuRes, subRes, resRes] = await Promise.all([
          apiFetch("/api/schoolPortalStudents"),
          apiFetch("/api/schoolPortalSubjects"),
          apiFetch("/api/schoolPortalResults"),
        ]);

        if (!stuRes.ok) {
          const e = await stuRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to fetch students (${stuRes.status})`);
        }
        if (!subRes.ok) {
          const e = await subRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to fetch subjects (${subRes.status})`);
        }
        if (!resRes.ok) {
          const e = await resRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to fetch results (${resRes.status})`);
        }

        const stu = await stuRes.json().catch(() => []);
        const sub = await subRes.json().catch(() => []);
        const res = await resRes.json().catch(() => []);

        setStudents(Array.isArray(stu) ? stu : []);
        setSubjects(Array.isArray(sub) ? sub : []);
        setResults(Array.isArray(res) ? res : []);
      } catch (e) {
        setFetchError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================
     Helpers
  ========================= */
  const subjectName = (subjectSelect) => {
    const found = subjects.find(
      (s) => s.subjectCode === subjectSelect || s.subjectSelect === subjectSelect
    );
    return found?.subjectName || subjectSelect || "Unknown Subject";
  };

  const getStudent = (admissionNo) =>
    students.find((s) => s.admissionNo === admissionNo) || null;

  const gradeFromTotal = (total) => {
    const t = Number(total || 0);
    if (t >= 70) return "A";
    if (t >= 60) return "B";
    if (t >= 50) return "C";
    if (t >= 40) return "D";
    return "F";
  };

  const uniqueClasses = useMemo(() => {
    const list = students.map((s) => s.studentClass).filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  const studentsInClass = useMemo(() => {
    if (!classSelect) return [];
    return students.filter((s) => s.studentClass === classSelect);
  }, [students, classSelect]);

  const resultsForStudent = (admissionNo) => {
    // Your existing schema uses studentNameSelect as admissionNo
    return results.filter((r) => r.studentNameSelect === admissionNo);
  };

  const resultsForClass = (className) => {
    const inClass = students.filter((s) => s.studentClass === className);
    const admissionNos = new Set(inClass.map((s) => s.admissionNo));
    return results.filter((r) => admissionNos.has(r.studentNameSelect));
  };

  const currentStudent = useMemo(() => {
    if (!studentSelect) return null;
    return getStudent(studentSelect);
  }, [studentSelect, students]);

  const individualRows = useMemo(() => {
    if (!studentSelect) return [];
    const rows = resultsForStudent(studentSelect);

    // Sort by term then subject
    return rows.slice().sort((a, b) => {
      const tA = String(a.termSelect || "");
      const tB = String(b.termSelect || "");
      if (tA !== tB) return tA.localeCompare(tB);
      return String(a.subjectSelect || "").localeCompare(String(b.subjectSelect || ""));
    });
  }, [studentSelect, results]);

  const classReportByStudent = useMemo(() => {
    if (!classSelect) return [];
    const inClass = studentsInClass;

    return inClass.map((s) => ({
      student: s,
      rows: resultsForStudent(s.admissionNo),
    }));
  }, [classSelect, studentsInClass, results]);

  /* =========================
     UI actions
  ========================= */
  const reset = () => {
    setMsg(null);
    setStudentSelect("");
    setClassSelect("");
  };

  const printReport = () => {
    window.print();
  };

  // Simulated actions (safe)
  const sendByEmailSimulated = () => {
    if (!studentSelect) {
      setMsg({ type: "error", text: "Select a student first." });
      return;
    }
    const s = getStudent(studentSelect);
    setMsg({
      type: "success",
      text: `Simulated: Report sent to ${s?.contactEmail || "student email not set"}`,
    });
  };

  const sendByWhatsAppSimulated = () => {
    if (!studentSelect) {
      setMsg({ type: "error", text: "Select a student first." });
      return;
    }
    const s = getStudent(studentSelect);
    setMsg({
      type: "success",
      text: `Simulated: Report sent to WhatsApp ${s?.contactPhone || "phone not set"}`,
    });
  };

  /* =========================
     Render states
  ========================= */
  if (loading) return <div className="content-section">Loading reports data…</div>;

  if (fetchError) {
    return (
      <div
        className="content-section"
        style={{
          color: "#b00020",
          fontWeight: "bold",
          padding: 20,
          border: "1px solid #b00020",
          borderRadius: 6,
        }}
      >
        Error: {fetchError}
      </div>
    );
  }

  return (
    <div className="content-section">
      <h1>View Results Reports</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "User"}</b>
      </p>

      {msg && (
        <div
          style={{
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            color: "white",
            background: msg.type === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Mode */}
      <div className="sub-section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setMode("individual");
            setMsg(null);
          }}
          style={{
            background: mode === "individual" ? "var(--primary-blue-dark)" : "#6c757d",
          }}
        >
          Individual Report
        </button>

        <button
          onClick={() => {
            setMode("class");
            setMsg(null);
          }}
          style={{
            background: mode === "class" ? "var(--primary-blue-dark)" : "#6c757d",
          }}
        >
          Class Report
        </button>

        <button onClick={reset} style={{ background: "#6c757d" }}>
          Clear Selection
        </button>
      </div>

      {/* Filters */}
      <div className="sub-section">
        <h2>Filters</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 600 }}>
          <select
            value={classSelect}
            onChange={(e) => {
              setClassSelect(e.target.value);
              setStudentSelect("");
              setMsg(null);
            }}
          >
            <option value="">Select Class</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={studentSelect}
            onChange={(e) => {
              setStudentSelect(e.target.value);
              setMsg(null);
            }}
            disabled={!classSelect || mode === "class"}
          >
            <option value="">Select Student</option>
            {studentsInClass.map((s) => (
              <option key={s._id || s.admissionNo} value={s.admissionNo}>
                {s.firstName} {s.lastName} ({s.admissionNo})
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {mode === "individual" && (
            <>
              <button onClick={sendByEmailSimulated}>Send by Email (Simulated)</button>
              <button onClick={sendByWhatsAppSimulated} style={{ background: "#16a34a" }}>
                Send by WhatsApp (Simulated)
              </button>
            </>
          )}
          <button onClick={printReport}>Print</button>
        </div>
      </div>

      {/* REPORT OUTPUT */}
      <div className="sub-section">
        <h2>Report Output</h2>

        {mode === "individual" ? (
          !studentSelect ? (
            <p style={{ color: "#666" }}>Select a class and a student to view their report.</p>
          ) : !currentStudent ? (
            <p style={{ color: "#b00020" }}>Selected student not found.</p>
          ) : (
            <div style={{ background: "white", padding: 15, borderRadius: 8, border: "1px solid #eee" }}>
              <h3>
                {currentStudent.firstName} {currentStudent.lastName} ({currentStudent.admissionNo})
              </h3>
              <p>
                <b>Class:</b> {currentStudent.studentClass}
              </p>

              {individualRows.length === 0 ? (
                <p style={{ color: "#777" }}>No results found for this student.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th style={th}>Subject</th>
                      <th style={th}>Term</th>
                      <th style={th}>1st CA</th>
                      <th style={th}>2nd CA</th>
                      <th style={th}>Assignment</th>
                      <th style={th}>Exam</th>
                      <th style={th}>Total</th>
                      <th style={th}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualRows.map((r, idx) => {
                      const total = r.totalScore ?? r.total ?? 0;
                      const grade = r.grade || gradeFromTotal(total);

                      return (
                        <tr key={r._id || idx}>
                          <td style={td}>{subjectName(r.subjectSelect)}</td>
                          <td style={td}>{r.termSelect || "-"}</td>
                          <td style={td}>{r.firstCaScore ?? 0}</td>
                          <td style={td}>{r.secondCaScore ?? 0}</td>
                          <td style={td}>{r.assignmentScore ?? 0}</td>
                          <td style={td}>{r.examScore ?? 0}</td>
                          <td style={td}>
                            <b>{total}</b>
                          </td>
                          <td style={td}>
                            <b>{grade}</b>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        ) : (
          // CLASS REPORT
          !classSelect ? (
            <p style={{ color: "#666" }}>Select a class to view the class report.</p>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              <h3>Class Report: {classSelect}</h3>

              {classReportByStudent.map(({ student, rows }) => (
                <div
                  key={student._id || student.admissionNo}
                  style={{ background: "white", padding: 15, borderRadius: 8, border: "1px solid #eee" }}
                >
                  <h4 style={{ marginBottom: 6 }}>
                    {student.firstName} {student.lastName} ({student.admissionNo})
                  </h4>

                  {rows.length === 0 ? (
                    <p style={{ color: "#777" }}>No results found.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                      <thead>
                        <tr>
                          <th style={th}>Subject</th>
                          <th style={th}>Term</th>
                          <th style={th}>Total</th>
                          <th style={th}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => {
                          const total = r.totalScore ?? r.total ?? 0;
                          const grade = r.grade || gradeFromTotal(total);
                          return (
                            <tr key={r._id || idx}>
                              <td style={td}>{subjectName(r.subjectSelect)}</td>
                              <td style={td}>{r.termSelect || "-"}</td>
                              <td style={td}>
                                <b>{total}</b>
                              </td>
                              <td style={td}>
                                <b>{grade}</b>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left",
  background: "#f2f2f2",
};

const td = {
  border: "1px solid #ddd",
  padding: 8,
};

export default ViewReports;
