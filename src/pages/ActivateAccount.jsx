import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ActivateAccount() {
  const navigate = useNavigate();
  const { token, user, login, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const canAccess = useMemo(() => Boolean(token && user), [token, user]);

  const identifier = useMemo(() => {
    return user?.staffId || user?.admissionNo || user?.username;
  }, [user]);

  const goDashboard = () => {
    const t = String(user?.type || "").toLowerCase();
    if (t === "admin") return navigate("/dashboard");
    if (t === "staff") return navigate("/staff-dashboard");
    if (t === "student") return navigate("/student-dashboard");
    if (t === "accountant") return navigate("/accountant-dashboard");
    return navigate("/dashboard");
  };

  if (!canAccess) {
    return (
      <div className="content-section">
        <h2>Invalid activation access</h2>
        <p>Please login first.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (user?.isActivated === true && user?.needsActivation !== true) {
    return (
      <div className="content-section">
        <h2>Account already activated ✅</h2>
        <button onClick={goDashboard}>Go to Dashboard</button>
      </div>
    );
  }

  const handleActivate = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!identifier) return setMsg({ type: "error", text: "Missing identifier" });
    if (password.length < 4) return setMsg({ type: "error", text: "Password too short" });
    if (password !== confirm) return setMsg({ type: "error", text: "Passwords do not match" });

    setLoading(true);
    try {
      const res = await apiFetch("/api/activate-account", {
        method: "POST",
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Activation failed");
      }

      // If backend returned token+user (our server.js does), update session
      if (data.token && data.user) {
        login(data.token, data.user);
        setMsg({ type: "success", text: "Activated ✅ Redirecting..." });
        setTimeout(goDashboard, 700);
      } else {
        setMsg({ type: "success", text: "Activated ✅ Please login again." });
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 900);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Activation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-section" style={{ maxWidth: 520 }}>
      <h2>Activate Account</h2>
      <p style={{ color: "#666" }}>
        Welcome <b>{identifier}</b>. Set a new password.
      </p>

      {msg && (
        <div
          style={{
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            color: "#fff",
            background: msg.type === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleActivate} style={{ display: "grid", gap: 10 }}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button disabled={loading}>{loading ? "Activating..." : "Activate"}</button>

        <button
          type="button"
          style={{ background: "#6c757d" }}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Cancel & Login Again
        </button>
      </form>
    </div>
  );
}
