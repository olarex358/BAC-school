import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://school-portal-backend-i29s.onrender.com";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, token, user } = useAuth();

  /* ==========================
     🔒 BLOCK LOGIN IF ALREADY AUTHED
  ========================== */
  useEffect(() => {
    if (token && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, user, navigate]);

  /* ==========================
     🔐 HANDLE LOGIN
  ========================== */
  const handleLogin = async (e) => {
    e.preventDefault();

    // HARD STOP double submit
    if (loading) return;

    setError("");
    setLoading(true);

    console.group("🔐 LOGIN ATTEMPT");
    console.log("Username:", username);

    try {
      console.log("➡️ Sending login request (NO auth header)");

      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("⬅️ Response status:", res.status);

      const data = await res.json();
      console.log("📦 Response body:", data);

      if (!res.ok) {
        console.error("❌ Login failed");
        setError(data.message || "Invalid login details");
        console.groupEnd();
        setLoading(false);
        return;
      }

      // 🚨 DEFENSIVE CHECK (VERY IMPORTANT)
      if (!data.user) {
        console.error("❌ Backend returned no user object", data);
        setError("Account data error. Please contact admin.");
        console.groupEnd();
        setLoading(false);
        return;
      }

      // ✅ SAVE AUTH STATE
      console.log("✅ Login successful. Saving auth state...");
      login(data.token, data.user);

      // 🔑 FORCE ACTIVATION
      if (data.user.needsActivation) {
        console.warn("🟡 Needs activation → redirecting");
        console.groupEnd();
        navigate("/activate-account", { replace: true });
        return;
      }

      // ✅ ROLE NORMALIZATION
      const role =
        data.user.type?.toLowerCase() ||
        data.user.role?.toLowerCase() ||
        "";

      console.log("➡️ Redirecting by role:", role);
      console.groupEnd();

      switch (role) {
        case "admin":
        case "super admin":
          navigate("/dashboard", { replace: true });
          break;

        case "student":
          navigate("/student-dashboard", { replace: true });
          break;

        case "teacher":
        case "class teacher":
        case "staff":
          navigate("/staff-dashboard", { replace: true });
          break;

        case "accountant":
          navigate("/accountant-dashboard", { replace: true });
          break;

        default:
          console.warn("⚠️ Unknown role, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("🔥 LOGIN EXCEPTION:", err);
      setError("Network error. Please try again.");
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     🧾 UI
  ========================== */
  return (
    <div className="login-page">
      <div className="login-form">
        <h2>Login</h2>

        <form
          onSubmit={(e) => {
            if (loading) return;
            handleLogin(e);
          }}
        >
          <input
            type="text"
            placeholder="Admission No / Staff ID"
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

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
