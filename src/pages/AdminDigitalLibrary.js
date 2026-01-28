import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

const initialResource = {
  title: "",
  category: "General",
  url: "",
  description: "",
  visibility: "all", // all | students | staff
};

function AdminDigitalLibrary() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initialResource);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await apiFetch("/api/schoolPortalDigitalLibrary");
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || "Failed to fetch digital library");
        }
        const data = await res.json().catch(() => []);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return items;
    return items.filter((x) => {
      return (
        String(x.title || "").toLowerCase().includes(t) ||
        String(x.category || "").toLowerCase().includes(t) ||
        String(x.visibility || "").toLowerCase().includes(t)
      );
    });
  }, [items, search]);

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const reset = () => {
    setForm(initialResource);
    setEditingId(null);
  };

  const startEdit = (x) => {
    setEditingId(x._id);
    setForm({
      title: x.title || "",
      category: x.category || "General",
      url: x.url || "",
      description: x.description || "",
      visibility: x.visibility || "all",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (x) => {
    if (!window.confirm("Delete this resource?")) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalDigitalLibrary/${x._id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Delete failed");
      }
      setItems((prev) => prev.filter((i) => i._id !== x._id));
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.title.trim()) return alert("Title is required");
    if (!form.url.trim()) return alert("URL is required");

    const payload = {
      ...form,
      title: form.title.trim(),
      url: form.url.trim(),
      createdBy: user?.username || "admin",
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/schoolPortalDigitalLibrary/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Update failed");
        }
        const updated = await res.json().catch(() => null);
        setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
        reset();
      } else {
        const res = await apiFetch("/api/schoolPortalDigitalLibrary", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e2 = await res.json().catch(() => ({}));
          throw new Error(e2.message || "Create failed");
        }
        const created = await res.json().catch(() => null);
        if (created?._id) setItems((prev) => [created, ...prev]);
        reset();
      }
    } catch (e3) {
      alert(e3.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="content-section">Loading digital library…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Admin Digital Library</h1>

      <div className="sub-section">
        <h2>{editingId ? "Edit Resource" : "Add Resource"}</h2>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 900 }}>
          <input id="title" value={form.title} onChange={onChange} placeholder="Title" />
          <input id="url" value={form.url} onChange={onChange} placeholder="File URL / Link" />
          <input id="category" value={form.category} onChange={onChange} placeholder="Category" />
          <select id="visibility" value={form.visibility} onChange={onChange}>
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="staff">Staff</option>
          </select>
          <textarea id="description" value={form.description} onChange={onChange} rows={4} placeholder="Description (optional)" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
            <button type="button" onClick={reset} style={{ background: "#6c757d" }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="sub-section">
        <h2>Resources</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title/category/visibility..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Category</th>
                <th style={th}>Visibility</th>
                <th style={th}>Link</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((x) => (
                  <tr key={x._id}>
                    <td style={td}><b>{x.title}</b><br /><small>{x.description || ""}</small></td>
                    <td style={td}>{x.category || "-"}</td>
                    <td style={td}>{x.visibility || "all"}</td>
                    <td style={td}>
                      <a href={x.url} target="_blank" rel="noreferrer">Open</a>
                    </td>
                    <td style={td}>
                      <button onClick={() => startEdit(x)}>Edit</button>{" "}
                      <button onClick={() => remove(x)} style={{ background: "#dc2626" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="5">No resources.</td></tr>
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

export default AdminDigitalLibrary;
