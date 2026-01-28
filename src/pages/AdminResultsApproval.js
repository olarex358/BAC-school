// src/pages/AdminResultsApproval.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import BatchResultSlipPrint from "./results/BatchResultSlipPrint";

function AdminResultsApproval() {
  const { user } = useAuth();

  const [pendingResults, setPendingResults] = useState([]);
  const [approvedResults, setApprovedResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffs, setStaffs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [showBatchPrint, setShowBatchPrint] = useState(false);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          pendingRes,
          approvedRes,
          studentsRes,
          subjectsRes,
          staffRes,
        ] = await Promise.all([
          apiFetch("/api/schoolPortalPendingResults"),
          apiFetch("/api/schoolPortalResults"),
          apiFetch("/api/schoolPortalStudents"),
          apiFetch("/api/schoolPortalSubjects"),
          apiFetch("/api/schoolPortalStaff"),
        ]);

        if (
          !pendingRes.ok ||
          !approvedRes.ok ||
          !studentsRes.ok ||
          !subjectsRes.ok ||
          !staffRes.ok
        ) {
          throw new Error("Failed to load approval data");
        }

        setPendingResults(await pendingRes.json());
        setApprovedResults(await approvedRes.json());
        setStudents(await studentsRes.json());
        setSubjects(await subjectsRes.json());
        setStaffs(await staffRes.json());
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  /* ================= HELPERS ================= */
  const getStudentName = (admissionNo) => {
    const s = students.find((x) => x.admissionNo === admissionNo);
    return s ? s.fullName || s.name : "Unknown Student";
  };

  const getSubjectName = (code) => {
    const s = subjects.find((x) => x.subjectCode === code);
    return s ? s.subjectName : "Unknown Subject";
  };

  const getTeacherName = (staffId) => {
    const t = staffs.find((x) => x.staffId === staffId);
    return t ? `${t.firstname || ""} ${t.surname || ""}`.trim() : "Unknown Teacher";
  };

  /* ================= APPROVE ================= */
  const approveResult = async (result) => {
    if (!window.confirm("Approve this result?")) return;

    try {
      const approvedPayload = {
        ...result,
        approved: true,
        approvedBy: user?.username || "admin",
        approvedAt: new Date().toISOString(),
      };

      const addRes = await apiFetch("/api/schoolPortalResults", {
        method: "POST",
        body: JSON.stringify(approvedPayload),
      });

      const delRes = await apiFetch(
        `/api/schoolPortalPendingResults/${result._id}`,
        { method: "DELETE" }
      );

      if (!addRes.ok || !delRes.ok) {
        throw new Error("Approval failed");
      }

      setPendingResults((prev) => prev.filter((r) => r._id !== result._id));
      setApprovedResults((prev) => [...prev, approvedPayload]);
      setMessage({ type: "success", text: "Result approved successfully." });
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Approval failed" });
    }
  };

  /* ================= REJECT ================= */
  const rejectResult = async (result) => {
    if (!window.confirm("Reject this result?")) return;

    try {
      const res = await apiFetch(
        `/api/schoolPortalPendingResults/${result._id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Rejection failed");

      setPendingResults((prev) => prev.filter((r) => r._id !== result._id));
      setMessage({ type: "success", text: "Result rejected." });
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Rejection failed" });
    }
  };

  /* ================= FILTER ================= */
  const filteredPending = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return pendingResults.filter(
      (r) =>
        getStudentName(r.studentNameSelect).toLowerCase().includes(t) ||
        getSubjectName(r.subjectSelect).toLowerCase().includes(t) ||
        getTeacherName(r.submittedBy).toLowerCase().includes(t)
    );
  }, [pendingResults, searchTerm]);

  /* ================= UI ================= */
  if (loading) return <div className="content-section">Loading approvals…</div>;
  if (error)
    return (
      <div className="content-section" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="content-section">
      <h1>Results Approval</h1>
      <p>Approve or reject submitted results.</p>

      {message && (
        <div
          style={{
            padding: 10,
            marginBottom: 15,
            color: "#fff",
            background:
              message.type === "success" ? "#28a745" : "#dc3545",
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
            {filteredPending.length ? (
              filteredPending.map((r) => (
                <tr key={r._id}>
                  <td>{getStudentName(r.studentNameSelect)}</td>
                  <td>{r.classSelect}</td>
                  <td>{getSubjectName(r.subjectSelect)}</td>
                  <td>{r.totalScore}</td>
                  <td>{getTeacherName(r.submittedBy)}</td>
                  <td>
                    <button onClick={() => approveResult(r)}>Approve</button>{" "}
                    <button onClick={() => rejectResult(r)}>Reject</button>
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
