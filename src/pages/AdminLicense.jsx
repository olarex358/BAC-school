import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";

function AdminLicense() {
  const [status, setStatus] = useState("");
  const [expiry, setExpiry] = useState("");
  const [productKey, setProductKey] = useState("");
  const [days, setDays] = useState(365);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/api/license/status");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setMsg(data.message || "Failed to load license status.");
          return;
        }

        setStatus(data.licenseStatus || "");
        setExpiry(data.licenseExpiry || "");
      } catch {
        setMsg("Network error while loading license status.");
      }
    };

    load();
  }, []);

  const activateLicense = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await apiFetch("/api/license/activate", {
        method: "POST",
        body: JSON.stringify({
          productKey,
          durationInDays: Number(days) || 365,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.message || "License activation failed.");
        return;
      }

      setMsg("License activated successfully ✅");
      setExpiry(data.licenseExpiry || "");
      setStatus(data.licenseStatus || "active");
    } catch {
      setMsg("Network error. Please try again.");
    }
  };

  return (
    <div className="content-section" style={{ maxWidth: 500 }}>
      <h2>🔐 License Management</h2>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: status === "active" ? "green" : "red" }}>
          {status || "-"}
        </span>
      </p>

      <p>
        <strong>Expiry:</strong>{" "}
        {expiry ? new Date(expiry).toDateString() : "Not set"}
      </p>

      <hr />

      <form onSubmit={activateLicense}>
        <input
          placeholder="Product key (BC-XXXX)"
          value={productKey}
          onChange={(e) => setProductKey(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Duration (days)"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          required
        />

        <button type="submit">Activate / Renew License</button>
      </form>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}

export default AdminLicense;
