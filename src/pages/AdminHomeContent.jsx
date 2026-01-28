import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";

const LOCAL_KEY = "schoolPortalHomeContent";
const API_PATH = "/api/schoolPortalHomeContent"; // backend may not have it (fallback)

const initial = {
  headline: "",
  subHeadline: "",
  announcement: "",
  whatsapp: "",
  deadline: "",
};

export default function AdminHomeContent() {
  const { user } = useAuth();

  const [local, setLocal] = useLocalStorage(LOCAL_KEY, initial);

  const [mode, setMode] = useState("loading"); // loading | api | local
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setMode("loading");
      setErr(null);

      try {
        const res = await apiFetch(API_PATH);

        // If backend doesn't have this entity -> fallback
        if (!res.ok) {
          setForm(local);
          setMode("local");
          return;
        }

        const data = await res.json().catch(() => ({}));
        setForm({ ...initial, ...(data || {}) });
        setMode("api");
      } catch {
        setForm(local);
        setMode("local");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "local") setForm(local);
  }, [local, mode]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.id]: e.target.value }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);

    const payload = {
      ...form,
      updatedBy: user?.username || "admin",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (mode === "api") {
        // In API mode, we store 1 record (id-less “singleton”)
        // Some backends save as POST; some require PUT. We try POST first.
        const res = await apiFetch(API_PATH, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // if POST not allowed, fallback to local to avoid breaking
          setLocal(form);
          setMode("local");
          alert("Backend content endpoint not available. Saved locally instead.");
          setSaving(false);
          return;
        }

        alert("Home content saved to backend ✅");
      } else {
        setLocal(form);
        alert("Home content saved locally ✅");
      }
    } catch {
      setLocal(form);
      setMode("local");
      alert("Network issue. Saved locally ✅");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "loading") return <div className="content-section">Loading home content…</div>;

  return (
    <div className="content-section">
      <h1>Admin Home Content</h1>

      <p style={{ color: "#666" }}>
        Storage mode: <b>{mode === "api" ? "Backend" : "Local (fallback)"}</b>
      </p>

      {err && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {err}
        </div>
      )}

      <div className="sub-section" style={{ display: "grid", gap: 10, maxWidth: 900 }}>
        <input id="headline" value={form.headline} onChange={onChange} placeholder="Homepage headline" />
        <input id="subHeadline" value={form.subHeadline} onChange={onChange} placeholder="Sub headline" />
        <textarea id="announcement" value={form.announcement} onChange={onChange} rows={4} placeholder="Announcement" />
        <input id="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="WhatsApp contact (optional)" />
        <div>
          <label style={{ fontSize: 12, color: "#666" }}>Application deadline (optional)</label>
          <input id="deadline" type="date" value={form.deadline} onChange={onChange} />
        </div>

        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
