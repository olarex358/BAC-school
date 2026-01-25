import React from "react";
import { useNavigate } from "react-router-dom";
import "./AccountantDashboard.css";

function AccountantDashboard() {
  const navigate = useNavigate();

  const paystack =
    JSON.parse(localStorage.getItem("schoolPortalPayments")) || [];

  const manual =
    JSON.parse(localStorage.getItem("schoolPortalPaymentRequests")) || [];

  const paystackTotal = paystack
    .filter(p => p.status === "success")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const manualTotal = manual
    .filter(p => p.status === "Approved")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const total = paystackTotal + manualTotal;

  return (
    <div className="content-section">
      <h1>Accountant Dashboard</h1>

      <div className="stats-grid">
        <div className="card">
          <h3>Total Received</h3>
          <p>₦{total.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Manual Payments</h3>
          <p>₦{manualTotal.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Online Payments</h3>
          <p>₦{paystackTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => navigate("/accountant/payments")}>
          Payments
        </button>

        <button onClick={() => navigate("/accountant/online")}>
          Online Payments
        </button>

        <button onClick={() => navigate("/accountant/charts")}>
          Finance Charts
        </button>

        <button onClick={() => navigate("/accountant/audit")}>
          Audit Log
        </button>
      </div>
    </div>
  );
}

export default AccountantDashboard;
