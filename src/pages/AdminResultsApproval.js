import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import BatchResultSlipPrint from "./results/BatchResultSlipPrint";

const norm = (v) => String(v ?? "").trim();
const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

function normalizeResult(r) {
  return {
    ...r,
    studentAdmissionNo: r.studentAdmissionNo || r.studentNameSelect || r.admissionNo || "",
    studentClass: r.studentClass || r.classSelect || r.classLevel || "",
    academicYear: r.academicYear || r.sessionSelect || r.session || "",
    termSelect: r.termSelect || r.term || "",
    sessionSelect: r.sessionSelect || r.session || r.academicYear || "",
    totalScore: r.totalScore ?? r.total ?? 0,
  };
}

function AdminResultsApproval() {
  const { user } = useAuth();

  // ✅ offline-first
  const [pendingResults, setPendingResults] = useState(() =>
    readLS("schoolPortalPendingResults", []).map(normalizeResult)
  );
  const [approvedResults, setApprovedResults] = useState(() =>
    readLS("schoolPortalResults", []).map(normalizeResult)
  );
  const [students, setStudents] = useState(() => readLS("schoolPortalStudents", []));
  const [subjects, setSubjects] = useState(() => readLS("schoolPortalSubjects", []));
  const [staffs, setStaffs] = useState(() => readLS("schoolPortalStaff", []));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [showBatchPrint, setShowBatchPrint] = useState(false);

  // Try online quietly (don’t wipe local on failure)
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [pendingRes, approvedRes, studentsRes, subjectsRes, staffRes] =
          await Promise.all([
            apiFetch("/api/schoolPortalPendingResults"),
            apiFetch("/api/schoolPortalResults"),
            apiFetch("/api/schoolPortalStudents"),
            apiFetch("/api/schoolPortalSubjects"),
            apiFetch("/api/schoolPortalStaff"),
          ]);

        if (pendingRes.ok) {
          const p = (await pendingRes.json().catch(() => [])) || [];
          setPendingResults(p.map(normalizeResult));
          writeLS("schoolPortalPendingResults", p);
        }
        if (approvedRes.ok) {
          const a = (await approvedRes.json().catch(() => [])) || [];
          setApprovedResults(a.map(normalizeResult));
          writeLS("schoolPortalResults", a);
        }
        if (studentsRes.ok) {
          const s = (await studentsRes.json().catch(() => [])) || [];
          setStudents(s);
          writeLS("schoolPortalStudents", s);
        }
        if (subjectsRes.ok) {
          const s = (await subjectsRes.json().catch(() => [])) || [];
          setSubjects(s);
          writeLS("schoolPortalSubjects", s);
        }
        if (staffRes.ok) {
          const s = (await staffRes.json().catch(() => [])) || [];
          setStaffs(s);
          writeLS("schoolPortalStaff", s);
        }
      } catch (e) {
        setError(e.message || "Online fetch failed (using offline cache).");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const getStudentName = (admissionNo) => {
    const s = students.find((x) => x.admissionNo === admissionNo);
    if (!s) return admissionNo || "Unknown Student";
    return `${s.firstName || ""} ${s.lastName || ""}`.trim() || admissionNo;
  };

  const getSubjectName = (code) => {
    const s = subjects.find((x) => x.subjectCode === code);
    return s ? s.subjectName : code || "Unknown Subject";
  };

  const getTeacherName = (staffIdOrUsername) => {
    const t = staffs.find((x) => x.staffId === staffIdOrUsername);
    return t ? `${t.firstname || ""} ${t.surname || ""}`.trim() : (staffIdOrUsername || "Unknown Teacher");
  };

  const approveResult = async (result0) => {
    const result = normalizeResult(result0);
    if (!window.confirm("Approve this result?")) return;

    const approvedPayload = {
      ...result,
      status: "Approved",
      approved: true,
      approvedBy: user?.username || "admin",
      approvedAt: new Date().toISOString(),
    };

    // ✅ offline move first (instant)
    setPendingResults((prev) => {
      const next = prev.filter((r) => r._id !== result0._id);
      writeLS("schoolPortalPendingResults", next);
      return next;
    });

    setApprovedResults((prev) => {
      const next = [...prev, approvedPayload].map(normalizeResult);
      writeLS("schoolPortalResults", next);
      return next;
    });

    // try online (optional)
    try {
      const addRes = await apiFetch("/api/schoolPortalResults", {
        method: "POST",
        body: JSON.stringify(approvedPayload),
      });

      await apiFetch(`/api/schoolPortalPendingResults/${result0._id}`, {
        method: "DELETE",
      });

      if (!addRes.ok) throw new Error("Online approval failed (offline saved).");

      setMessage({ type: "success", text: "Result approved successfully." });
    } catch (e) {
      setMessage({ type: "success", text: "Approved offline (online sync later)." });
    }
  };

  const rejectResult = async (result) => {
    if (!window.confirm("Reject this result?")) return;

    // ✅ remove locally
    setPendingResults((prev) => {
      const next = prev.filter((r) => r._id !== result._id);
      writeLS("schoolPortalPendingResults", next);
      return next;
    });

    // try online (optional)
    try {
      await apiFetch(`/api/schoolPortalPendingResults/${result._id}`, { method: "DELETE" });
      setMessage({ type: "success", text: "Result rejected." });
    } catch {
      setMessage({ type: "success", text: "Rejected offline (online sync later)." });
    }
  };

  const filteredPending = useMemo(() => {
    const t = norm(searchTerm).toLowerCase();
    return pendingResults.filter((r0) => {
      const r = normalizeResult(r0);
      return (
        getStudentName(r.studentAdmissionNo).toLowerCase().includes(t) ||
        getSubjectName(r.subjectSelect).toLowerCase().includes(t) ||
        getTeacherName(r.submittedBy).toLowerCase().includes(t) ||
        norm(r.studentClass).toLowerCase().includes(t)
      );
    });
  }, [pendingResults, searchTerm]);

  if (loading) return <div className="content-section">Loading approvals…</div>;

  const printTerm = approvedResults[0]?.termSelect || approvedResults[0]?.term || "";
  const printSession = approvedResults[0]?.academicYear || approvedResults[0]?.sessionSelect || approvedResults[0]?.session || "";

  return (
    <div className="content-section">
      <h1>Results Approval</h1>
      <p>Approve or reject submitted results.</p>

      {error && (
        <div style={{ padding: 10, background: "#fff7e6", border: "1px solid #ffe2a8", borderRadius: 8 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ padding: 10, marginBottom: 15, color: "#fff", background: message.type === "success" ? "#28a745" : "#dc3545" }}>
          {message.text}
        </div>
      )}

      <input
        type="text"
        placeholder="Search student, subject, teacher, class..."
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
              filteredPending.map((r0) => {
                const r = normalizeResult(r0);
                return (
                  <tr key={r0._id || r0.id}>
                    <td>{getStudentName(r.studentAdmissionNo)}</td>
                    <td>{r.studentClass || "-"}</td>
                    <td>{getSubjectName(r.subjectSelect)}</td>
                    <td>{r.totalScore ?? 0}</td>
                    <td>{getTeacherName(r.submittedBy)}</td>
                    <td>
                      <button onClick={() => approveResult(r0)}>Approve</button>{" "}
                      <button onClick={() => rejectResult(r0)}>Reject</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="6">No pending results.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showBatchPrint && (
        <BatchResultSlipPrint
          students={students}
          results={approvedResults}
          term={printTerm}
          session={printSession}
        />
      )}
    </div>
  );
}

export default AdminResultsApproval;
