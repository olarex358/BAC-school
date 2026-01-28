import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

const initialItem = {
  className: "",
  day: "Monday",
  period: "",
  subject: "",
  teacher: "",
  room: "",
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function AdminTimetableManagement() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initialItem);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await apiFetch("/api/schoolPortalTimetables");
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.message || `Failed to load timetables (${res.status})`);
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
    return items.filter((x) =>
      [x.className, x.day, x.subject, x.teacher, x.room, x.period]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(t))
    );
  }, [items, search]);

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const reset = () => {
    setForm(initialItem);
    setEditingId(null);
  };

  const startEdit = (x) => {
    setEditingId(x._id);
    setForm({
      className: x.className || "",
      day: x.day || "Monday",
      period: x.period || "",
      subject: x.subject || "",
      teacher: x.teacher || "",
      room: x.room || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (x) => {
    if (!window.confirm("Delete this timetable entry?")) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/schoolPortalTimetables/${x._id}`, { method: "DELETE" });
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

    if (!form.className.trim()) return alert("Class is required");
    if (!form.period.trim()) return alert("Period is required");
    if (!form.subject.trim()) return alert("Subject is required");

    const payload = {
      ...form,
      className: form.className.trim(),
      period: form.period.trim(),
      subject: form.subject.trim(),
      teacher: form.teacher.trim(),
      room: form.room.trim(),
      updatedBy: user?.username || "admin",
      updatedAt: new Date().toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/schoolPortalTimetables/${editingId}`, {
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
        const res = await apiFetch("/api/schoolPortalTimetables", {
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

  if (loading) return <div className="content-section">Loading timetable…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Admin Timetable Management</h1>

      <div className="sub-section">
        <h2>{editingId ? "Edit Entry" : "Add Entry"}</h2>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 900 }}>
          <input id="className" value={form.className} onChange={onChange} placeholder="Class e.g. JSS1 A" />
          <select id="day" value={form.day} onChange={onChange}>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input id="period" value={form.period} onChange={onChange} placeholder="Period e.g. 1 (8:00-8:40)" />
          <input id="subject" value={form.subject} onChange={onChange} placeholder="Subject" />
          <input id="teacher" value={form.teacher} onChange={onChange} placeholder="Teacher (optional)" />
          <input id="room" value={form.room} onChange={onChange} placeholder="Room (optional)" />

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
        <h2>Entries</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search class/day/subject/teacher..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Class</th>
                <th style={th}>Day</th>
                <th style={th}>Period</th>
                <th style={th}>Subject</th>
                <th style={th}>Teacher</th>
                <th style={th}>Room</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((x) => (
                  <tr key={x._id}>
                    <td style={td}>{x.className}</td>
                    <td style={td}>{x.day}</td>
                    <td style={td}>{x.period}</td>
                    <td style={td}><b>{x.subject}</b></td>
                    <td style={td}>{x.teacher || "-"}</td>
                    <td style={td}>{x.room || "-"}</td>
                    <td style={td}>
                      <button onClick={() => startEdit(x)}>Edit</button>{" "}
                      <button onClick={() => remove(x)} style={{ background: "#dc2626" }}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="7">No timetable entries.</td></tr>
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

export default AdminTimetableManagement;
