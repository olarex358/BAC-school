import React from "react";
import { useParams } from "react-router-dom";
import { exportPaymentsToCSV } from "./exportPayments";
import "./AccountantDashboard.css";

function PaymentReceipt() {
  const { reference } = useParams();

  // 🔹 PAYSTACK PAYMENTS (AUTO-VERIFIED)
  const paystackPayments =
    JSON.parse(localStorage.getItem("schoolPortalPayments")) || [];

  // 🔹 MANUAL PAYMENTS (ACCOUNTANT APPROVED)
  const manualPayments =
    JSON.parse(localStorage.getItem("schoolPortalPaymentRequests")) || [];

  // 🔍 Try to find Paystack payment by reference
  let payment = paystackPayments.find(p => p.reference === reference);
  let source = "paystack";

  // 🔍 If not Paystack, try Manual by id/reference
  if (!payment) {
    payment = manualPayments.find(
      p =>
        String(p.id) === String(reference) ||
        String(p.reference) === String(reference)
    );
    source = "manual";
  }

  // ❌ Not found
  if (!payment) {
    return (
      <div className="content-section">
        <h2>Payment Receipt</h2>
        <p>Receipt not found.</p>
      </div>
    );
  }

  // 🔒 Manual receipt must be approved
  if (source === "manual" && payment.status !== "Approved") {
    return (
      <div className="content-section">
        <h2>Payment Receipt</h2>
        <p>This manual payment has not been approved yet.</p>
      </div>
    );
  }

  return (
    <div className="receipt">
      <h2>BAC School – Payment Receipt</h2>

      <hr />

      <p>
        <strong>Payment Type:</strong>{" "}
        {source === "paystack" ? "Online (Paystack)" : "Manual"}
      </p>

      <p>
        <strong>Reference:</strong>{" "}
        {payment.reference || payment.id || "—"}
      </p>

      <p>
        <strong>Payer / Student:</strong>{" "}
        {payment.payerName || payment.studentId || "—"}
      </p>

      <p>
        <strong>Purpose:</strong>{" "}
        {payment.purpose || "School Fee"}
      </p>

      <p>
        <strong>Amount:</strong> ₦
        {Number(payment.amount || 0).toLocaleString()}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {payment.status === "success"
          ? "Successful"
          : payment.status}
      </p>

      {payment.session && (
        <p>
          <strong>Session:</strong> {payment.session}
        </p>
      )}

      {payment.term && (
        <p>
          <strong>Term:</strong> {payment.term}
        </p>
      )}

      <p>
        <strong>Date:</strong>{" "}
        {new Date(
          payment.createdAt || payment.timestamp || Date.now()
        ).toLocaleString()}
      </p>

      <hr />

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => window.print()}>
          Print Receipt
        </button>

        <button
          style={{ marginLeft: "10px" }}
          onClick={exportPaymentsToCSV}
        >
          Export Payments (CSV)
        </button>
      </div>
    </div>
  );
}

export default PaymentReceipt;
