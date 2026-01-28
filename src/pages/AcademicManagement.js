// src/pages/AcademicManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const initialSubject = {
  subjectName: "",
  subjectCode: "",
  classLevel: "", // optional (e.g. JSS1, SS2)
  status: "Active",
};

function AcademicManagement() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(initialSubject);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // modals
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================
     Load subjects
  ========================= */
  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const res = await apiFetch("/api/schoolPortalSubjects");
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || `Failed to fetch subjects (${res.status})`);
        }
        const data = await res.json().catch(() => []);
        setSubjects(Array.isArray(data) ? data : []);
      } catch (e) {
        setFetchError(e.message || "Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  /* =========================
     Helpers
  ========================= */
  const showInfo = (msg) => {
    setInfoMsg(msg);
    setInfoOpen(true);
  };

  const resetForm = () => {
    setForm(initialSubject);
    setIsEditing(false);
    setEditId(null);
    setFormErrors({});
  };

  const validate = (data) => {
    const errors = {};
    if (!data.subjectName.trim()) errors.subjectName = "Subject name is required";
    if (!data.subjectCode.trim()) errors.subjectCode = "Subject code is required";
    return errors;
  };

  /* =========================
     Actions
  ========================= */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const startEdit = (subj) => {
    setIsEditing(true);
    setEditId(subj._id);

    setForm({
      subjectName: subj.subjectName || "",
      subjectCode: subj.subjectCode || "",
      classLevel: subj.classLevel || "",
      status: subj.status || "Active",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askDelete = (subj) => {
    setDeleteTarget(subj);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) {
      setDeleteOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalSubjects/${deleteTarget._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Failed to delete subject");
      }

      setSubjects((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      showInfo("Subject deleted successfully.");
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const payload = {
      subjectName: form.subjectName.trim(),
      subjectCode: form.subjectCode.trim(),
      classLevel: form.classLevel?.trim() || "",
      status: form.status || "Active",
      updatedBy: user?.username || user?.role || "user",
      updatedAt: new Date().toISOString(),
    };

    const errors = validate(payload);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await apiFetch(`/api/schoolPortalSubjects/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Failed to update subject");
        }

        const updated = await res.json().catch(() => null);
        if (updated?._id) {
          setSubjects((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
        }

        showInfo("Subject updated successfully.");
        resetForm();
      } else {
        const res = await apiFetch("/api/schoolPortalSubjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Failed to create subject (maybe duplicate code?)");
        }

        const created = await res.json().catch(() => null);
        if (created?._id) setSubjects((prev) => [created, ...prev]);

        showInfo("Subject created successfully.");
        resetForm();
      }
    } catch (e3) {
      alert(e3.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return subjects;

    return subjects.filter((s) => {
      const name = String(s.subjectName || "").toLowerCase();
      const code = String(s.subjectCode || "").toLowerCase();
      const lvl = String(s.classLevel || "").toLowerCase();
      return name.includes(t) || code.includes(t) || lvl.includes(t);
    });
  }, [subjects, searchTerm]);

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="content-section">Loading subjects…</div>;

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
      <h1>Academic Management</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "User"}</b>
      </p>

      {/* Modals */}
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
            ? `Delete subject: ${deleteTarget.subjectName} (${deleteTarget.subjectCode})?`
            : "Delete subject?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isAlert={false}
      />

      {/* Form */}
      <div className="sub-section">
        <h2>{isEditing ? "Edit Subject" : "Add Subject"}</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 700 }}>
          <input
            id="subjectName"
            value={form.subjectName}
            onChange={handleChange}
            placeholder="Subject Name (e.g. Mathematics)"
          />
          {formErrors.subjectName && <p className="error-text">{formErrors.subjectName}</p>}

          <input
            id="subjectCode"
            value={form.subjectCode}
            onChange={handleChange}
            placeholder="Subject Code (e.g. MTH101)"
            readOnly={isEditing} // prevent changing codes during edit
          />
          {formErrors.subjectCode && <p className="error-text">{formErrors.subjectCode}</p>}
          {isEditing && (
            <small style={{ color: "#666" }}>
              Subject code is locked during editing to avoid duplicates.
            </small>
          )}

          <input
            id="classLevel"
            value={form.classLevel}
            onChange={handleChange}
            placeholder="Class Level (optional e.g. JSS1, SS2)"
          />

          <select id="status" value={form.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Subject" : "Add Subject"}
            </button>
            <button type="button" onClick={resetForm} disabled={submitting} style={{ background: "#6c757d" }}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="sub-section">
        <h2>Subjects</h2>

        <div className="filter-controls" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by subject name, code, class level..."
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
                <th style={th}>Name</th>
                <th style={th}>Code</th>
                <th style={th}>Class Level</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubjects.length ? (
                filteredSubjects.map((s) => (
                  <tr key={s._id}>
                    <td style={td}>{s.subjectName}</td>
                    <td style={td}><b>{s.subjectCode}</b></td>
                    <td style={td}>{s.classLevel || "-"}</td>
                    <td style={td}>{s.status || "Active"}</td>
                    <td style={td}>
                      <button onClick={() => startEdit(s)}>Edit</button>{" "}
                      <button onClick={() => askDelete(s)} style={{ background: "#dc2626" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={td} colSpan="5">
                    No subjects found.
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

export default AcademicManagement;
