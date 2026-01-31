import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import passwordIcon from "../icon/password.png";
import { apiFetch } from "../api";

function StaffPasswordChange() {
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "staff") {
      setLoggedInStaff(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const validateForm = () => {
    const errors = {};
    if (newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters.";
    }
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateForm()) {
      showAlert("Please correct the errors in the form.");
      return;
    }

    try {
      const res = await apiFetch("/api/change-password", {
        method: "POST",
        body: JSON.stringify({
          userId: loggedInStaff._id,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showAlert(data.message || "Password change failed.");
        return;
      }

      showAlert("Password changed successfully! You will be logged out.");

      setTimeout(() => {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("authToken");
        navigate("/login");
      }, 1500);
    } catch {
      showAlert("Network error. Please try again.");
    }
  };

  if (!loggedInStaff) {
    return <div className="content-section">Loading...</div>;
  }

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert
      />

      <h1>Change Password (Staff)</h1>
      <p>
        Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}
      </p>

      <form onSubmit={handlePasswordChange} className="password-change-form">
        <div style={{ textAlign: "center" }}>
          <img src={passwordIcon} alt="" width="80" />
        </div>

        <input
          type="password"
          placeholder="Old password"
          required
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {formErrors.newPassword && (
          <p className="error">{formErrors.newPassword}</p>
        )}

        <input
          type="password"
          placeholder="Confirm new password"
          required
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
        {formErrors.confirmNewPassword && (
          <p className="error">{formErrors.confirmNewPassword}</p>
        )}

        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default StaffPasswordChange;
