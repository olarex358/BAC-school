import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

function ActivateAccount() {
  const navigate = useNavigate();
  const { token, user, login, logout } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const canAccess = useMemo(() => !!token && !!user, [token, user]);

  const isActivated = useMemo(() => {
    if (user?.isActivated === true) return true;
    if (user?.needsActivation === false) return true;
    return false;
  }, [user]);

  const userType = useMemo(() => {
    const t = String(user?.type || "").toLowerCase();
    if (t) return t;

    const r = String(user?.role || "").toLowerCase();
    if (r.includes("admin")) return "admin";
    if (r.includes("staff") || r.includes("teacher")) return "staff";
    if (r.includes("student")) return "student";
    if (r.includes("accountant")) return "accountant";
    return "staff";
  }, [user]);

  const goDashboard = () => {
    if (userType === "admin") return navigate("/dashboard");
    if (userType === "staff") return navigate("/staff-dashboard");
    if (userType === "student") return navigate("/student-dashboard");
    if (userType === "accountant") return navigate("/accountant-dashboard");
    navigate("/dashboard");
  };

  if (canAccess && isActivated) {
    return (
      <div className="content-section">
        <h2>Account already activated</h2>
        <button onClick={goDashboard}>Go to Dashboard</button>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="content-section">
        <h2>Invalid activation access</h2>
        <p>Please login with default password first.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  const handleActivate = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 4) {
      return setMsg({ type: "error", text: "Password too short" });
    }

    if (newPassword !== confirmPassword) {
      return setMsg({ type: "error", text: "Passwords do not match" });
    }

    const identifier =
      user?.staffId ||
      user?.admissionNo ||
      user?.username;

    if (!identifier) {
      return setMsg({ type: "error", text: "Missing user identifier" });
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/activate-account", {
        method: "POST",
        body: JSON.stringify({
          username: identifier,
          userType,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Activation failed");
      }

      if (data.token && data.user) {
        login(data.token, data.user);
        setMsg({ type: "success", text: "Account activated!" });
        setTimeout(goDashboard, 800);
      } else {
        setMsg({
          type: "success",
          text: "Activated. Please login again.",
        });
        setTimeout(() => {
          logout();
          navigate("/login");
        }, 1200);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-section" style={{ maxWidth: 500 }}>
      <h2>Activate Account</h2>

      {msg && (
        <div
          style={{
            padding: 10,
            marginBottom: 10,
            color: "#fff",
            background: msg.type === "success" ? "#16a34a" : "#dc2626",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleActivate}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? "Activating..." : "Activate"}
        </button>

        <button
          type="button"
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

export default ActivateAccount;
