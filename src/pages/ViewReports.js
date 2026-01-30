import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

function ViewReports() {
  const { user } = useAuth();

  const [students, setStudents] = useState(() => readLS("schoolPortalStudents", []));
  const [subjects, setSubjects] = useState(() => readLS("schoolPortalSubjects", []));
  const [results, setResults] = useState(() => readLS("schoolPortalResults", []));

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [classSelect, setClassSelect] = useState("");
  const [studentSelect, setStudentSelect] = useState("");
  const [mode, setMode] = useState("individual");
  const [msg, setMsg] = useState(null);

  // Try online quietly; if fails, keep offline cache
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

        if (stuRes.ok) {
          const stu = await stuRes.json().catch(() => []);
          setStudents(Array.isArray(stu) ? stu : []);
          localStorage.setItem("schoolPortalStudents", JSON.stringify(stu));
        }
        if (subRes.ok) {
          const sub = await subRes.json().catch(() => []);
          setSubjects(Array.isArray(sub) ? sub : []);
          localStorage.setItem("schoolPortalSubjects", JSON.stringify(sub));
        }
        if (resRes.ok) {
          const res = await resRes.json().catch(() => []);
          setResults(Array.isArray(res) ? res : []);
          localStorage.setItem("schoolPortalResults", JSON.stringify(res));
        }
      } catch (e) {
        setFetchError(e.message || "Online fetch failed (using offline cache).");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
    return results.filter(
      (r) => (r.studentAdmissionNo || r.studentNameSelect) === admissionNo
    );
  };

  // ✅ FIXED HERE (class report)
  const resultsForClass = (className) => {
    const inClass = students.filter((s) => s.studentClass === className);
    const admissionNos = new Set(inClass.map((s) => s.admissionNo));
    return results.filter((r) =>
      admissionNos.has(r.studentAdmissionNo || r.studentNameSelect)
    );
  };

  const currentStudent = useMemo(() => {
    if (!studentSelect) return null;
    return getStudent(studentSelect);
  }, [studentSelect, students]);

  const individualRows = useMemo(() => {
    if (!studentSelect) return [];
    const rows = resultsForStudent(studentSelect);
    return rows.slice().sort((a, b) => {
      const tA = String(a.termSelect || "");
      const tB = String(b.termSelect || "");
      if (tA !== tB) return tA.localeCompare(tB);
      return String(a.subjectSelect || "").localeCompare(String(b.subjectSelect || ""));
    });
  }, [studentSelect, results]);

  const classReportByStudent = useMemo(() => {
    if (!classSelect) return [];
    return studentsInClass.map((s) => ({
      student: s,
      rows: resultsForStudent(s.admissionNo),
    }));
  }, [classSelect, studentsInClass, results]);

  const reset = () => {
    setMsg(null);
    setStudentSelect("");
    setClassSelect("");
  };

  const printReport = () => window.print();

  if (loading) return <div className="content-section">Loading reports…</div>;

  return (
    <div className="content-section">
      <h1>View Results Reports</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "User"}</b>
      </p>

      {fetchError && (
        <div style={{ padding: 10, background: "#fff7e6", border: "1px solid #ffe2a8", borderRadius: 8 }}>
          {fetchError}
        </div>
      )}

      <div className="sub-section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setMode("individual")}>Individual Report</button>
        <button onClick={() => setMode("class")}>Class Report</button>
        <button onClick={reset} style={{ background: "#6c757d" }}>Clear</button>
        <button onClick={printReport}>Print</button>
      </div>

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
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={studentSelect}
            onChange={(e) => setStudentSelect(e.target.value)}
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
      </div>

      <div className="sub-section">
        <h2>Report Output</h2>

        {mode === "individual" ? (
          !studentSelect ? (
            <p style={{ color: "#666" }}>Select a class and a student.</p>
          ) : !currentStudent ? (
            <p style={{ color: "#b00020" }}>Selected student not found.</p>
          ) : (
            <div style={{ background: "white", padding: 15, borderRadius: 8, border: "1px solid #eee" }}>
              <h3>
                {currentStudent.firstName} {currentStudent.lastName} ({currentStudent.admissionNo})
              </h3>

              {individualRows.length === 0 ? (
                <p style={{ color: "#777" }}>No results found for this student.</p>
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
                    {individualRows.map((r, idx) => {
                      const total = r.totalScore ?? r.total ?? 0;
                      const grade = r.grade || gradeFromTotal(total);
                      return (
                        <tr key={r._id || r.id || idx}>
                          <td style={td}>{subjectName(r.subjectSelect)}</td>
                          <td style={td}>{r.termSelect || "-"}</td>
                          <td style={td}><b>{total}</b></td>
                          <td style={td}><b>{grade}</b></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        ) : (
          !classSelect ? (
            <p style={{ color: "#666" }}>Select a class.</p>
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
                            <tr key={r._id || r.id || idx}>
                              <td style={td}>{subjectName(r.subjectSelect)}</td>
                              <td style={td}>{r.termSelect || "-"}</td>
                              <td style={td}><b>{total}</b></td>
                              <td style={td}><b>{grade}</b></td>
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

const th = { border: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f2f2f2" };
const td = { border: "1px solid #ddd", padding: 8 };

export default ViewReports;
