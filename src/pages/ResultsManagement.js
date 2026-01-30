// src/pages/ResultsManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { getCurrentAcademicPeriod } from "../utils/academicPeriod";

const LS_RESULTS = "schoolPortalResults";
const LS_PENDING = "schoolPortalPendingResults";

const initialForm = {
  studentNameSelect: "", // admissionNo
  classSelect: "",
  subjectSelect: "",
  termSelect: "",
  sessionSelect: "",
  firstCaScore: "",
  secondCaScore: "",
  assignmentScore: "",
  examScore: "",
};

const norm = (v) => String(v ?? "").trim();
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const computeTotal = (f) =>
  toNum(f.firstCaScore) +
  toNum(f.secondCaScore) +
  toNum(f.assignmentScore) +
  toNum(f.examScore);

const computeGrade = (total) => {
  const t = Number(total || 0);
  if (t >= 70) return "A";
  if (t >= 60) return "B";
  if (t >= 50) return "C";
  if (t >= 40) return "D";
  return "F";
};

const makeLocalId = (payload) =>
  `${payload.studentAdmissionNo || payload.studentNameSelect || "NA"}|${
    payload.subjectSelect || "SUB"
  }|${payload.termSelect || "TERM"}|${payload.academicYear || payload.sessionSelect || "YEAR"}|${Date.now()}`;

const ensureId = (obj, fallbackId) => ({
  ...obj,
  _id: obj?._id || obj?.id || fallbackId,
});

function normalizeResult(r) {
  const admissionNo =
    r.studentAdmissionNo || r.studentNameSelect || r.admissionNo || "";
  const className = r.studentClass || r.classSelect || r.classLevel || "";
  const subject = r.subjectSelect || r.subject || r.subjectCode || "";
  const term = r.termSelect || r.term || "";
  const session = r.academicYear || r.sessionSelect || r.session || "";

  const firstCaScore = r.firstCaScore ?? 0;
  const secondCaScore = r.secondCaScore ?? 0;
  const assignmentScore = r.assignmentScore ?? 0;
  const examScore = r.examScore ?? 0;

  const totalScore =
    r.totalScore ??
    r.total ??
    (toNum(firstCaScore) +
      toNum(secondCaScore) +
      toNum(assignmentScore) +
      toNum(examScore));

  const grade = r.grade || computeGrade(totalScore);

  return {
    ...r,
    admissionNo,
    className,
    subject,
    term,
    session,
    firstCaScore,
    secondCaScore,
    assignmentScore,
    examScore,
    totalScore,
    grade,
    status: r.status || (r.approved ? "Approved" : ""),
  };
}

/* =========================
   LocalStorage helpers
========================= */
const readLS = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const mergeById = (localArr, serverArr) => {
  const map = new Map();
  (Array.isArray(localArr) ? localArr : []).forEach((x) => {
    const id = x?._id || x?.id;
    if (id) map.set(String(id), x);
  });
  (Array.isArray(serverArr) ? serverArr : []).forEach((x) => {
    const id = x?._id || x?.id;
    if (id) map.set(String(id), x); // server overrides local
  });
  return Array.from(map.values());
};

const th = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#f2f2f2",
  textAlign: "left",
};

const td = { border: "1px solid #ddd", padding: 8 };

export default function ResultsManagement() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // ✅ load cached first so refresh doesn’t wipe UI
  const [results, setResults] = useState(() =>
    readLS(LS_RESULTS).map(normalizeResult)
  );
  const [pendingResults, setPendingResults] = useState(() =>
    readLS(LS_PENDING).map(normalizeResult)
  );

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState(() => {
    const p = getCurrentAcademicPeriod();
    return { ...initialForm, termSelect: p.term, sessionSelect: p.session };
  });

  const [mode, setMode] = useState("single"); // single | batch

  // batch state
  const [batchClass, setBatchClass] = useState("");
  const [batchSubject, setBatchSubject] = useState("");
  const [batchTerm, setBatchTerm] = useState(
    () => getCurrentAcademicPeriod().term
  );
  const [batchSession, setBatchSession] = useState(
    () => getCurrentAcademicPeriod().session
  );
  const [batchRows, setBatchRows] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showInfo = (msg) => {
    setInfoMsg(msg);
    setInfoOpen(true);
  };

  /* ================= LOAD ================= */
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

        if (!stuRes.ok) throw new Error("Failed to fetch students");
        if (!subRes.ok) throw new Error("Failed to fetch subjects");

        const stu = (await stuRes.json().catch(() => [])) || [];
        const sub = (await subRes.json().catch(() => [])) || [];
        setStudents(Array.isArray(stu) ? stu : []);
        setSubjects(Array.isArray(sub) ? sub : []);

        // results may fail online; if they fail, keep cached data
        let serverApproved = [];
        let serverPending = [];

        if (resRes.ok) {
          const res = (await resRes.json().catch(() => [])) || [];
          serverApproved = Array.isArray(res) ? res : [];
        }
        if (pendRes.ok) {
          const pend = (await pendRes.json().catch(() => [])) || [];
          serverPending = Array.isArray(pend) ? pend : [];
        }

        // ✅ merge local + server and persist back to localStorage
        const localApproved = readLS(LS_RESULTS);
        const localPending = readLS(LS_PENDING);

        const mergedApproved = mergeById(localApproved, serverApproved);
        const mergedPending = mergeById(localPending, serverPending);

        writeLS(LS_RESULTS, mergedApproved);
        writeLS(LS_PENDING, mergedPending);

        setResults(mergedApproved.map(normalizeResult));
        setPendingResults(mergedPending.map(normalizeResult));
      } catch (e) {
        // keep local cache visible
        setFetchError(e.message || "Failed to load results data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const uniqueClasses = useMemo(() => {
    const list = students.map((s) => s.studentClass).filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  /* ✅ Teacher subject restriction */
  const allowedSubjectCodes = useMemo(() => {
    const arr = Array.isArray(user?.assignedSubjects) ? user.assignedSubjects : [];
    return new Set(arr.map((x) => String(x).trim()));
  }, [user]);

  const subjectOptions = useMemo(() => {
    const raw = subjects
      .map((s) => ({
        code: s.subjectCode || s.subjectName,
        name: s.subjectName || s.subjectCode,
      }))
      .filter((x) => x.code && x.name);

    if (allowedSubjectCodes.size > 0) {
      return raw.filter((x) => allowedSubjectCodes.has(String(x.code).trim()));
    }
    return raw;
  }, [subjects, allowedSubjectCodes]);

  const studentsInClass = useMemo(() => {
    if (!form.classSelect) return [];
    return students.filter((s) => s.studentClass === form.classSelect);
  }, [students, form.classSelect]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const resetForm = () => {
    const p = getCurrentAcademicPeriod();
    setForm({ ...initialForm, termSelect: p.term, sessionSelect: p.session });
    setIsEditing(false);
    setEditId(null);
  };

  const validateSingle = (f) => {
    if (!f.classSelect) return "Select class";
    if (!f.studentNameSelect) return "Select student";
    if (!f.subjectSelect) return "Select subject";
    if (!f.termSelect) return "Select term";
    if (!f.sessionSelect) return "Session is required";
    return null;
  };

  const startEdit = (row) => {
    const r = normalizeResult(row);
    setIsEditing(true);
    setEditId(row._id);

    setForm({
      studentNameSelect: r.admissionNo || "",
      classSelect: r.className || "",
      subjectSelect: r.subject || "",
      termSelect: r.term || "",
      sessionSelect: r.session || "",
      firstCaScore: r.firstCaScore ?? "",
      secondCaScore: r.secondCaScore ?? "",
      assignmentScore: r.assignmentScore ?? "",
      examScore: r.examScore ?? "",
    });

    setMode("single");
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

      // ✅ even if backend fails, still remove from local cache to prevent reappearing
      const next = results.filter((r) => r._id !== deleteTarget._id);
      setResults(next);
      writeLS(LS_RESULTS, next);

      if (!res.ok) throw new Error("Delete failed online (removed locally).");

      showInfo("Result deleted successfully.");
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  /* ✅ Save single to Approved + persist local */
  const saveToResults = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const err = validateSingle(form);
    if (err) return alert(err);

    const totalScore = computeTotal(form);
    const grade = computeGrade(totalScore);

    const payload = {
      ...form,

      // canonical
      studentAdmissionNo: form.studentNameSelect,
      studentClass: form.classSelect,
      academicYear: form.sessionSelect,

      firstCaScore: toNum(form.firstCaScore),
      secondCaScore: toNum(form.secondCaScore),
      assignmentScore: toNum(form.assignmentScore),
      examScore: toNum(form.examScore),
      totalScore,
      grade,

      status: "Approved",
      updatedBy: user?.staffId || user?.username || user?.role || "staff",
      updatedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        // optimistic update first
        const optimistic = normalizeResult(ensureId({ ...payload, _id: editId }, editId));
        setResults((prev) => {
          const next = prev.map((r) => (r._id === editId ? optimistic : r));
          writeLS(LS_RESULTS, next);
          return next;
        });

        const res = await apiFetch(`/api/schoolPortalResults/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json().catch(() => null);
          if (updated) {
            const fixed = normalizeResult(ensureId(updated, editId));
            setResults((prev) => {
              const next = prev.map((r) => (r._id === editId ? fixed : r));
              writeLS(LS_RESULTS, next);
              return next;
            });
          }
        }

        showInfo("Result updated successfully.");
        resetForm();
      } else {
        const localId = makeLocalId(payload);
        const optimistic = normalizeResult(ensureId(payload, localId));

        // ✅ show instantly + persist locally
        setResults((prev) => {
          const next = [optimistic, ...prev];
          writeLS(LS_RESULTS, next);
          return next;
        });

        // try online
        const res = await apiFetch("/api/schoolPortalResults", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json().catch(() => null);
          if (created) {
            const fixed = normalizeResult(ensureId(created, localId));
            setResults((prev) => {
              // replace optimistic localId with server id
              const next = prev.map((r) => (r._id === localId ? fixed : r));
              writeLS(LS_RESULTS, next);
              return next;
            });
          }
        }

        showInfo("Result saved successfully.");
        resetForm();
      }
    } catch (e2) {
      alert(e2.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ✅ Submit single to Pending + persist local */
  const submitForApproval = async () => {
    if (submitting) return;

    const err = validateSingle(form);
    if (err) return alert(err);

    const totalScore = computeTotal(form);
    const grade = computeGrade(totalScore);

    const payload = {
      ...form,

      studentAdmissionNo: form.studentNameSelect,
      studentClass: form.classSelect,
      academicYear: form.sessionSelect,

      firstCaScore: toNum(form.firstCaScore),
      secondCaScore: toNum(form.secondCaScore),
      assignmentScore: toNum(form.assignmentScore),
      examScore: toNum(form.examScore),
      totalScore,
      grade,

      status: "Pending",
      submittedBy: user?.staffId || user?.username || user?.role || "staff",
      submittedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      const localId = makeLocalId(payload);
      const optimistic = normalizeResult(ensureId(payload, localId));

      setPendingResults((prev) => {
        const next = [optimistic, ...prev];
        writeLS(LS_PENDING, next);
        return next;
      });

      const res = await apiFetch("/api/schoolPortalPendingResults", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json().catch(() => null);
        if (created) {
          const fixed = normalizeResult(ensureId(created, localId));
          setPendingResults((prev) => {
            const next = prev.map((r) => (r._id === localId ? fixed : r));
            writeLS(LS_PENDING, next);
            return next;
          });
        }
      }

      showInfo("Submitted for approval successfully.");
      resetForm();
    } catch (e2) {
      alert(e2.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
      ✅ BATCH ENTRY
  ========================= */
  const batchStudents = useMemo(() => {
    if (!batchClass) return [];
    return students.filter((s) => s.studentClass === batchClass);
  }, [students, batchClass]);

  useEffect(() => {
    const rows = batchStudents.map((s) => ({
      admissionNo: s.admissionNo,
      fullName: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      firstCaScore: "",
      secondCaScore: "",
      assignmentScore: "",
      examScore: "",
    }));
    setBatchRows(rows);
  }, [batchStudents]);

  const updateBatchScore = (index, field, value) => {
    setBatchRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateBatchHeader = () => {
    if (!batchClass) return "Select class";
    if (!batchSubject) return "Select subject";
    if (!batchTerm) return "Select term";
    if (!batchSession) return "Session is required";
    return null;
  };

  const buildBatchPayload = (row, status) => {
    const totalScore =
      toNum(row.firstCaScore) +
      toNum(row.secondCaScore) +
      toNum(row.assignmentScore) +
      toNum(row.examScore);

    const grade = computeGrade(totalScore);

    return {
      // keep your old keys too
      studentNameSelect: row.admissionNo,
      classSelect: batchClass,
      subjectSelect: batchSubject,
      termSelect: batchTerm,
      sessionSelect: batchSession,

      // canonical
      studentAdmissionNo: row.admissionNo,
      studentClass: batchClass,
      academicYear: batchSession,

      firstCaScore: toNum(row.firstCaScore),
      secondCaScore: toNum(row.secondCaScore),
      assignmentScore: toNum(row.assignmentScore),
      examScore: toNum(row.examScore),
      totalScore,
      grade,

      status,
      submittedBy: user?.staffId || user?.username || user?.role || "staff",
      submittedAt: new Date().toISOString(),
    };
  };

  const submitBatch = async (status) => {
    const err = validateBatchHeader();
    if (err) return alert(err);

    const hasAny = batchRows.some((r) =>
      [r.firstCaScore, r.secondCaScore, r.assignmentScore, r.examScore].some(
        (x) => norm(x) !== ""
      )
    );
    if (!hasAny) return alert("Enter scores for at least one student.");

    setBatchSubmitting(true);
    try {
      const endpoint =
        status === "Approved"
          ? "/api/schoolPortalResults"
          : "/api/schoolPortalPendingResults";

      const localKey = status === "Approved" ? LS_RESULTS : LS_PENDING;
      const setState = status === "Approved" ? setResults : setPendingResults;

      // Optimistically add to UI + localStorage first
      const optimisticRows = batchRows
        .filter((r) =>
          [r.firstCaScore, r.secondCaScore, r.assignmentScore, r.examScore].some(
            (x) => norm(x) !== ""
          )
        )
        .map((r) => {
          const payload = buildBatchPayload(r, status);
          const lid = makeLocalId(payload);
          return normalizeResult(ensureId(payload, lid));
        });

      setState((prev) => {
        const next = [...optimisticRows, ...prev];
        writeLS(localKey, next);
        return next;
      });

      // Send one-by-one (safe for your backend)
      for (const r of batchRows) {
        const hasScore = [r.firstCaScore, r.secondCaScore, r.assignmentScore, r.examScore].some(
          (x) => norm(x) !== ""
        );
        if (!hasScore) continue;

        const payload = buildBatchPayload(r, status);
        const res = await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // if server returns an object, we can later enhance to replace local ids.
        if (!res.ok) {
          throw new Error("Batch save failed for " + r.admissionNo);
        }
      }

      showInfo(
        status === "Approved"
          ? "Batch results saved successfully."
          : "Batch results submitted for approval."
      );
    } catch (e) {
      alert(e.message || "Batch submit failed");
    } finally {
      setBatchSubmitting(false);
    }
  };

  const filteredResults = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return results;

    return results.filter((r0) => {
      const r = normalizeResult(r0);
      return (
        norm(r.admissionNo).toLowerCase().includes(t) ||
        norm(r.className).toLowerCase().includes(t) ||
        norm(r.subject).toLowerCase().includes(t) ||
        norm(r.term).toLowerCase().includes(t) ||
        norm(r.session).toLowerCase().includes(t)
      );
    });
  }, [results, searchTerm]);

  if (loading) return <div className="content-section">Loading results…</div>;

  return (
    <div className="content-section">
      <h1>Results Management</h1>
      {fetchError && (
        <div style={{ padding: 10, background: "#fff7e6", border: "1px solid #ffe2a8", borderRadius: 8 }}>
          <b>Online fetch issue:</b> {fetchError} <br />
          (Your cached results will still show ✅)
        </div>
      )}

      <ConfirmModal
        isOpen={infoOpen}
        message={infoMsg}
        onConfirm={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
        isAlert={true}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        message={
          deleteTarget
            ? `Delete result for ${deleteTarget.studentNameSelect || deleteTarget.studentAdmissionNo}?`
            : "Delete this result?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isAlert={false}
      />

      {/* MODE TOGGLE */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => setMode("single")} style={mode === "single" ? { background: "#111", color: "#fff" } : {}}>
          Single Entry
        </button>
        <button onClick={() => setMode("batch")} style={mode === "batch" ? { background: "#111", color: "#fff" } : {}}>
          Batch Entry
        </button>
      </div>

      {/* ================= SINGLE ENTRY ================= */}
      {mode === "single" && (
        <div className="sub-section">
          <h2>{isEditing ? "Edit Result" : "Input Result"}</h2>

          <form onSubmit={saveToResults} style={{ display: "grid", gap: 10, maxWidth: 700 }}>
            <select id="classSelect" value={form.classSelect} onChange={handleChange}>
              <option value="">Select Class</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
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
                <option key={s.code} value={s.code}>{s.name}</option>
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
              <input id="firstCaScore" type="number" value={form.firstCaScore} onChange={handleChange} placeholder="1st CA" />
              <input id="secondCaScore" type="number" value={form.secondCaScore} onChange={handleChange} placeholder="2nd CA" />
              <input id="assignmentScore" type="number" value={form.assignmentScore} onChange={handleChange} placeholder="Assignment" />
              <input id="examScore" type="number" value={form.examScore} onChange={handleChange} placeholder="Exam" />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update Result" : "Save Result"}
              </button>

              <button type="button" onClick={submitForApproval} disabled={submitting} style={{ background: "#2563eb" }}>
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>

              <button type="button" onClick={resetForm} disabled={submitting} style={{ background: "#6c757d" }}>
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= BATCH ENTRY ================= */}
      {mode === "batch" && (
        <div className="sub-section">
          <h2>Batch Entry</h2>

          <div style={{ display: "grid", gap: 10, maxWidth: 900 }}>
            <select value={batchClass} onChange={(e) => setBatchClass(e.target.value)}>
              <option value="">Select Class</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={batchSubject} onChange={(e) => setBatchSubject(e.target.value)} disabled={!batchClass}>
              <option value="">Select Subject (restricted to teacher)</option>
              {subjectOptions.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={batchTerm} onChange={(e) => setBatchTerm(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select Term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>

              <input
                value={batchSession}
                onChange={(e) => setBatchSession(e.target.value)}
                placeholder="Session e.g. 2025/2026"
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ color: "#555" }}>
              Students in class: <b>{batchRows.length}</b>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Admission No</th>
                    <th style={th}>Student Name</th>
                    <th style={th}>CA1</th>
                    <th style={th}>CA2</th>
                    <th style={th}>Assg</th>
                    <th style={th}>Exam</th>
                    <th style={th}>Total</th>
                    <th style={th}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((r, idx) => {
                    const total =
                      toNum(r.firstCaScore) +
                      toNum(r.secondCaScore) +
                      toNum(r.assignmentScore) +
                      toNum(r.examScore);
                    const grade = total ? computeGrade(total) : "-";

                    return (
                      <tr key={r.admissionNo || idx}>
                        <td style={td}>{idx + 1}</td>
                        <td style={td}><b>{r.admissionNo}</b></td>
                        <td style={td}>{r.fullName}</td>
                        <td style={td}>
                          <input type="number" value={r.firstCaScore}
                            onChange={(e) => updateBatchScore(idx, "firstCaScore", e.target.value)}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td style={td}>
                          <input type="number" value={r.secondCaScore}
                            onChange={(e) => updateBatchScore(idx, "secondCaScore", e.target.value)}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td style={td}>
                          <input type="number" value={r.assignmentScore}
                            onChange={(e) => updateBatchScore(idx, "assignmentScore", e.target.value)}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td style={td}>
                          <input type="number" value={r.examScore}
                            onChange={(e) => updateBatchScore(idx, "examScore", e.target.value)}
                            style={{ width: 70 }}
                          />
                        </td>
                        <td style={td}><b>{total || 0}</b></td>
                        <td style={td}><b>{grade}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => submitBatch("Pending")}
                disabled={batchSubmitting}
                style={{ background: "#2563eb" }}
              >
                {batchSubmitting ? "Submitting..." : "Submit Batch for Approval"}
              </button>

              <button onClick={() => submitBatch("Approved")} disabled={batchSubmitting}>
                {batchSubmitting ? "Saving..." : "Save Batch as Approved"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PENDING + SAVED ================= */}
      <div className="sub-section">
        <h2>Saved Results</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

        <div style={{ overflowX: "auto", marginTop: 10 }}>
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
                filteredResults.map((r0) => {
                  const r = normalizeResult(r0);
                  return (
                    <tr key={r._id}>
                      <td style={td}>{r.admissionNo || "-"}</td>
                      <td style={td}>{r.className || "-"}</td>
                      <td style={td}>{r.subject || "-"}</td>
                      <td style={td}>{r.term || "-"}</td>
                      <td style={td}>{r.session || "-"}</td>
                      <td style={td}><b>{r.totalScore ?? 0}</b></td>
                      <td style={td}><b>{r.grade || "-"}</b></td>
                      <td style={td}>
                        <button onClick={() => startEdit(r0)}>Edit</button>{" "}
                        <button onClick={() => askDelete(r0)} style={{ background: "#dc2626" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td style={td} colSpan="8">No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
