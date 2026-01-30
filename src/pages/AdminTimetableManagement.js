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
const norm = (v) => String(v ?? "").trim();

const buildPeriodFromTimes = (startTime, endTime) => {
  const s = norm(startTime);
  const e = norm(endTime);
  if (s && e) return `${s}-${e}`;
  return s || "";
};

const normalizeTimetable = (x) => {
  // Admin format
  if (x?.className || x?.period || x?.subject) {
    return {
      ...x,
      className: x.className || "",
      day: x.day || "Monday",
      period: x.period || "",
      subject: x.subject || "",
      teacher: x.teacher || "",
      room: x.room || "",
    };
  }

  // Old format (staff/student)
  return {
    ...x,
    className: x.classSelect || x.class || "",
    day: x.day || "Monday",
    period: buildPeriodFromTimes(x.startTime, x.endTime) || x.period || "",
    subject: x.subject || x.subjectSelect || "",
    teacher: x.teacher || x.teacherSelect || "",
    room: x.room || x.location || "",
  };
};

const isValidEntry = (x) => {
  const n = normalizeTimetable(x);
  return !!(norm(n.className) && norm(n.period) && norm(n.subject));
};

export default function AdminTimetableManagement() {
  const { user } = useAuth();

  const [form, setForm] = useState(initialItem);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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
        setErr(e.message || "Failed to load timetables");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const reset = () => {
    setForm(initialItem);
    setEditingId(null);
  };

  const startEdit = (x) => {
    const n = normalizeTimetable(x);
    setEditingId(x._id || x.id || null);
    setForm({
      className: n.className || "",
      day: n.day || "Monday",
      period: n.period || "",
      subject: n.subject || "",
      teacher: n.teacher || "",
      room: n.room || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (x) => {
    const id = x._id || x.id;
    if (!id) return;
    if (!window.confirm("Delete this timetable entry?")) return;

    try {
      const res = await apiFetch(`/api/schoolPortalTimetables/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const cleanBrokenRows = async () => {
    const broken = items.filter((x) => !isValidEntry(x) && (x._id || x.id));
    if (!broken.length) return alert("No broken rows found ✅");

    if (!window.confirm(`Delete ${broken.length} broken timetable rows?`)) return;

    for (const b of broken) {
      const id = b._id || b.id;
      await apiFetch(`/api/schoolPortalTimetables/${id}`, { method: "DELETE" }).catch(() => {});
    }

    setItems((prev) => prev.filter((x) => isValidEntry(x)));
    alert("Broken rows cleaned ✅");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const className = norm(form.className);
    const period = norm(form.period);
    const subject = norm(form.subject);
    const teacher = norm(form.teacher);
    const room = norm(form.room);

    if (!className) return alert("Class is required");
    if (!period) return alert("Period is required");
    if (!subject) return alert("Subject is required");

    const payload = {
      // admin format
      className,
      day: form.day,
      period,
      subject,
      teacher,
      room,

      // legacy format too
      classSelect: className,
      subjectSelect: subject,
      teacherSelect: teacher,
      location: room,

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
        if (!res.ok) throw new Error("Update failed");

        const updated = await res.json().catch(() => null);
        const finalObj = updated || { ...payload, _id: editingId };

        setItems((prev) =>
          prev.map((i) => ((i._id || i.id) === editingId ? finalObj : i))
        );
        reset();
      } else {
        const res = await apiFetch("/api/schoolPortalTimetables", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");

        const created = await res.json().catch(() => null);
        setItems((prev) => [created || payload, ...prev]);
        reset();
      }
    } catch (e2) {
      alert(e2.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const normalized = items.map(normalizeTimetable);

    if (!q) return normalized;

    return normalized.filter((n) => {
      return (
        norm(n.className).toLowerCase().includes(q) ||
        norm(n.day).toLowerCase().includes(q) ||
        norm(n.period).toLowerCase().includes(q) ||
        norm(n.subject).toLowerCase().includes(q) ||
        norm(n.teacher).toLowerCase().includes(q) ||
        norm(n.room).toLowerCase().includes(q)
      );
    });
  }, [items, search]);

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
            <button type="button" onClick={reset} style={{ background: "#6c757d" }}>Clear</button>
            <button type="button" onClick={cleanBrokenRows} style={{ background: "#dc2626" }}>
              Clean Broken Rows
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
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Class</th>
                <th style={th}>Day</th>
                <th style={th}>Period</th>
                <th style={th}>Subject</th>
                <th style={th}>Teacher</th>
                <th style={th}>Room</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((n) => {
                  const valid = isValidEntry(n);
                  return (
                    <tr key={n._id || n.id || `${n.className}-${n.day}-${n.period}-${n.subject}`}>
                      <td style={td}>{n.className || "-"}</td>
                      <td style={td}>{n.day || "-"}</td>
                      <td style={td}>{n.period || "-"}</td>
                      <td style={td}><b>{n.subject || "-"}</b></td>
                      <td style={td}>{n.teacher || "-"}</td>
                      <td style={td}>{n.room || "-"}</td>
                      <td style={td}>
                        {valid ? (
                          <span style={{ padding: "3px 8px", borderRadius: 999, background: "#16a34a", color: "#fff" }}>
                            OK
                          </span>
                        ) : (
                          <span style={{ padding: "3px 8px", borderRadius: 999, background: "#dc2626", color: "#fff" }}>
                            Incomplete
                          </span>
                        )}
                      </td>
                      <td style={td}>
                        <button onClick={() => startEdit(n)}>Edit</button>{" "}
                        <button onClick={() => remove(n)} style={{ background: "#dc2626" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td style={td} colSpan="8">No timetable entries.</td></tr>
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
