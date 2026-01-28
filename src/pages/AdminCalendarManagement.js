import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import useLocalStorage from "../hooks/useLocalStorage";

const LOCAL_KEY = "schoolPortalCalendarEvents";
const API_PATH = "/api/schoolPortalCalendarEvents"; // if backend doesn’t have it → fallback

const initialEvent = { title: "", date: "", time: "", location: "", note: "" };

function AdminCalendarManagement() {
  const [localEvents, setLocalEvents] = useLocalStorage(LOCAL_KEY, []);
  const [events, setEvents] = useState([]);

  const [mode, setMode] = useState("loading"); // loading | api | local
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initialEvent);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setMode("loading");
      setErr(null);
      try {
        const res = await apiFetch(API_PATH);
        if (res.ok) {
          const data = await res.json().catch(() => []);
          setEvents(Array.isArray(data) ? data : []);
          setMode("api");
          return;
        }
        // fallback for 404/Entity not found
        setEvents(localEvents);
        setMode("local");
      } catch {
        setEvents(localEvents);
        setMode("local");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "local") setEvents(localEvents);
  }, [localEvents, mode]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return events;
    return events.filter((e) =>
      [e.title, e.date, e.location, e.note].some((v) => String(v || "").toLowerCase().includes(t))
    );
  }, [events, search]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const reset = () => {
    setForm(initialEvent);
    setEditingId(null);
  };

  const saveLocal = () => {
    const payload = {
      ...form,
      id: editingId || Date.now(),
      title: form.title.trim(),
    };
    if (!payload.title || !payload.date) return alert("Title and date are required");

    setLocalEvents((prev) => {
      const exists = prev.some((x) => x.id === payload.id);
      return exists ? prev.map((x) => (x.id === payload.id ? payload : x)) : [payload, ...prev];
    });
    reset();
  };

  const deleteLocal = (id) => {
    if (!window.confirm("Delete this event?")) return;
    setLocalEvents((prev) => prev.filter((x) => x.id !== id));
  };

  // If API mode exists later, you can expand with api POST/PUT/DELETE.
  if (mode === "loading") return <div className="content-section">Loading calendar…</div>;
  if (err) return <div className="content-section" style={{ color: "red" }}>{err}</div>;

  return (
    <div className="content-section">
      <h1>Admin Calendar Management</h1>
      <p style={{ color: "#666" }}>
        Storage mode: <b>{mode === "api" ? "Backend" : "Local (fallback)"}</b>
      </p>

      <div className="sub-section">
        <h2>{editingId ? "Edit Event" : "Add Event"}</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 800 }}>
          <input id="title" value={form.title} onChange={onChange} placeholder="Event title" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input id="date" type="date" value={form.date} onChange={onChange} />
            <input id="time" type="time" value={form.time} onChange={onChange} />
          </div>
          <input id="location" value={form.location} onChange={onChange} placeholder="Location (optional)" />
          <textarea id="note" value={form.note} onChange={onChange} rows={3} placeholder="Note (optional)" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveLocal}>{editingId ? "Update" : "Save"}</button>
            <button onClick={reset} style={{ background: "#6c757d" }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="sub-section">
        <h2>Events</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Date</th>
                <th style={th}>Time</th>
                <th style={th}>Location</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((e) => (
                  <tr key={e._id || e.id}>
                    <td style={td}><b>{e.title}</b><br /><small>{e.note || ""}</small></td>
                    <td style={td}>{e.date}</td>
                    <td style={td}>{e.time || "-"}</td>
                    <td style={td}>{e.location || "-"}</td>
                    <td style={td}>
                      <button onClick={() => { setEditingId(e.id); setForm({ ...initialEvent, ...e }); }}>Edit</button>{" "}
                      <button onClick={() => deleteLocal(e.id)} style={{ background: "#dc2626" }}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="5">No events.</td></tr>
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

export default AdminCalendarManagement;
