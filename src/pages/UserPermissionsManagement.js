import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

/**
 * User Permissions Management (Admin)
 * Requires backend entity: /api/schoolPortalUsers
 * CRUD:
 *  - GET    /api/schoolPortalUsers
 *  - POST   /api/schoolPortalUsers
 *  - PUT    /api/schoolPortalUsers/:id
 *  - DELETE /api/schoolPortalUsers/:id
 */

const ROLE_PRESETS = [
  { type: "admin", role: "Super Admin" },
  { type: "admin", role: "Admin" },

  { type: "staff", role: "Teacher" },
  { type: "staff", role: "Class Teacher" },
  { type: "staff", role: "Non-Teaching" },

  { type: "accountant", role: "Accountant" },
  { type: "student", role: "Student" },
];

const PERMISSIONS = [
  "manage_students",
  "manage_staff",
  "manage_subjects",
  "manage_results",
  "approve_results",
  "view_reports",
  "manage_fees",
  "manage_attendance",
  "manage_timetable",
  "manage_calendar",
  "manage_syllabus",
  "manage_library",
  "manage_news",
  "manage_messages",
  "manage_certifications",
];

const initialCreate = {
  username: "",
  password: "",
  type: "staff",
  role: "Teacher",
  isActivated: true,
  extraPermissions: [],
};

export default function UserPermissionsManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [search, setSearch] = useState("");

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreate);
  const [creating, setCreating] = useState(false);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  const API_ENTITY = "/api/schoolPortalUsers";

  const normalizeType = (t) => String(t || "").toLowerCase();

  const safeActivated = (u) => {
    if (typeof u.isActivated === "boolean") return u.isActivated;
    if (typeof u.needsActivation === "boolean") return !u.needsActivation;
    return true;
  };

  const loadUsers = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch(API_ENTITY);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // If backend not updated yet, you’ll see this:
        // { message: "Entity not found" }
        throw new Error(body.message || `Failed to load users (${res.status})`);
      }
      const data = await res.json().catch(() => []);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return users;
    return users.filter((u) => {
      const blob = [
        u.username,
        u.type,
        u.role,
        Array.isArray(u.extraPermissions) ? u.extraPermissions.join(" ") : "",
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");
      return blob.includes(t);
    });
  }, [users, search]);

  // ---------- Permission toggles ----------
  const togglePermission = (arr, perm) => {
    const set = new Set(Array.isArray(arr) ? arr : []);
    if (set.has(perm)) set.delete(perm);
    else set.add(perm);
    return Array.from(set);
  };

  // ---------- Create ----------
  const submitCreate = async (e) => {
    e.preventDefault();
    if (creating) return;

    if (!createForm.username.trim()) return alert("Username is required");
    if (!createForm.password.trim()) return alert("Password is required");

    const payload = {
      username: createForm.username.trim(),
      password: createForm.password,
      type: normalizeType(createForm.type),
      role: createForm.role,
      isActivated: !!createForm.isActivated,
      needsActivation: !createForm.isActivated,
      extraPermissions: Array.isArray(createForm.extraPermissions)
        ? createForm.extraPermissions
        : [],
      createdBy: user?.username || "admin",
      createdAt: new Date().toISOString(),
    };

    setCreating(true);
    try {
      const res = await apiFetch(API_ENTITY, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Create failed (${res.status})`);
      }

      const created = await res.json().catch(() => null);
      if (created?._id) setUsers((prev) => [created, ...prev]);

      setCreateForm(initialCreate);
      setCreateOpen(false);
      alert("User created ✅");
    } catch (e2) {
      alert(e2.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  // ---------- Edit ----------
  const openEdit = (u) => {
    setEditForm({
      _id: u._id,
      username: u.username || "",
      type: normalizeType(u.type),
      role: u.role || "",
      isActivated: safeActivated(u),
      extraPermissions: Array.isArray(u.extraPermissions)
        ? u.extraPermissions
        : [],
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editForm?._id || savingEdit) return;

    const payload = {
      type: normalizeType(editForm.type),
      role: editForm.role,
      isActivated: !!editForm.isActivated,
      needsActivation: !editForm.isActivated,
      extraPermissions: Array.isArray(editForm.extraPermissions)
        ? editForm.extraPermissions
        : [],
      updatedBy: user?.username || "admin",
      updatedAt: new Date().toISOString(),
    };

    setSavingEdit(true);
    try {
      const res = await apiFetch(`${API_ENTITY}/${editForm._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Update failed (${res.status})`);
      }

      const updated = await res.json().catch(() => null);
      if (updated?._id) {
        setUsers((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      }

      setEditOpen(false);
      setEditForm(null);
      alert("User updated ✅");
    } catch (e2) {
      alert(e2.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------- Reset password ----------
  const openReset = (u) => {
    setResetTarget(u);
    setNewPassword("");
    setResetOpen(true);
  };

  const doResetPassword = async () => {
    if (!resetTarget?._id || resetting) return;
    if (!newPassword.trim()) return alert("Enter a new password");

    setResetting(true);
    try {
      // We’ll implement backend to hash when password is provided in PUT
      const res = await apiFetch(`${API_ENTITY}/${resetTarget._id}`, {
        method: "PUT",
        body: JSON.stringify({
          password: newPassword,
          updatedBy: user?.username || "admin",
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Reset failed (${res.status})`);
      }

      setResetOpen(false);
      setResetTarget(null);
      setNewPassword("");
      alert("Password reset ✅");
    } catch (e2) {
      alert(e2.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  // ---------- Delete ----------
  const deleteUser = async (u) => {
    if (!u?._id) return;
    if (!window.confirm(`Delete user "${u.username}"?`)) return;

    setDeletingId(u._id);
    try {
      const res = await apiFetch(`${API_ENTITY}/${u._id}`, { method: "DELETE" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Delete failed (${res.status})`);
      }

      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      alert("User deleted ✅");
    } catch (e2) {
      alert(e2.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- UI ----------
  if (loading) return <div className="content-section">Loading users…</div>;

  return (
    <div className="content-section">
      <h1>User Permissions Management</h1>
      <p style={{ marginTop: -8, color: "#555" }}>
        Logged in as: <b>{user?.username || user?.role || "Admin"}</b>
      </p>

      {err && (
        <div
          style={{
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
            color: "white",
            background: "#dc2626",
          }}
        >
          {err}
          <div style={{ marginTop: 6, fontSize: 13 }}>
            If you see <b>"Entity not found"</b>, backend needs <b>schoolPortalUsers</b> entity added.
          </div>
        </div>
      )}

      <div className="sub-section" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username/type/role/permissions…"
          style={{ flex: 1, minWidth: 260 }}
        />
        <button onClick={() => setCreateOpen((p) => !p)}>
          {createOpen ? "Close Create" : "+ Create User"}
        </button>
        <button onClick={loadUsers} style={{ background: "#6c757d" }}>
          Refresh
        </button>
      </div>

      {/* CREATE */}
      {createOpen && (
        <div className="sub-section" style={{ border: "1px solid #eee", borderRadius: 8 }}>
          <h2>Create User</h2>

          <form onSubmit={submitCreate} style={{ display: "grid", gap: 10, maxWidth: 900 }}>
            <input
              value={createForm.username}
              onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
              placeholder="Username (e.g. BAC/STF/2026/0001)"
            />

            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Password"
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="admin">admin</option>
                <option value="staff">staff</option>
                <option value="student">student</option>
                <option value="accountant">accountant</option>
              </select>

              <select
                value={createForm.role}
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
              >
                {ROLE_PRESETS.map((r) => (
                  <option key={`${r.type}-${r.role}`} value={r.role}>
                    {r.role}
                  </option>
                ))}
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={createForm.isActivated}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, isActivated: e.target.checked }))
                  }
                />
                Activated
              </label>
            </div>

            <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
              <b>Extra Permissions (optional)</b>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {PERMISSIONS.map((perm) => (
                  <label key={perm} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={(createForm.extraPermissions || []).includes(perm)}
                      onChange={() =>
                        setCreateForm((p) => ({
                          ...p,
                          extraPermissions: togglePermission(p.extraPermissions, perm),
                        }))
                      }
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateForm(initialCreate);
                  setCreateOpen(false);
                }}
                style={{ background: "#6c757d" }}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT */}
      {editOpen && editForm && (
        <div className="sub-section" style={{ border: "1px solid #eee", borderRadius: 8 }}>
          <h2>Edit User: {editForm.username}</h2>

          <div style={{ display: "grid", gap: 10, maxWidth: 900 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="admin">admin</option>
                <option value="staff">staff</option>
                <option value="student">student</option>
                <option value="accountant">accountant</option>
              </select>

              <select
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
              >
                {ROLE_PRESETS.map((r) => (
                  <option key={`${r.type}-${r.role}`} value={r.role}>
                    {r.role}
                  </option>
                ))}
              </select>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!editForm.isActivated}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, isActivated: e.target.checked }))
                  }
                />
                Activated
              </label>
            </div>

            <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
              <b>Extra Permissions</b>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {PERMISSIONS.map((perm) => (
                  <label key={perm} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={(editForm.extraPermissions || []).includes(perm)}
                      onChange={() =>
                        setEditForm((p) => ({
                          ...p,
                          extraPermissions: togglePermission(p.extraPermissions, perm),
                        }))
                      }
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditForm(null);
                }}
                style={{ background: "#6c757d" }}
                disabled={savingEdit}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD */}
      {resetOpen && resetTarget && (
        <div className="sub-section" style={{ border: "1px solid #eee", borderRadius: 8 }}>
          <h2>Reset Password: {resetTarget.username}</h2>

          <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={doResetPassword} disabled={resetting}>
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
              <button
                onClick={() => {
                  setResetOpen(false);
                  setResetTarget(null);
                  setNewPassword("");
                }}
                style={{ background: "#6c757d" }}
                disabled={resetting}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="sub-section">
        <h2>Users ({filteredUsers.length})</h2>

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Username</th>
                <th style={th}>Type</th>
                <th style={th}>Role</th>
                <th style={th}>Activated</th>
                <th style={th}>Extra Permissions</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td style={td}><b>{u.username}</b></td>
                    <td style={td}>{normalizeType(u.type)}</td>
                    <td style={td}>{u.role || "-"}</td>
                    <td style={td}>{safeActivated(u) ? "Yes" : "No"}</td>
                    <td style={td}>
                      {Array.isArray(u.extraPermissions) && u.extraPermissions.length
                        ? u.extraPermissions.join(", ")
                        : "-"}
                    </td>
                    <td style={td}>
                      <button onClick={() => openEdit(u)}>Edit</button>{" "}
                      <button onClick={() => openReset(u)} style={{ background: "#2563eb" }}>
                        Reset Password
                      </button>{" "}
                      <button
                        onClick={() => deleteUser(u)}
                        style={{ background: "#dc2626" }}
                        disabled={deletingId === u._id}
                      >
                        {deletingId === u._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={td} colSpan="6">
                    No users found.
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
