import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

const initialMsg = {
  title: "",
  body: "",
  audience: "all", // all | students | staff | parents
  priority: "normal", // normal | urgent
};

function AdminMessaging() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initialMsg);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await apiFetch("/api/schoolPortalAdminMessages");
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || `Failed to load messages (${res.status})`);
        }
        const data = await res.json().catch(() => []);
        setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return messages;
    return messages.filter((m) => {
      const title = String(m.title || "").toLowerCase();
      const body = String(m.body || "").toLowerCase();
      const aud = String(m.audience || "").toLowerCase();
      return title.includes(t) || body.includes(t) || aud.includes(t);
    });
  }, [messages, search]);

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const reset = () => {
    setForm(initialMsg);
    setEditingId(null);
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setForm({
      title: m.title || "",
      body: m.body || "",
      audience: m.audience || "all",
      priority: m.priority || "normal",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (m) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await apiFetch(`/api/schoolPortalAdminMessages/${m._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Delete failed");
      }
      setMessages((prev) => prev.filter((x) => x._id !== m._id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.title.trim() || !form.body.trim()) {
      alert("Title and Body are required");
      return;
    }

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      priority: form.priority,
      createdBy: user?.username || "admin",
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/schoolPortalAdminMessages/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Update failed");
        }
        const updated = await res.json().catch(() => null);
        setMessages((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
        reset();
      } else {
        const res = await apiFetch("/api/schoolPortalAdminMessages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Send failed");
        }
        const created = await res.json().catch(() => null);
        if (created?._id) setMessages((prev) => [created, ...prev]);
        reset();
      }
    } catch (e3) {
      alert(e3.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="content-section">Loading messages…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Admin Messaging</h1>

      <div className="sub-section">
        <h2>{editingId ? "Edit Message" : "Create Message"}</h2>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 800 }}>
          <input id="title" value={form.title} onChange={onChange} placeholder="Title" />
          <textarea
            id="body"
            value={form.body}
            onChange={onChange}
            placeholder="Message body..."
            rows={5}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select id="audience" value={form.audience} onChange={onChange}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="staff">Staff</option>
              <option value="parents">Parents</option>
            </select>
            <select id="priority" value={form.priority} onChange={onChange}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>

            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Send"}
            </button>
            <button type="button" onClick={reset} style={{ background: "#6c757d" }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="sub-section">
        <h2>Sent Messages</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title/body/audience..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Audience</th>
                <th style={th}>Priority</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((m) => (
                  <tr key={m._id}>
                    <td style={td}><b>{m.title}</b><br />{String(m.body || "").slice(0, 60)}...</td>
                    <td style={td}>{m.audience || "all"}</td>
                    <td style={td}>{m.priority || "normal"}</td>
                    <td style={td}>{m.createdAt ? String(m.createdAt).slice(0, 10) : "-"}</td>
                    <td style={td}>
                      <button onClick={() => startEdit(m)}>Edit</button>{" "}
                      <button onClick={() => remove(m)} style={{ background: "#dc2626" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="5">No messages.</td></tr>
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

export default AdminMessaging;
