import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import useLocalStorage from "../hooks/useLocalStorage";

const LOCAL_KEY = "schoolPortalSyllabusEntries";
const API_PATH = "/api/schoolPortalSyllabusEntries"; // if backend doesn’t have it → fallback

const initialEntry = { className: "", subject: "", week: "", topic: "", note: "" };

function AdminSyllabusManagement() {
  const [localEntries, setLocalEntries] = useLocalStorage(LOCAL_KEY, []);
  const [entries, setEntries] = useState([]);
  const [mode, setMode] = useState("loading");

  const [form, setForm] = useState(initialEntry);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setMode("loading");
      try {
        const res = await apiFetch(API_PATH);
        if (res.ok) {
          const data = await res.json().catch(() => []);
          setEntries(Array.isArray(data) ? data : []);
          setMode("api");
          return;
        }
        setEntries(localEntries);
        setMode("local");
      } catch {
        setEntries(localEntries);
        setMode("local");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "local") setEntries(localEntries);
  }, [localEntries, mode]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return entries;
    return entries.filter((x) =>
      [x.className, x.subject, x.week, x.topic, x.note]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(t))
    );
  }, [entries, search]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const reset = () => {
    setForm(initialEntry);
    setEditingId(null);
  };

  const saveLocal = () => {
    const payload = {
      ...form,
      id: editingId || Date.now(),
      className: form.className.trim(),
      subject: form.subject.trim(),
      topic: form.topic.trim(),
    };
    if (!payload.className || !payload.subject || !payload.topic) {
      return alert("Class, Subject, Topic are required");
    }

    setLocalEntries((prev) => {
      const exists = prev.some((x) => x.id === payload.id);
      return exists ? prev.map((x) => (x.id === payload.id ? payload : x)) : [payload, ...prev];
    });
    reset();
  };

  const deleteLocal = (id) => {
    if (!window.confirm("Delete this syllabus entry?")) return;
    setLocalEntries((prev) => prev.filter((x) => x.id !== id));
  };

  if (mode === "loading") return <div className="content-section">Loading syllabus…</div>;

  return (
    <div className="content-section">
      <h1>Admin Syllabus Management</h1>
      <p style={{ color: "#666" }}>
        Storage mode: <b>{mode === "api" ? "Backend" : "Local (fallback)"}</b>
      </p>

      <div className="sub-section">
        <h2>{editingId ? "Edit Entry" : "Add Entry"}</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 900 }}>
          <input id="className" value={form.className} onChange={onChange} placeholder="Class e.g. SS2 A" />
          <input id="subject" value={form.subject} onChange={onChange} placeholder="Subject" />
          <input id="week" value={form.week} onChange={onChange} placeholder="Week (optional) e.g. Week 3" />
          <input id="topic" value={form.topic} onChange={onChange} placeholder="Topic" />
          <textarea id="note" value={form.note} onChange={onChange} rows={3} placeholder="Note (optional)" />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveLocal}>{editingId ? "Update" : "Save"}</button>
            <button onClick={reset} style={{ background: "#6c757d" }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="sub-section">
        <h2>Entries</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search class/subject/topic..."
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />

        <div className="table-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Class</th>
                <th style={th}>Subject</th>
                <th style={th}>Week</th>
                <th style={th}>Topic</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((x) => (
                  <tr key={x._id || x.id}>
                    <td style={td}>{x.className}</td>
                    <td style={td}>{x.subject}</td>
                    <td style={td}>{x.week || "-"}</td>
                    <td style={td}><b>{x.topic}</b><br /><small>{x.note || ""}</small></td>
                    <td style={td}>
                      <button onClick={() => { setEditingId(x.id); setForm({ ...initialEntry, ...x }); }}>Edit</button>{" "}
                      <button onClick={() => deleteLocal(x.id)} style={{ background: "#dc2626" }}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan="5">No entries.</td></tr>
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

export default AdminSyllabusManagement;
