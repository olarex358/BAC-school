// src/pages/StaffManagement.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const initialStaffState = {
  surname: "",
  firstname: "",
  staffId: "",
  role: "",
  type: "staff", // helps backend consistency if needed
  gender: "",
  dateOfEmployment: "",
  department: "",
  qualifications: "",
  contactEmail: "",
  contactPhone: "",
  resumeDocument: "",

  assignedSubjects: [],
  assignedClasses: [],

  // Used only when creating new staff
  password: "",
};

function StaffManagement() {
  const navigate = useNavigate();
  const { user } = useAuth(); // auth handled by ProtectedRoute; this is just for display

  // Data lists
  const [staffs, setStaffs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [form, setForm] = useState(initialStaffState);
  const [isEditing, setIsEditing] = useState(false);
  const [editMongoId, setEditMongoId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  /* =========================
     Helpers
  ========================= */
  const uniqueSubjects = useMemo(() => {
    const list = (subjects || [])
      .map((s) => s.subjectName || s.name || s.subjectCode)
      .filter(Boolean);
    return [...new Set(list)].sort();
  }, [subjects]);

  const uniqueClasses = useMemo(() => {
    const list = (students || [])
      .map((s) => s.studentClass || s.class || s.className)
      .filter(Boolean);
    return [...new Set(list)].sort();
  }, [students]);

  const generateStaffId = () => {
    const year = new Date().getFullYear();
    // Try to find last counter from existing staffId format: BAC/STF/2026/0001
    const counters = staffs
      .map((s) => String(s.staffId || ""))
      .map((id) => {
        const parts = id.split("/");
        const last = parts[parts.length - 1];
        const n = parseInt(last, 10);
        return Number.isFinite(n) ? n : 0;
      });
    const next = (counters.length ? Math.max(...counters) : 0) + 1;
    return `BAC/STF/${year}/${String(next).padStart(4, "0")}`;
  };

  const validate = (data) => {
    const errors = {};

    if (!data.surname.trim()) errors.surname = "Surname is required";
    if (!data.firstname.trim()) errors.firstname = "First name is required";
    if (!data.role) errors.role = "Role is required";
    if (!data.gender) errors.gender = "Gender is required";
    if (!data.department.trim()) errors.department = "Department is required";
    if (!data.qualifications.trim()) errors.qualifications = "Qualifications is required";
    if (!data.contactPhone.trim()) errors.contactPhone = "Phone is required";
    if (!data.contactEmail.trim()) errors.contactEmail = "Email is required";

    // Simple email check
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.contactEmail = "Invalid email format";
    }

    // Password required only when creating
    if (!isEditing && !data.password.trim()) errors.password = "Password is required for new staff";

    return errors;
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setIsSuccessModalOpen(true);
  };

  /* =========================
     Load Data (Online-first)
  ========================= */
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        // Staff
        const staffRes = await apiFetch("/api/schoolPortalStaff");
        if (!staffRes.ok) {
          const err = await staffRes.json().catch(() => ({}));
          throw new Error(err.message || `Failed to fetch staff (Status ${staffRes.status})`);
        }
        const staffData = await staffRes.json();
        setStaffs(Array.isArray(staffData) ? staffData : []);

        // Subjects (optional but useful)
        const subRes = await apiFetch("/api/schoolPortalSubjects");
        if (subRes.ok) {
          const subData = await subRes.json().catch(() => []);
          setSubjects(Array.isArray(subData) ? subData : []);
        }

        // Students (for classes list)
        const stuRes = await apiFetch("/api/schoolPortalStudents");
        if (stuRes.ok) {
          const stuData = await stuRes.json().catch(() => []);
          setStudents(Array.isArray(stuData) ? stuData : []);
        }
      } catch (e) {
        setFetchError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  /* =========================
     Handlers
  ========================= */
  const handleChange = (e) => {
    const { id, value, type, files, options } = e.target;

    // Multi-select
    if (id === "assignedSubjects" || id === "assignedClasses") {
      const selected = Array.from(options)
        .filter((o) => o.selected)
        .map((o) => o.value);
      setForm((p) => ({ ...p, [id]: selected }));
      return;
    }

    // File (store just name for now)
    if (type === "file") {
      const file = files?.[0];
      setForm((p) => ({ ...p, resumeDocument: file ? file.name : "" }));
      return;
    }

    setForm((p) => ({ ...p, [id]: value }));
  };

  const clearForm = () => {
    setForm(initialStaffState);
    setIsEditing(false);
    setEditMongoId(null);
    setFormErrors({});
  };

  const startEdit = (staff) => {
    setIsEditing(true);
    setEditMongoId(staff._id);

    setForm({
      surname: staff.surname || "",
      firstname: staff.firstname || "",
      staffId: staff.staffId || "",
      role: staff.role || "",
      type: staff.type || "staff",
      gender: staff.gender || "",
      dateOfEmployment: staff.dateOfEmployment || "",
      department: staff.department || "",
      qualifications: staff.qualifications || "",
      contactEmail: staff.contactEmail || "",
      contactPhone: staff.contactPhone || "",
      resumeDocument: staff.resumeDocument || "",
      assignedSubjects: staff.assignedSubjects || [],
      assignedClasses: staff.assignedClasses || [],
      password: "", // keep blank during edit
    });

    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const askDelete = (staff) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete?._id) {
      setIsDeleteModalOpen(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalStaff/${staffToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete staff");
      }

      setStaffs((prev) => prev.filter((s) => s._id !== staffToDelete._id));
      showSuccess(`Staff ${staffToDelete.firstname || ""} deleted successfully.`);
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const final = { ...form };

    // Auto staffId if creating and blank
    if (!isEditing && !final.staffId.trim()) {
      final.staffId = generateStaffId();
    }

    // Ensure username aligns with staffId (your backend uses username often)
    if (!final.username) final.username = final.staffId;

    const errors = validate(final);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        // Do not send password if blank on edit
        const payload = { ...final };
        if (!payload.password) delete payload.password;

        const res = await apiFetch(`/api/schoolPortalStaff/${editMongoId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to update staff");
        }

        const updated = await res.json().catch(() => null);
        if (updated?._id) {
          setStaffs((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
        } else {
          // fallback refresh list
          const refresh = await apiFetch("/api/schoolPortalStaff");
          const list = await refresh.json().catch(() => []);
          setStaffs(Array.isArray(list) ? list : []);
        }

        showSuccess("Staff updated successfully.");
        clearForm();
      } else {
        const res = await apiFetch("/api/schoolPortalStaff", {
          method: "POST",
          body: JSON.stringify(final),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to add staff");
        }

        const created = await res.json().catch(() => null);
        if (created?._id) setStaffs((prev) => [created, ...prev]);

        showSuccess(
          `Staff registered successfully.\nStaff ID: ${final.staffId}\nUsername: ${final.staffId}`
        );
        clearForm();
      }
    } catch (e2) {
      alert(e2.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaffs = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return staffs;

    return staffs.filter((s) => {
      const name = `${s.surname || ""} ${s.firstname || ""}`.toLowerCase();
      return (
        name.includes(t) ||
        String(s.staffId || "").toLowerCase().includes(t) ||
        String(s.role || "").toLowerCase().includes(t) ||
        String(s.department || "").toLowerCase().includes(t)
      );
    });
  }, [staffs, searchTerm]);

  /* =========================
     UI
  ========================= */
  if (loading) return <div className="content-section">Loading staff data...</div>;

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
        <div style={{ marginTop: 10 }}>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h1>Staff Management</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || "Admin"}</b>
      </p>

      {/* Success Modal */}
      <ConfirmModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onConfirm={() => setIsSuccessModalOpen(false)}
        onCancel={() => setIsSuccessModalOpen(false)}
        isAlert={true}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        message={
          staffToDelete
            ? `Delete staff: ${staffToDelete.surname} ${staffToDelete.firstname} (${staffToDelete.staffId}) ?`
            : "Delete this staff?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isAlert={false}
      />

      {/* FORM */}
      <div className="sub-section">
        <h2>{isEditing ? "Edit Staff" : "Add New Staff"}</h2>

        <form onSubmit={handleSubmit} id="staffForm">
          <div className="form-group">
            <label htmlFor="surname">Surname</label>
            <input id="surname" value={form.surname} onChange={handleChange} />
            {formErrors.surname && <p className="error-text">{formErrors.surname}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="firstname">First Name</label>
            <input id="firstname" value={form.firstname} onChange={handleChange} />
            {formErrors.firstname && <p className="error-text">{formErrors.firstname}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="staffId">Staff ID</label>
            <input
              id="staffId"
              value={form.staffId}
              onChange={handleChange}
              readOnly={isEditing}
              placeholder={isEditing ? "" : "Leave blank to auto-generate"}
            />
            {!isEditing && (
              <small style={{ color: "#666" }}>
                Auto ID preview: <b>{generateStaffId()}</b>
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={handleChange}>
              <option value="">Select Role</option>
              <option value="Teacher">Teacher</option>
              <option value="Class Teacher">Class Teacher</option>
              <option value="Non-Teaching">Non-Teaching</option>
              <option value="Support">Support</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
            {formErrors.role && <p className="error-text">{formErrors.role}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {formErrors.gender && <p className="error-text">{formErrors.gender}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfEmployment">Date of Employment</label>
            <input
              type="date"
              id="dateOfEmployment"
              value={form.dateOfEmployment}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input id="department" value={form.department} onChange={handleChange} />
            {formErrors.department && <p className="error-text">{formErrors.department}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="qualifications">Qualifications</label>
            <input id="qualifications" value={form.qualifications} onChange={handleChange} />
            {formErrors.qualifications && (
              <p className="error-text">{formErrors.qualifications}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail">Email</label>
            <input id="contactEmail" value={form.contactEmail} onChange={handleChange} />
            {formErrors.contactEmail && <p className="error-text">{formErrors.contactEmail}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="contactPhone">Phone</label>
            <input id="contactPhone" value={form.contactPhone} onChange={handleChange} />
            {formErrors.contactPhone && <p className="error-text">{formErrors.contactPhone}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="resumeDocument">Resume (filename)</label>
            <input type="file" id="resumeDocument" onChange={handleChange} />
            {form.resumeDocument && (
              <small style={{ color: "#666" }}>Selected: {form.resumeDocument}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="assignedSubjects">Assigned Subjects (Ctrl+Click multi)</label>
            <select
              id="assignedSubjects"
              multiple
              value={form.assignedSubjects}
              onChange={handleChange}
            >
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignedClasses">Assigned Classes (Ctrl+Click multi)</label>
            <select
              id="assignedClasses"
              multiple
              value={form.assignedClasses}
              onChange={handleChange}
            >
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password {isEditing ? "(leave blank to keep current)" : ""}
            </label>
            <input
              type="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              placeholder={isEditing ? "Leave blank" : "Set initial password"}
            />
            {formErrors.password && <p className="error-text">{formErrors.password}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Staff" : "Add Staff"}
            </button>
            <button type="button" onClick={clearForm} disabled={submitting}>
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* LIST */}
      <div className="sub-section">
        <h2>Staff List</h2>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search by name, ID, role, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" onClick={() => setSearchTerm("")}>
            Clear Search
          </button>
        </div>

        <div className="table-container">
          <table id="staffTable">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Dept.</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Subjects</th>
                <th>Classes</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaffs.length ? (
                filteredStaffs.map((s) => (
                  <tr key={s._id || s.staffId}>
                    <td>{s.staffId}</td>
                    <td>
                      {s.surname} {s.firstname}
                    </td>
                    <td>{s.role}</td>
                    <td>{s.department}</td>
                    <td>{s.contactPhone}</td>
                    <td>{s.contactEmail}</td>
                    <td>{Array.isArray(s.assignedSubjects) ? s.assignedSubjects.join(", ") : ""}</td>
                    <td>{Array.isArray(s.assignedClasses) ? s.assignedClasses.join(", ") : ""}</td>
                    <td className="action-buttons">
                      <button type="button" onClick={() => startEdit(s)} style={{ color: "green" }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => askDelete(s)} style={{ color: "red" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffManagement;
