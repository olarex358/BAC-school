import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const normalize = (v) => String(v || "").toLowerCase();

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goDashboard = (u) => {
    const type = normalize(u?.type);
    if (type === "admin") return navigate("/dashboard");
    if (type === "staff") return navigate("/staff-dashboard");
    if (type === "student") return navigate("/student-dashboard");
    if (type === "accountant") return navigate("/accountant-dashboard");
    return navigate("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid login response (missing token/user)");
      }

      login(data.token, data.user);

      if (data.user.needsActivation === true || data.user.isActivated === false) {
        navigate("/activate-account");
        return;
      }

      goDashboard(data.user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>

        {error ? <div className="error-box">{error}</div> : null}

        <input
          type="text"
          placeholder="Username (Admin / Staff ID / Admission No)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
