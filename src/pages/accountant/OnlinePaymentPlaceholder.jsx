import React from "react";
import "./AccountantDashboard.css";

export default function OnlinePaymentPlaceholder() {
  return (
    <div className="content-section">
      <h2>Online Payments</h2>

      <div className="card">
        <p>
          Online payments via <strong>Paystack</strong> are not yet
          activated.
        </p>
        <p>
          Once the school completes Paystack registration, this section
          will automatically activate.
        </p>
      </div>

      <div className="card">
        <p><strong>Status:</strong> Not Connected</p>
        <p><strong>Gateway:</strong> Paystack</p>
      </div>
    </div>
  );
}
