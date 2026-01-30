import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import logo from "../pages/logo.png";
import "../styles/uncreated-pages.css";

const norm = (v) => String(v ?? "").trim();

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

function StudentTermResult({
  batchMode = false,
  batchStudent = null,
  batchTerm = null,
  batchYear = null,
}) {
  const navigate = useNavigate();
  const params = useParams();

  const term = batchMode ? batchTerm : params.term;
  const year = batchMode ? batchYear : params.year;

  const user = batchMode ? null : JSON.parse(localStorage.getItem("loggedInUser"));

  const [schoolProfile] = useState(() => readLS("schoolPortalProfile", {}));
  const [students] = useState(() => readLS("schoolPortalStudents", []));
  const [results] = useState(() => readLS("schoolPortalResults", []));

  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (!batchMode) {
      if (!user || user.type !== "student") {
        navigate("/login");
        return;
      }
    }

    const foundStudent = batchMode
      ? batchStudent
      : students.find((s) => norm(s.admissionNo) === norm(user?.admissionNo));

    setStudent(foundStudent);
  }, [batchMode, batchStudent, user, students, navigate]);

  const termResults = useMemo(() => {
    if (!student) return [];

    return results.filter((r) => {
      const admissionNo =
        norm(r.studentAdmissionNo) || norm(r.studentNameSelect) || norm(r.admissionNo);

      const rTerm = norm(r.termSelect) || norm(r.term);
      const rYear = norm(r.academicYear) || norm(r.sessionSelect) || norm(r.session);
      const status = norm(r.status) || (r.approved ? "Approved" : "");

      return (
        admissionNo === norm(student.admissionNo) &&
        rTerm === norm(term) &&
        rYear === norm(year) &&
        status.toLowerCase() === "approved"
      );
    });
  }, [student, results, term, year]);

  if (!student) return <div className="content-section">Loading result...</div>;

  const totalScore = termResults.reduce(
    (sum, r) => sum + Number(r.totalScore || r.total || 0),
    0
  );
  const average = termResults.length ? (totalScore / termResults.length).toFixed(2) : 0;

  const overallRemark =
    average >= 75 ? "Excellent performance" :
    average >= 60 ? "Good performance" :
    average >= 50 ? "Fair performance" : "Needs improvement";

  const verificationUrl = `https://bacschool.com/verify/${student.admissionNo}/${term}/${year}`;

  return (
    <div className="result-sheet">
      {schoolProfile?.watermarkLogo && (
        <img src={logo} className="watermark" alt="Watermark" />
      )}

      <div className="result-header">
        <img src={logo} alt="School Logo" height="80" />
        <div>
          <h2>{schoolProfile?.schoolName || "School"}</h2>
          <p>{schoolProfile?.address || ""}</p>
          <p>{schoolProfile?.phone || ""}</p>
        </div>
      </div>

      <hr />

      <div className="student-info">
        <p><strong>Name:</strong> {student.firstName} {student.lastName}</p>
        <p><strong>Admission No:</strong> {student.admissionNo}</p>
        <p><strong>Class:</strong> {student.studentClass}</p>
        <p><strong>Term:</strong> {term}</p>
        <p><strong>Session:</strong> {year}</p>
      </div>

      <table className="results-table">
        <thead>
          <tr>
            <th>Subject</th><th>CA1</th><th>CA2</th><th>Assg</th><th>Exam</th><th>Total</th><th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {termResults.map((r) => (
            <tr key={r._id || r.id}>
              <td>{r.subjectSelect}</td>
              <td>{r.firstCaScore ?? 0}</td>
              <td>{r.secondCaScore ?? 0}</td>
              <td>{r.assignmentScore ?? 0}</td>
              <td>{r.examScore ?? 0}</td>
              <td><strong>{r.totalScore ?? r.total ?? 0}</strong></td>
              <td><strong>{r.grade || "-"}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="result-summary">
        <p><strong>Total Score:</strong> {totalScore}</p>
        <p><strong>Average:</strong> {average}</p>
        <p><strong>Remark:</strong> {overallRemark}</p>
      </div>

      <div className="result-footer">
        <div>
          <p>Principal’s Comment:</p>
          <p>{schoolProfile?.principalComment || overallRemark}</p>
          {schoolProfile?.principalSignature && (
            <img src={schoolProfile.principalSignature} alt="Signature" height="50" />
          )}
        </div>

        <div>
          {schoolProfile?.schoolStamp && (
            <img src={schoolProfile.schoolStamp} alt="Stamp" height="80" />
          )}
        </div>

        <div>
          <QRCode value={verificationUrl} size={80} />
          <small>Verify Result</small>
        </div>
      </div>

      {!batchMode && <button onClick={() => window.print()}>Print Result</button>}
    </div>
  );
}

export default StudentTermResult;
