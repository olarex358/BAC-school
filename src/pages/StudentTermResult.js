import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import QRCode from "react-qr-code";
import logo from "../pages/logo.png";
import "../styles/uncreated-pages.css";

function StudentTermResult({
  batchMode = false,
  batchStudent = null,
  batchTerm = null,
  batchYear = null,
}) {
  const navigate = useNavigate();
  const params = useParams();

  // Resolve term & year (normal vs batch)
  const term = batchMode ? batchTerm : params.term;
  const year = batchMode ? batchYear : params.year;

  // Resolve user only if NOT batch
  const user = batchMode
    ? null
    : JSON.parse(localStorage.getItem("loggedInUser"));

  const [schoolProfile] = useLocalStorage("schoolPortalProfile", {});
  const [students] = useLocalStorage("schoolPortalStudents", []);
  const [results] = useLocalStorage("schoolPortalResults", []);

  const [student, setStudent] = useState(null);
  const [termResults, setTermResults] = useState([]);

  /* ================= AUTH / DATA ================= */
  useEffect(() => {
    if (!batchMode) {
      if (!user || user.type !== "student") {
        navigate("/login");
        return;
      }
    }

    const foundStudent = batchMode
      ? batchStudent
      : students.find((s) => s.admissionNo === user.admissionNo);

    setStudent(foundStudent);

    if (!foundStudent) return;

    const filtered = results.filter(
      (r) =>
        r.studentAdmissionNo === foundStudent.admissionNo &&
        r.termSelect === term &&
        r.academicYear === year &&
        r.status === "Approved"
    );

    setTermResults(filtered);
  }, [
    batchMode,
    batchStudent,
    user,
    students,
    results,
    term,
    year,
    navigate,
  ]);

  if (!student) {
    return <div className="content-section">Loading result...</div>;
  }

  /* ================= CALCULATIONS ================= */
  const totalScore = termResults.reduce(
    (sum, r) => sum + Number(r.totalScore || 0),
    0
  );

  const average = termResults.length
    ? (totalScore / termResults.length).toFixed(2)
    : 0;

  const overallRemark =
    average >= 75
      ? "Excellent performance"
      : average >= 60
      ? "Good performance"
      : average >= 50
      ? "Fair performance"
      : "Needs improvement";

  const verificationUrl = `https://bacschool.com/verify/${student.admissionNo}/${term}/${year}`;

  /* ================= UI ================= */
  return (
    <div className="result-sheet">
      {/* ===== WATERMARK ===== */}
      {schoolProfile.watermarkLogo && (
        <img src={logo} className="watermark" alt="Watermark" />
      )}

      {/* ===== HEADER ===== */}
      <div className="result-header">
        <img src={logo} alt="School Logo" height="80" />
        <div>
          <h2>{schoolProfile.schoolName}</h2>
          <p>{schoolProfile.address}</p>
          <p>{schoolProfile.phone}</p>
        </div>
      </div>

      <hr />

      {/* ===== STUDENT INFO ===== */}
      <div className="student-info">
        <p>
          <strong>Name:</strong> {student.firstName} {student.lastName}
        </p>
        <p>
          <strong>Admission No:</strong> {student.admissionNo}
        </p>
        <p>
          <strong>Class:</strong> {student.studentClass}
        </p>
        <p>
          <strong>Term:</strong> {term}
        </p>
        <p>
          <strong>Session:</strong> {year}
        </p>
      </div>

      {/* ===== RESULTS TABLE ===== */}
      <table className="results-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>CA1</th>
            <th>CA2</th>
            <th>Assg</th>
            <th>Exam</th>
            <th>Total</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {termResults.map((r) => (
            <tr key={r._id}>
              <td>{r.subjectSelect}</td>
              <td>{r.firstCaScore}</td>
              <td>{r.secondCaScore}</td>
              <td>{r.assignmentScore}</td>
              <td>{r.examScore}</td>
              <td>
                <strong>{r.totalScore}</strong>
              </td>
              <td>
                <strong>{r.grade}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== SUMMARY ===== */}
      <div className="result-summary">
        <p>
          <strong>Total Score:</strong> {totalScore}
        </p>
        <p>
          <strong>Average:</strong> {average}
        </p>
        <p>
          <strong>Remark:</strong> {overallRemark}
        </p>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="result-footer">
        <div>
          <p>Principal’s Comment:</p>
          <p>{schoolProfile.principalComment || overallRemark}</p>
          {schoolProfile.principalSignature && (
            <img
              src={schoolProfile.principalSignature}
              alt="Signature"
              height="50"
            />
          )}
        </div>

        <div>
          {schoolProfile.schoolStamp && (
            <img src={schoolProfile.schoolStamp} alt="Stamp" height="80" />
          )}
        </div>

        <div>
          <QRCode value={verificationUrl} size={80} />
          <small>Verify Result</small>
        </div>
      </div>

      {/* ===== PRINT BUTTON (STUDENT ONLY) ===== */}
      {!batchMode && (
        <button onClick={() => window.print()}>Print Result</button>
      )}
    </div>
  );
}

export default StudentTermResult;
