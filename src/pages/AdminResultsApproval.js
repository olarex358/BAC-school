// src/pages/AdminResultsApproval.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import BatchResultSlipPrint from "./results/BatchResultSlipPrint";

function AdminResultsApproval() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);
  const [showBatchPrint, setShowBatchPrint] = useState(false);

  // Data hooks
  const [pendingResults, setPendingResults, loadingPending] =
    useLocalStorage("schoolPortalPendingResults", [], "http://localhost:5000/api/schoolPortalPendingResults");

  const [approvedResults, setApprovedResults, loadingApproved] =
    useLocalStorage("schoolPortalResults", [], "http://localhost:5000/api/schoolPortalResults");

  const [students] =
    useLocalStorage("schoolPortalStudents", [], "http://localhost:5000/api/schoolPortalStudents");

  const [subjects] =
    useLocalStorage("schoolPortalSubjects", [], "http://localhost:5000/api/schoolPortalSubjects");

  const [staffs] =
    useLocalStorage("schoolPortalStaff", [], "http://localhost:5000/api/schoolPortalStaff");

  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Protect route
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "admin") {
      setLoggedInAdmin(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  /* ================= HELPERS ================= */
  const getStudentName = (admissionNo) => {
    const student = students.find((s) => s.admissionNo === admissionNo);
    return student ? student.name : "Unknown Student";
  };

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find((s) => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : "Unknown Subject";
  };

  const getTeacherName = (staffId) => {
    const teacher = staffs.find((s) => s.staffId === staffId);
    return teacher ? `${teacher.firstname} ${teacher.surname}` : "Unknown Teacher";
  };

  /* ================= APPROVE ================= */
  const handleApprove = async (resultId) => {
    if (!window.confirm("Approve this result?")) return;

    const resultToApprove = pendingResults.find((r) => r.id === resultId);
    if (!resultToApprove) return;

    const approvedResult = {
      ...resultToApprove,
      approved: true,
      approvedAt: Date.now(),
    };

    try {
      const addResponse = await fetch("http://localhost:5000/api/schoolPortalResults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approvedResult),
      });

      const deleteResponse = await fetch(
        `http://localhost:5000/api/schoolPortalPendingResults/${resultToApprove._id}`,
        { method: "DELETE" }
      );

      if (addResponse.ok && deleteResponse.ok) {
        setPendingResults((prev) => prev.filter((r) => r.id !== resultId));
        setApprovedResults((prev) => [...prev, approvedResult]);
        setMessage({ type: "success", text: "Result approved successfully." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Approval failed. Network issue." });
    }
  };

  /* ================= REJECT ================= */
  const handleReject = async (resultId) => {
    if (!window.confirm("Reject this result?")) return;

    const resultToReject = pendingResults.find((r) => r.id === resultId);
    if (!resultToReject) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/schoolPortalPendingResults/${resultToReject._id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setPendingResults((prev) => prev.filter((r) => r.id !== resultId));
        setMessage({ type: "success", text: "Result rejected." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Rejection failed." });
    }
  };

  /* ================= FILTER ================= */
  const filteredPendingResults = pendingResults.filter(
    (r) =>
      getStudentName(r.studentNameSelect).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectName(r.subjectSelect).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTeacherName(r.submittedBy).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loggedInAdmin) return <div>Access Denied</div>;
  if (loadingPending || loadingApproved) return <div>Loading...</div>;

  /* ================= UI ================= */
  return (
    <div className="content-section">
      <h1>Results Approval</h1>
      <p>Approve or reject submitted results.</p>

      {message && (
        <div
          style={{
            padding: 10,
            marginBottom: 15,
            color: "white",
            backgroundColor: message.type === "success" ? "#28a745" : "#dc3545",
          }}
        >
          {message.text}
        </div>
      )}

      <input
        type="text"
        placeholder="Search student, subject, teacher"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 15 }}
      />

      {/* ===== BATCH PRINT BUTTON ===== */}
      <button
        className="action-btn"
        style={{ marginBottom: 15 }}
        onClick={() => {
          setShowBatchPrint(true);
          setTimeout(() => window.print(), 500);
        }}
      >
        Print All Approved Result Slips
      </button>

      {/* ===== PENDING TABLE ===== */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Total</th>
              <th>Teacher</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPendingResults.length ? (
              filteredPendingResults.map((r) => (
                <tr key={r.id}>
                  <td>{getStudentName(r.studentNameSelect)} ({r.studentNameSelect})</td>
                  <td>{r.classSelect}</td>
                  <td>{getSubjectName(r.subjectSelect)}</td>
                  <td>{r.totalScore}</td>
                  <td>{getTeacherName(r.submittedBy)}</td>
                  <td>
                    <button className="action-btn edit-btn" onClick={() => handleApprove(r.id)}>
                      Approve
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleReject(r.id)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No pending results.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== BATCH PRINT RENDER ===== */}
      {showBatchPrint && (
        <BatchResultSlipPrint
          students={students}
          results={approvedResults}
          term={approvedResults[0]?.term}
          session={approvedResults[0]?.session}
        />
      )}
    </div>
  );
}

export default AdminResultsApproval;
