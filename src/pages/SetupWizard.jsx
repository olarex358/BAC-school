import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Backend base URL
 * Uses Render in production, fallback included
 */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://school-portal-backend-i29s.onrender.com";

function SetupWizard() {
  const navigate = useNavigate();

  const [schoolName, setSchoolName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [productKey, setProductKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 CHECK SETUP STATUS ON LOAD
  //useEffect(() => {
    //let mounted = true;

    //fetch(`${API_BASE}/api/setup/status`, {
      //headers: { Accept: "application/json" },
    //})
      //.then((res) => {
        //if (!res.ok) throw new Error("Invalid response");
        //return res.json();
      //})
      //.then((data) => {
        //if (mounted && data.installed === true) {
          //navigate("/login", { replace: true });
        //}
      //})
      //.catch((err) => {
        //console.error("Setup status check failed:", err.message);
      //});

    //return () => {
      //mounted = false;
    //};
 // }, [navigate]);

  // 🛠️ HANDLE SETUP SUBMIT (ONLY IF NOT INSTALLED)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolName,
          adminUsername,
          adminPassword,
          productKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Setup failed");
        return;
      }

      alert("Setup completed successfully. Please login.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-section" style={{ maxWidth: 420, margin: "auto" }}>
      <h2>🔧 System Setup</h2>
      <p>One-time installation for this school</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="School name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          required
        />

        <input
          placeholder="Admin username"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Admin password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
        />

        <input
          placeholder="Product key (BC-XXXX)"
          value={productKey}
          onChange={(e) => setProductKey(e.target.value)}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button disabled={loading}>
          {loading ? "Installing..." : "Install System"}
        </button>
      </form>
    </div>
  );
}

export default SetupWizard;
