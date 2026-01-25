import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AccountantDashboard.css";

function AccountantPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // 🔹 PAYSTACK PAYMENTS (may be empty for now)
    const paystack =
      JSON.parse(localStorage.getItem("schoolPortalPayments")) || [];

    // 🔹 MANUAL PAYMENTS
    const manual =
      JSON.parse(localStorage.getItem("schoolPortalPaymentRequests")) || [];

    // 🔹 NORMALIZE BOTH INTO ONE TABLE VIEW
    const normalized = [
      ...paystack.map(p => ({
        id: p.reference,
        date: p.createdAt,
        name: p.payerName,
        purpose: p.purpose || "School Payment",
        amount: p.amount,
        status: p.status === "success" ? "Approved" : p.status,
        source: "Online (Paystack)",
        reference: p.reference
      })),

      ...manual.map(p => ({
        id: p.id,
        date: p.createdAt,
        name: p.studentId,
        purpose: "Manual Payment",
        amount: p.amount,
        status: p.status,
        source: "Manual",
        reference: p.id
      }))
    ];

    // 🔹 Sort newest first
    normalized.sort((a, b) => (b.date || 0) - (a.date || 0));

    setPayments(normalized);
  }, []);

  return (
    <div className="content-section">
      <h2>Payments</h2>

      {payments.length === 0 ? (
        <p>No payment records found.</p>
      ) : (
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name / Student</th>
              <th>Purpose</th>
              <th>Amount (₦)</th>
              <th>Status</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map(p => (
              <tr key={`${p.source}-${p.id}`}>
                <td>
                  {p.date
                    ? new Date(p.date).toLocaleDateString()
                    : "—"}
                </td>
                <td>{p.name}</td>
                <td>{p.purpose}</td>
                <td>{Number(p.amount || 0).toLocaleString()}</td>
                <td>{p.status}</td>
                <td>{p.source}</td>
                <td>
                  <button
                    onClick={() =>
                      navigate(`/accountant/receipt/${p.reference}`)
                    }
                  >
                    View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AccountantPayments;
