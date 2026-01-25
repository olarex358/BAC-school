import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../api";

function ActivateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, userType } = location.state || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!username) {
    return (
      <div>
        <h2>Invalid activation access</h2>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  const handleActivate = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/activate-account", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Activation failed");
        return;
      }

      // ✅ IMPORTANT: DO NOT LOG IN HERE
      // Backend does not issue token on activation
      // User must login again

      navigate("/login", { replace: true });

    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activation-container">
      <h2>One-Time Account Setup</h2>
      <p>{userType} — {username}</p>

      <form onSubmit={handleActivate}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Activating..." : "Activate Account"}
        </button>
      </form>
    </div>
  );
}

export default ActivateAccount;
