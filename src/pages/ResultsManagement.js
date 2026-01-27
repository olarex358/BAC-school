// src/pages/ResultsManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { getCurrentAcademicPeriod } from "../utils/academicPeriod";

const initialForm = {
  studentNameSelect: "", // admissionNo
  classSelect: "",
  subjectSelect: "", // subjectCode or subjectName depending on your data
  termSelect: "",
  sessionSelect: "",
  firstCaScore: "",
  secondCaScore: "",
  assignmentScore: "",
  examScore: "",
};

function ResultsManagement() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [results, setResults] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState(() => {
    const p = getCurrentAcademicPeriod();
    return {
      ...initialForm,
      termSelect: p.term,
      sessionSelect: p.session,
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // modal
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================
     Load all data (online-first)
  ========================= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const [stuRes, subRes, resRes, pendRes] = await Promise.all([
          apiFetch("/api/schoolPortalStudents"),
          apiFetch("/api/schoolPortalSubjects"),
          apiFetch("/api/schoolPortalResults"),
          apiFetch("/api/schoolPortalPendingResults"),
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
        if (!pendRes.ok) {
          // pending is optional if backend does not have it yet
          const e = await pendRes.json().catch(() => ({}));
          throw new Error(e.message || `Failed to fetch pending results (${pendRes.status})`);
        }

        const stu = await stuRes.json().catch(() => []);
        const sub = await subRes.json().catch(() => []);
        const res = await resRes.json().catch(() => []);
        const pend = await pendRes.json().catch(() => []);

        setStudents(Array.isArray(stu) ? stu : []);
        setSubjects(Array.isArray(sub) ? sub : []);
        setResults(Array.isArray(res) ? res : []);
        setPendingResults(Array.isArray(pend) ? pend : []);
      } catch (e) {
        setFetchError(e.message || "Failed to load results data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================
     Helpers
  ========================= */
  const uniqueClasses = useMemo(() => {
    const list = students.map((s) => s.studentClass).filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  const studentsInClass = useMemo(() => {
    if (!form.classSelect) return [];
    return students.filter((s) => s.studentClass === form.classSelect);
  }, [students, form.classSelect]);

  const subjectOptions = useMemo(() => {
    // subjectCode preferred, fallback to name
    return subjects
      .map((s) => ({
        code: s.subjectCode || s.subjectName,
        name: s.subjectName || s.subjectCode,
      }))
      .filter((x) => x.code && x.name);
  }, [subjects]);

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const computeTotal = (f) => {
    return (
      toNum(f.firstCaScore) +
      toNum(f.secondCaScore) +
      toNum(f.assignmentScore) +
      toNum(f.examScore)
    );
  };

  const computeGrade = (total) => {
    const t = Number(total || 0);
    if (t >= 70) return "A";
    if (t >= 60) return "B";
    if (t >= 50) return "C";
    if (t >= 40) return "D";
    return "F";
  };

  const showInfo = (msg) => {
    setInfoMsg(msg);
    setInfoOpen(true);
  };

  const resetForm = () => {
    const p = getCurrentAcademicPeriod();
    setForm({
      ...initialForm,
      termSelect: p.term,
      sessionSelect: p.session,
    });
    setIsEditing(false);
    setEditId(null);
  };

  const validate = (f) => {
    if (!f.classSelect) return "Select class";
    if (!f.studentNameSelect) return "Select student";
    if (!f.subjectSelect) return "Select subject";
    if (!f.termSelect) return "Select term";
    if (!f.sessionSelect) return "Session is required";
    return null;
  };

  /* =========================
     Handlers
  ========================= */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const startEdit = (row) => {
    setIsEditing(true);
    setEditId(row._id);

    setForm({
      studentNameSelect: row.studentNameSelect || "",
      classSelect: row.classSelect || "",
      subjectSelect: row.subjectSelect || "",
      termSelect: row.termSelect || "",
      sessionSelect: row.sessionSelect || "",
      firstCaScore: row.firstCaScore ?? "",
      secondCaScore: row.secondCaScore ?? "",
      assignmentScore: row.assignmentScore ?? "",
      examScore: row.examScore ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) {
      setDeleteOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalResults/${deleteTarget._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Failed to delete result");
      }

      setResults((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      showInfo("Result deleted successfully.");
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  /* =========================
     Save result (direct to Results)
  ========================= */
  const saveToResults = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const err = validate(form);
    if (err) return alert(err);

    const totalScore = computeTotal(form);
    const grade = computeGrade(totalScore);

    const payload = {
      ...form,
      firstCaScore: toNum(form.firstCaScore),
      secondCaScore: toNum(form.secondCaScore),
      assignmentScore: toNum(form.assignmentScore),
      examScore: toNum(form.examScore),
      totalScore,
      grade,
      updatedBy: user?.username || user?.role || "user",
      updatedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await apiFetch(`/api/schoolPortalResults/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Failed to update result");
        }

        const updated = await res.json().catch(() => null);
        if (updated?._id) {
          setResults((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
        }
        showInfo("Result saved (updated) successfully.");
        resetForm();
      } else {
        const res = await apiFetch("/api/schoolPortalResults", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Failed to save result");
        }

        const created = await res.json().catch(() => null);
        if (created?._id) setResults((prev) => [created, ...prev]);

        showInfo("Result saved successfully.");
        resetForm();
      }
    } catch (e3) {
      alert(e3.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     Submit for Approval (to Pending Results)
  ========================= */
  const submitForApproval = async () => {
    if (submitting) return;

    const err = validate(form);
    if (err) return alert(err);

    const totalScore = computeTotal(form);
    const grade = computeGrade(totalScore);

    const payload = {
      ...form,
      firstCaScore: toNum(form.firstCaScore),
      secondCaScore: toNum(form.secondCaScore),
      assignmentScore: toNum(form.assignmentScore),
      examScore: toNum(form.examScore),
      totalScore,
      grade,
      status: "Pending",
      submittedBy: user?.username || user?.role || "user",
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/schoolPortalPendingResults", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const e2 = await res.json().catch(() => ({}));
        throw new Error(e2.message || "Failed to submit for approval");
      }

      const created = await res.json().catch(() => null);
      if (created?._id) setPendingResults((prev) => [created, ...prev]);

      showInfo("Submitted for approval successfully.");
      resetForm();
    } catch (e3) {
      alert(e3.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     Filter list
  ========================= */
  const filteredResults = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return results;

    return results.filter((r) => {
      return (
        String(r.studentNameSelect || "").toLowerCase().includes(t) ||
        String(r.classSelect || "").toLowerCase().includes(t) ||
        String(r.subjectSelect || "").toLowerCase().includes(t) ||
        String(r.termSelect || "").toLowerCase().includes(t) ||
        String(r.sessionSelect || "").toLowerCase().includes(t)
      );
    });
  }, [results, searchTerm]);

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="content-section">Loading results…</div>;

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
      <h1>Results Management</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "User"}</b>
      </p>

      {/* Info Modal */}
      <ConfirmModal
        isOpen={infoOpen}
        message={infoMsg}
        onConfirm={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
        isAlert={true}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        message={
          deleteTarget
            ? `Delete result for ${deleteTarget.studentNameSelect} (${deleteTarget.subjectSelect}, ${deleteTarget.termSelect})?`
            : "Delete this result?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isAlert={false}
      />

      {/* Form */}
      <div className="sub-section">
        <h2>{isEditing ? "Edit Result" : "Input Result"}</h2>

        <form onSubmit={saveToResults} style={{ display: "grid", gap: 10, maxWidth: 700 }}>
          <select id="classSelect" value={form.classSelect} onChange={handleChange}>
            <option value="">Select Class</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="studentNameSelect"
            value={form.studentNameSelect}
            onChange={handleChange}
            disabled={!form.classSelect}
          >
            <option value="">Select Student</option>
            {studentsInClass.map((s) => (
              <option key={s._id || s.admissionNo} value={s.admissionNo}>
                {s.firstName} {s.lastName} ({s.admissionNo})
              </option>
            ))}
          </select>

          <select id="subjectSelect" value={form.subjectSelect} onChange={handleChange}>
            <option value="">Select Subject</option>
            {subjectOptions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select id="termSelect" value={form.termSelect} onChange={handleChange} style={{ flex: 1 }}>
              <option value="">Select Term</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>

            <input
              id="sessionSelect"
              value={form.sessionSelect}
              onChange={handleChange}
              placeholder="Session e.g. 2025/2026"
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <input
              id="firstCaScore"
              type="number"
              value={form.firstCaScore}
              onChange={handleChange}
              placeholder="1st CA"
            />
            <input
              id="secondCaScore"
              type="number"
              value={form.secondCaScore}
              onChange={handleChange}
              placeholder="2nd CA"
            />
            <input
              id="assignmentScore"
              type="number"
              value={form.assignmentScore}
              onChange={handleChange}
              placeholder="Assignment"
            />
            <input
              id="examScore"
              type="number"
              value={form.examScore}
              onChange={handleChange}
              placeholder="Exam"
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Result" : "Save Result"}
            </button>

            <button
              type="button"
              onClick={submitForApproval}
              disabled={submitting}
              style={{ background: "#2563eb" }}
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>

            <button type="button" onClick={resetForm} disabled={submitting} style={{ background: "#6c757d" }}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Pending count */}
      <div className="sub-section">
        <h2>Pending Results</h2>
        <p style={{ color: "#555" }}>
          Pending submissions: <b>{pendingResults.length}</b>
        </p>
      </div>

      {/* Results table */}
      <div className="sub-section">
        <h2>Saved Results</h2>

        <div className="filter-controls" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search admission no, class, subject, term, session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 250 }}
          />
          <button type="button" onClick={() => setSearchTerm("")} style={{ background: "#6c757d" }}>
            Clear
          </button>
        </div>

        <div className="table-container" style={{ marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Admission No</th>
                <th style={th}>Class</th>
                <th style={th}>Subject</th>
                <th style={th}>Term</th>
                <th style={th}>Session</th>
                <th style={th}>Total</th>
                <th style={th}>Grade</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredResults.length ? (
                filteredResults.map((r) => (
                  <tr key={r._id}>
                    <td style={td}>{r.studentNameSelect}</td>
                    <td style={td}>{r.classSelect}</td>
                    <td style={td}>{r.subjectSelect}</td>
                    <td style={td}>{r.termSelect}</td>
                    <td style={td}>{r.sessionSelect}</td>
                    <td style={td}><b>{r.totalScore ?? 0}</b></td>
                    <td style={td}><b>{r.grade || "-"}</b></td>
                    <td style={td}>
                      <button onClick={() => startEdit(r)}>Edit</button>{" "}
                      <button onClick={() => askDelete(r)} style={{ background: "#dc2626" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={td} colSpan="8">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f2f2f2",
  textAlign: "left",
};

const td = {
  border: "1px solid #ddd",
  padding: 8,
};

export default ResultsManagement;
