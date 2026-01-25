// src/pages/StudentPasswordChange.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import passwordIcon from "../icon/password.png";

function StudentPasswordChange() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") {
      setLoggedInStudent(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handlePasswordChange = async e => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loggedInStudent._id,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Password change failed.");
        return;
      }

      setMessage(
        "Password changed successfully! You will be logged out."
      );

      setTimeout(() => {
        localStorage.removeItem("loggedInUser");
        navigate("/login");
      }, 1500);
    } catch (err) {
      setMessage("Network error. Please try again.");
    }
  };

  if (!loggedInStudent) {
    return <div className="content-section">Loading...</div>;
  }

  return (
    <div className="content-section">
      <h1>Change Password</h1>
      <p>
        Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}
      </p>

      <form onSubmit={handlePasswordChange} style={{ maxWidth: 400 }}>
        <div style={{ textAlign: "center" }}>
          <img src={passwordIcon} alt="" width="80" />
        </div>

        <input
          type="password"
          placeholder="Old password"
          required
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New password"
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          required
          value={confirmNewPassword}
          onChange={e => setConfirmNewPassword(e.target.value)}
        />

        {message && (
          <p style={{ color: message.includes("success") ? "green" : "red" }}>
            {message}
          </p>
        )}

        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default StudentPasswordChange;
