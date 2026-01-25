import React, { useState } from "react";
import SessionTermSelector from "../../components/SessionTermSelector";
import { getCurrentAcademicPeriod } from "../../utils/academicPeriod";
import "./AccountantDashboard.css";

function FinanceChart() {
  // 🔹 Academic period filter
  const [period, setPeriod] = useState(getCurrentAcademicPeriod());

  // 🔹 PAYSTACK PAYMENTS (AUTO-VERIFIED)
  const paystackPayments =
    JSON.parse(localStorage.getItem("schoolPortalPayments")) || [];

  // 🔹 MANUAL PAYMENTS (ACCOUNTANT APPROVED)
  const manualPayments =
    JSON.parse(localStorage.getItem("schoolPortalPaymentRequests")) || [];

  // 🔹 FEES (FOR OUTSTANDING CALCULATION)
  const fees =
    JSON.parse(localStorage.getItem("schoolPortalFeeRecords")) || [];

  // 🔹 FILTER PAYMENTS BY PERIOD (IF AVAILABLE)
  const filteredPaystack = paystackPayments.filter(p => {
    if (period.session && p.session && p.session !== period.session) return false;
    if (period.term && p.term && p.term !== period.term) return false;
    return p.status === "success";
  });

  const filteredManual = manualPayments.filter(p => {
    if (period.session && p.session && p.session !== period.session) return false;
    if (period.term && p.term && p.term !== period.term) return false;
    return p.status === "Approved";
  });

  const filteredFees = fees.filter(f => {
    if (period.session && f.session !== period.session) return false;
    if (period.term && f.term !== period.term) return false;
    return true;
  });

  // 🔹 TOTALS
  const paystackTotal = filteredPaystack.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const manualTotal = filteredManual.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const totalPaid = paystackTotal + manualTotal;

  const totalFees = filteredFees.reduce(
    (sum, f) => sum + Number(f.amount || 0),
    0
  );

  const outstanding = Math.max(totalFees - totalPaid, 0);

  // 🔹 BAR SCALE
  const max = Math.max(totalPaid, outstanding, 1);

  return (
    <div className="content-section">
      <h2>Finance Overview</h2>

      <SessionTermSelector value={period} onChange={setPeriod} />

      <div className="bar paid" style={{ width: `${(totalPaid / max) * 100}%` }}>
        Paid (Paystack + Manual): ₦{totalPaid.toLocaleString()}
      </div>

      <div
        className="bar outstanding"
        style={{ width: `${(outstanding / max) * 100}%` }}
      >
        Outstanding: ₦{outstanding.toLocaleString()}
      </div>

      <div style={{ marginTop: "20px" }}>
        <p><strong>Breakdown:</strong></p>
        <p>• Paystack Paid: ₦{paystackTotal.toLocaleString()}</p>
        <p>• Manual Paid: ₦{manualTotal.toLocaleString()}</p>
        <p>• Total Fees: ₦{totalFees.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default FinanceChart;
