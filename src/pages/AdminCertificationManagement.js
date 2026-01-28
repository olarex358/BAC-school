// src/pages/AdminCertificationManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";

const API_PATH = "/api/schoolPortalCertifications"; // backend-try (may not exist yet)
const LOCAL_KEY = "schoolPortalCertifications";     // safe fallback storage

const initialCert = {
  title: "",
  studentAdmissionNo: "",
  studentName: "",
  className: "",
  type: "Certificate", // Certificate | Award | Testimonial
  description: "",
  issuedDate: "",
  status: "Issued", // Issued | Pending | Revoked
  fileUrl: "", // optional link to PDF/image
};

function AdminCertificationManagement() {
  const { user } = useAuth();

  // students list (for dropdown + auto fill)
  const [studentsLocal] = useLocalStorage("schoolPortalStudents", []);

  // local fallback store
  const [localCerts, setLocalCerts] = useLocalStorage(LOCAL_KEY, []);

  // active data store (api or local)
  const [mode, setMode] = useState("loading"); // loading | api | local
  const [certs, setCerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initialCert);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  // modals
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showInfo = (msg) => {
    setInfoMsg(msg);
    setInfoOpen(true);
  };

  const reset = () => {
    setForm(initialCert);
    setEditingId(null);
  };

  // build student dropdown
  const studentOptions = useMemo(() => {
    const arr = Array.isArray(studentsLocal) ? studentsLocal : [];
    return arr
      .map((s) => ({
        admissionNo: s.admissionNo,
        name:
          s.fullName ||
          `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
          s.name ||
          s.admissionNo,
        className: s.studentClass || s.className || s.class || "",
      }))
      .filter((s) => s.admissionNo);
  }, [studentsLocal]);

  /* =========================
     Load certifications (API try, else local fallback)
  ========================= */
  useEffect(() => {
    const load = async () => {
      setMode("loading");
      setLoading(true);
      setErr(null);

      try {
        const res = await apiFetch(API_PATH);

        // If backend doesn't support the entity, fallback to local safely
        if (!res.ok) {
          setCerts(localCerts);
          setMode("local");
          setLoading(false);
          return;
        }

        const data = await res.json().catch(() => []);
        setCerts(Array.isArray(data) ? data : []);
        setMode("api");
      } catch {
        setCerts(localCerts);
        setMode("local");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep in sync when in local mode
  useEffect(() => {
    if (mode === "local") setCerts(localCerts);
  }, [localCerts, mode]);

  /* =========================
     Filtering
  ========================= */
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return certs;

    return certs.filter((c) => {
      const blob = [
        c.title,
        c.studentAdmissionNo,
        c.studentName,
        c.className,
        c.type,
        c.status,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return blob.includes(t);
    });
  }, [certs, search]);

  /* =========================
     Form handlers
  ========================= */
  const onChange = (e) => {
    const { id, value } = e.target;

    // If selecting student admissionNo, auto-fill studentName/className
    if (id === "studentAdmissionNo") {
      const match = studentOptions.find((s) => s.admissionNo === value);
      setForm((p) => ({
        ...p,
        studentAdmissionNo: value,
        studentName: match?.name || "",
        className: match?.className || "",
      }));
      return;
    }

    setForm((p) => ({ ...p, [id]: value }));
  };

  const startEdit = (c) => {
    setEditingId(c._id || c.id);
    setForm({
      title: c.title || "",
      studentAdmissionNo: c.studentAdmissionNo || "",
      studentName: c.studentName || "",
      className: c.className || "",
      type: c.type || "Certificate",
      description: c.description || "",
      issuedDate: c.issuedDate ? String(c.issuedDate).slice(0, 10) : "",
      status: c.status || "Issued",
      fileUrl: c.fileUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askDelete = (c) => {
    setDeleteTarget(c);
    setDeleteOpen(true);
  };

  /* =========================
     Save (API or Local)
  ========================= */
  const save = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.title.trim()) return alert("Title is required");
    if (!form.studentAdmissionNo.trim()) return alert("Select a student");
    if (!form.issuedDate) return alert("Issued date is required");

    const payload = {
      ...form,
      title: form.title.trim(),
      studentAdmissionNo: form.studentAdmissionNo.trim(),
      studentName: form.studentName.trim(),
      className: form.className.trim(),
      description: form.description.trim(),
      fileUrl: form.fileUrl.trim(),
      updatedBy: user?.username || "admin",
      updatedAt: new Date().toISOString(),
    };

    setSubmitting(true);

    try {
      if (mode === "api") {
        if (editingId) {
          const res = await apiFetch(`${API_PATH}/${editingId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const e2 = await res.json().catch(() => ({}));
            throw new Error(e2.message || "Update failed");
          }
          const updated = await res.json().catch(() => null);
          setCerts((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
          showInfo("Certification updated (backend).");
        } else {
          const res = await apiFetch(API_PATH, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const e2 = await res.json().catch(() => ({}));
            throw new Error(e2.message || "Create failed");
          }
          const created = await res.json().catch(() => null);
          if (created?._id) setCerts((prev) => [created, ...prev]);
          showInfo("Certification created (backend).");
        }
      } else {
        // LOCAL fallback
        const localPayload = {
          ...payload,
          id: editingId || Date.now(),
        };

        setLocalCerts((prev) => {
          const exists = prev.some((x) => x.id === localPayload.id);
          return exists
            ? prev.map((x) => (x.id === localPayload.id ? localPayload : x))
            : [localPayload, ...prev];
        });

        showInfo(editingId ? "Certification updated (local)." : "Certification created (local).");
      }

      reset();
    } catch (e3) {
      setErr(e3.message || "Save failed");
      alert(e3.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     Delete (API or Local)
  ========================= */
  const confirmDelete = async () => {
    if (!deleteTarget) {
      setDeleteOpen(false);
      return;
    }

    const id = deleteTarget._id || deleteTarget.id;
    setSubmitting(true);

    try {
      if (mode === "api") {
        const res = await apiFetch(`${API_PATH}/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || "Delete failed");
        }
        setCerts((prev) => prev.filter((x) => x._id !== id));
        showInfo("Certification deleted (backend).");
      } else {
        setLocalCerts((prev) => prev.filter((x) => x.id !== id));
        showInfo("Certification deleted (local).");
      }
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="content-section">Loading certifications…</div>;

  return (
    <div className="content-section">
      <h1>Admin Certification Management</h1>
      <p style={{ color: "#666" }}>
        Storage mode: <b>{mode === "api" ? "Backend" : "Local (fallback)"}</b>
      </p>

      {err && (
        <div style={{ color: "#b00020", marginBottom: 10 }}>
          <b>Error:</b> {err}
        </div>
      )}

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
            ? `Delete "${deleteTarget.title}" for ${deleteTarget.studentName || deleteTarget.studentAdmissionNo}?`
            : "Delete this certification?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isAlert={false}
      />

      {/* Form */}
      <div className="sub-section">
        <h2>{editingId ? "Edit Certification" : "Add Certification"}</h2>

        <form onSubmit={save} style={{ display: "grid", gap: 10, maxWidth: 900 }}>
          <input id="title" value={form.title} onChange={onChange} placeholder="Title (e.g. Best Student Award)" />

          <select id="studentAdmissionNo" value={form.studentAdmissionNo} onChange={onChange}>
            <option value="">Select Student (Admission No)</option>
            {studentOptions.map((s) => (
              <option key={s.admissionNo} value={s.admissionNo}>
                {s.name} ({s.admissionNo}) — {s.className}
              </option>
            ))}
          </select>

          <input id="studentName" value={form.studentName} onChange={onChange} placeholder="Student Name" />
          <input id="className" value={form.className} onChange={onChange} placeholder="Class" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select id="type" value={form.type} onChange={onChange} style={{ flex: 1 }}>
              <option value="Certificate">Certificate</option>
              <option value="Award">Award</option>
              <option value="Testimonial">Testimonial</option>
            </select>

            <select id="status" value={form.status} onChange={onChange} style={{ flex: 1 }}>
              <option value="Issued">Issued</option>
              <option value="Pending">Pending</option>
              <option value="Revoked">Revoked</option>
            </select>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "#666" }}>Issued Date</label>
              <input id="issuedDate" type="date" value={form.issuedDate} onChange={onChange} />
            </div>
          </div>

          <textarea
            id="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            placeholder="Description (optional)"
          />

          <input id="fileUrl" value={form.fileUrl} onChange={onChange} placeholder="File URL (optional)" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            <button type="button" onClick={reset} style={{ background: "#6c757d" }} disabled={submitting}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="sub-section">
        <h2>Certifications</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title / student / class / type / status..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Student</th>
                <th style={th}>Class</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={th}>Issued</th>
                <th style={th}>File</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length ? (
                filtered.map((c) => (
                  <tr key={c._id || c.id}>
                    <td style={td}><b>{c.title}</b><br /><small>{c.description || ""}</small></td>
                    <td style={td}>{c.studentName || "-"}<br /><small>{c.studentAdmissionNo || ""}</small></td>
                    <td style={td}>{c.className || "-"}</td>
                    <td style={td}>{c.type || "-"}</td>
                    <td style={td}>{c.status || "-"}</td>
                    <td style={td}>{c.issuedDate ? String(c.issuedDate).slice(0, 10) : "-"}</td>
                    <td style={td}>
                      {c.fileUrl ? (
                        <a href={c.fileUrl} target="_blank" rel="noreferrer">Open</a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={td}>
                      <button onClick={() => startEdit(c)}>Edit</button>{" "}
                      <button onClick={() => askDelete(c)} style={{ background: "#dc2626" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={td} colSpan="8">No certifications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = { border: "1px solid #ddd", padding: 8, background: "#f2f2f2", textAlign: "left" };
const td = { border: "1px solid #ddd", padding: 8 };

export default AdminCertificationManagement;
