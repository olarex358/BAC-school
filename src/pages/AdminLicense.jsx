import React, { useEffect, useState } from "react";

function AdminLicense() {
  const [status, setStatus] = useState("");
  const [expiry, setExpiry] = useState("");
  const [productKey, setProductKey] = useState("");
  const [days, setDays] = useState(365);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetch("http://localhost:5000/api/license/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setStatus(data.licenseStatus);
        setExpiry(data.licenseExpiry);
      });
  }, [token]);

  const activateLicense = async e => {
    e.preventDefault();
    setMsg("");

    const res = await fetch("http://localhost:5000/api/license/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productKey,
        durationInDays: days,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message);
      return;
    }

    setMsg("License activated successfully");
    setExpiry(data.licenseExpiry);
    setStatus("active");
  };

  return (
    <div className="content-section" style={{ maxWidth: 500 }}>
      <h2>🔐 License Management</h2>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: status === "active" ? "green" : "red" }}>
          {status}
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
          onChange={e => setProductKey(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Duration (days)"
          value={days}
          onChange={e => setDays(e.target.value)}
          required
        />

        <button>Activate / Renew License</button>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}

export default AdminLicense;
