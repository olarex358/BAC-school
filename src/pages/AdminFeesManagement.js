// src/pages/AdminFeesManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";
import { getCurrentAcademicPeriod } from "../utils/academicPeriod";
import ConfirmModal from "../components/ConfirmModal";

const initialFee = {
  className: "",
  feeName: "School Fees",
  amount: "",
  session: "",
  term: "",
  dueDate: "",
  note: "",
  status: "Active",
};

function AdminFeesManagement() {
  const { user } = useAuth();

  // Optional: pull classes from students list (nice UX)
  const [students] = useLocalStorage("schoolPortalStudents", []);

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState(() => {
    const p = getCurrentAcademicPeriod();
    return {
      ...initialFee,
      session: p.session,
      term: p.term,
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // info modal
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const uniqueClasses = useMemo(() => {
    const list = (students || [])
      .map((s) => s.studentClass || s.class || s.className)
      .filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  /* =========================
     Load fees from backend
  ========================= */
  useEffect(() => {
    const loadFees = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const res = await apiFetch("/api/schoolPortalFeeRecords");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Failed to fetch fees (Status ${res.status})`);
        }
        const data = await res.json().catch(() => []);
        setFees(Array.isArray(data) ? data : []);
      } catch (e) {
        setFetchError(e.message || "Failed to load fees");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, []);

  /* =========================
     Helpers
  ========================= */
  const validate = (data) => {
    const errors = {};
    if (!data.className.trim()) errors.className = "Class is required";
    if (!data.feeName.trim()) errors.feeName = "Fee name is required";
    if (!data.amount || Number(data.amount) <= 0) errors.amount = "Amount must be greater than 0";
    if (!data.session.trim()) errors.session = "Session is required";
    if (!data.term.trim()) errors.term = "Term is required";
    return errors;
  };

  const resetForm = () => {
    const p = getCurrentAcademicPeriod();
    setForm({
      ...initialFee,
      session: p.session,
      term: p.term,
    });
    setIsEditing(false);
    setEditId(null);
    setFormErrors({});
  };

  const showInfo = (msg) => {
    setInfoMsg(msg);
    setInfoOpen(true);
  };

  const startEdit = (fee) => {
    setIsEditing(true);
    setEditId(fee._id);
    setForm({
      className: fee.className || fee.class || "",
      feeName: fee.feeName || fee.name || "School Fees",
      amount: fee.amount ?? "",
      session: fee.session || "",
      term: fee.term || "",
      dueDate: fee.dueDate || "",
      note: fee.note || "",
      status: fee.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askDelete = (fee) => {
    setDeleteTarget(fee);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) {
      setDeleteOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalFeeRecords/${deleteTarget._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete fee");
      }

      setFees((prev) => prev.filter((f) => f._id !== deleteTarget._id));
      showInfo("Fee record deleted successfully.");
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const payload = {
      className: form.className.trim(),
      feeName: form.feeName.trim(),
      amount: Number(form.amount),
      session: form.session.trim(),
      term: form.term.trim(),
      dueDate: form.dueDate || "",
      note: form.note || "",
      status: form.status || "Active",
    };

    const errors = validate(payload);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await apiFetch(`/api/schoolPortalFeeRecords/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to update fee");
        }

        const updated = await res.json().catch(() => null);
        if (updated?._id) {
          setFees((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
        } else {
          // fallback refresh
          const r = await apiFetch("/api/schoolPortalFeeRecords");
          const list = await r.json().catch(() => []);
          setFees(Array.isArray(list) ? list : []);
        }

        showInfo("Fee record updated successfully.");
        resetForm();
      } else {
        const res = await apiFetch("/api/schoolPortalFeeRecords", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to create fee");
        }

        const created = await res.json().catch(() => null);
        if (created?._id) setFees((prev) => [created, ...prev]);

        showInfo("Fee record created successfully.");
        resetForm();
      }
    } catch (e2) {
      alert(e2.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFees = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return fees;

    return fees.filter((f) => {
      const cls = String(f.className || f.class || "").toLowerCase();
      const name = String(f.feeName || f.name || "").toLowerCase();
      const sess = String(f.session || "").toLowerCase();
      const term = String(f.term || "").toLowerCase();
      return cls.includes(t) || name.includes(t) || sess.includes(t) || term.includes(t);
    });
  }, [fees, searchTerm]);

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="content-section">Loading fee records…</div>;

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
        Error fetching data: {fetchError}
      </div>
    );
  }

  return (
    <div className="content-section">
      <h1>Admin Fees Management</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || "Admin"}</b>
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
            ? `Delete fee record for ${deleteTarget.className || deleteTarget.class || "class"} (${deleteTarget.feeName || "Fee"})?`
            : "Delete this fee record?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isAlert={false}
      />

      {/* FORM */}
      <div className="sub-section">
        <h2>{isEditing ? "Edit Fee" : "Create Fee"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="className">Class</label>
            <input
              id="className"
              value={form.className}
              onChange={handleChange}
              placeholder="e.g. JSS1 A"
              list="classList"
            />
            <datalist id="classList">
              {uniqueClasses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {formErrors.className && <p className="error-text">{formErrors.className}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="feeName">Fee Name</label>
            <input id="feeName" value={form.feeName} onChange={handleChange} />
            {formErrors.feeName && <p className="error-text">{formErrors.feeName}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="e.g. 25000"
            />
            {formErrors.amount && <p className="error-text">{formErrors.amount}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="session">Session</label>
            <input id="session" value={form.session} onChange={handleChange} placeholder="2025/2026" />
            {formErrors.session && <p className="error-text">{formErrors.session}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="term">Term</label>
            <select id="term" value={form.term} onChange={handleChange}>
              <option value="">Select Term</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
            {formErrors.term && <p className="error-text">{formErrors.term}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date (optional)</label>
            <input id="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="note">Note (optional)</label>
            <input id="note" value={form.note} onChange={handleChange} placeholder="Any note…" />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Fee" : "Create Fee"}
            </button>
            <button type="button" onClick={resetForm} disabled={submitting}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="sub-section">
        <h2>Fee Records</h2>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search by class, fee name, session, term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" onClick={() => setSearchTerm("")}>
            Clear Search
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Session</th>
                <th>Term</th>
                <th>Status</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredFees.length ? (
                filteredFees.map((f) => (
                  <tr key={f._id}>
                    <td>{f.className || f.class}</td>
                    <td>{f.feeName || f.name}</td>
                    <td>{Number(f.amount || 0).toLocaleString()}</td>
                    <td>{f.session}</td>
                    <td>{f.term}</td>
                    <td>{f.status || "Active"}</td>
                    <td>{f.dueDate ? String(f.dueDate).slice(0, 10) : "-"}</td>
                    <td className="action-buttons">
                      <button type="button" onClick={() => startEdit(f)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => askDelete(f)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No fee records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminFeesManagement;
