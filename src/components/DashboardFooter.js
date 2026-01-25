import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api from "../api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔐 LOGIN ATTEMPT");
    console.log("Username:", username);

    try {
      const res = await api.post("/api/auth/login", {
        username,
        password,
      });

      console.log("✅ Response status:", res.status);
      console.log("📦 Response body:", res.data);

      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error("Missing token or user");
      }

      console.log("✅ Login successful. Saving auth state...");
      login(token, user);
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔁 Redirect ONLY AFTER auth state updates
   */
  useEffect(() => {
    if (!token || !user) return;

    const type = user.type?.toLowerCase();
    console.log("➡️ Redirecting by type:", type);

    if (user.needsActivation) {
      navigate("/activate-account", { replace: true });
      return;
    }

    switch (type) {
      case "admin":
        navigate("/dashboard", { replace: true });
        break;
      case "staff":
        navigate("/staff-dashboard", { replace: true });
        break;
      case "student":
        navigate("/student-dashboard", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
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
};

export default LoginPage;
