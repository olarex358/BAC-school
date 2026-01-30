import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const norm = (v) => String(v ?? "").trim();

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

function StudentResults() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  // ✅ offline-first
  const [allApprovedResults, setAllApprovedResults] = useState(() =>
    readLS("schoolPortalResults", [])
  );
  const [allSubjects, setAllSubjects] = useState(() =>
    readLS("schoolPortalSubjects", [])
  );

  // refresh local cache when page opens
  useEffect(() => {
    setAllApprovedResults(readLS("schoolPortalResults", []));
    setAllSubjects(readLS("schoolPortalSubjects", []));
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") setLoggedInStudent(user);
    else navigate("/login");
  }, [navigate]);

  const studentSpecificResults = useMemo(() => {
    if (!loggedInStudent) return [];
    const adm = norm(loggedInStudent.admissionNo);

    return (allApprovedResults || []).filter((r) => {
      const admissionNo =
        norm(r.studentAdmissionNo) ||
        norm(r.studentNameSelect) ||
        norm(r.admissionNo);

      const status = norm(r.status) || (r.approved ? "Approved" : "");
      return admissionNo === adm && status.toLowerCase() === "approved";
    });
  }, [loggedInStudent, allApprovedResults]);

  const getGradeAndPoints = (score) => {
    if (score >= 70) return { grade: "A", points: 5.0 };
    if (score >= 60) return { grade: "B", points: 4.0 };
    if (score >= 50) return { grade: "C", points: 3.0 };
    if (score >= 40) return { grade: "D", points: 2.0 };
    return { grade: "F", points: 0.0 };
  };

  const calcTotal = (r) =>
    Number(
      r.totalScore ??
        r.total ??
        (Number(r.firstCaScore || 0) +
          Number(r.secondCaScore || 0) +
          Number(r.assignmentScore || 0) +
          Number(r.examScore || 0))
    );

  const totalScore = useMemo(() => {
    return studentSpecificResults.reduce((sum, r) => sum + calcTotal(r), 0);
  }, [studentSpecificResults]);

  const averageScore = useMemo(() => {
    if (!studentSpecificResults.length) return 0;
    return (totalScore / studentSpecificResults.length).toFixed(2);
  }, [studentSpecificResults, totalScore]);

  const gpa = useMemo(() => {
    if (!studentSpecificResults.length) return 0;
    const totalPoints = studentSpecificResults.reduce((sum, r) => {
      const { points } = getGradeAndPoints(calcTotal(r));
      return sum + points;
    }, 0);
    return (totalPoints / studentSpecificResults.length).toFixed(2);
  }, [studentSpecificResults]);

  const getSubjectName = (subjectCode) => {
    const subject = (allSubjects || []).find(
      (s) => s.subjectCode === subjectCode
    );
    return subject ? subject.subjectName : subjectCode;
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/home");
  };

  if (!loggedInStudent) {
    return <div className="content-section">Loading results...</div>;
  }

  const gpaClass =
    gpa >= 4.0 ? "gpa-green" : gpa >= 3.0 ? "gpa-orange" : "gpa-red";

  return (
    <div className="content-section">
      <h1>My Results</h1>
      <p>
        Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}!
      </p>

      <div className="results-summary-card">
        <div className="summary-item">
          <h3 className="summary-title">Total Score:</h3>
          <p className="summary-value">{totalScore}</p>
        </div>
        <div className="summary-item">
          <h3 className="summary-title">Average Score:</h3>
          <p className="summary-value">{averageScore}%</p>
        </div>
        <div className="summary-item">
          <h3 className="summary-title">GPA:</h3>
          <p className={`summary-value ${gpaClass}`}>{gpa}</p>
        </div>
      </div>

      <h3>Your Academic Performance:</h3>
      {studentSpecificResults.length > 0 ? (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Term</th>
                <th>Session</th>
                <th>CA1</th>
                <th>CA2</th>
                <th>Assg</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {studentSpecificResults.map((r, index) => (
                <tr
                  key={r._id || r.id || index}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                >
                  <td>{getSubjectName(r.subjectSelect)}</td>
                  <td>{r.termSelect || r.term}</td>
                  <td>{r.academicYear || r.sessionSelect || r.session}</td>
                  <td>{r.firstCaScore ?? 0}</td>
                  <td>{r.secondCaScore ?? 0}</td>
                  <td>{r.assignmentScore ?? 0}</td>
                  <td>{r.examScore ?? 0}</td>
                  <td className="total-score">
                    <strong>{calcTotal(r)}</strong>
                  </td>
                  <td className={`grade-cell grade-${String(r.grade || "f").toLowerCase()}`}>
                    <strong>{r.grade || "-"}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data-message">No approved results available yet.</p>
      )}

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StudentResults;
