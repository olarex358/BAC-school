import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../../hooks/useLocalStorage";
import "./AccountantDashboard.css";

function AccountantFeesManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [fees, setFees] = useLocalStorage("schoolPortalFeeRecords", []);
  const [payments, setPayments] = useLocalStorage("schoolPortalPaymentRequests", []);
  const [audit, setAudit] = useLocalStorage("schoolPortalPaymentAudit", []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!u) navigate("/login");
    else if (u.type !== "accountant") navigate("/unauthorized");
    else setUser(u);
  }, [navigate]);

  if (!user) return null;

  const approvePayment = (payment) => {
    if (payment.applied) return;

    setFees(prev =>
      prev.map(f => {
        if (f.studentId !== payment.studentId) return f;
        const paid = (f.paidAmount || 0) + payment.amount;
        return {
          ...f,
          paidAmount: paid,
          status: paid >= f.amount ? "Paid" : "Part-Paid"
        };
      })
    );

    setPayments(prev =>
      prev.map(p =>
        p === payment ? { ...p, status: "Approved", applied: true } : p
      )
    );

    setAudit(prev => [
      ...prev,
      {
        actor: user.username || user.name,
        action: "APPROVED_PAYMENT",
        payment,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const rejectPayment = (payment) => {
    setPayments(prev =>
      prev.map(p => (p === payment ? { ...p, status: "Rejected" } : p))
    );

    setAudit(prev => [
      ...prev,
      {
        actor: user.username || user.name,
        action: "REJECTED_PAYMENT",
        payment,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="content-section">
      <h2>Pending Payments</h2>

      {payments.filter(p => p.status === "Pending").map(p => (
        <div key={p.createdAt} className="card">
          <p><b>Student:</b> {p.studentId}</p>
          <p><b>Amount:</b> ₦{p.amount.toLocaleString()}</p>
          <p><b>Method:</b> {p.method}</p>
          <button onClick={() => approvePayment(p)}>Approve</button>
          <button onClick={() => rejectPayment(p)}>Reject</button>
        </div>
      ))}
    </div>
  );
}

export default AccountantFeesManagement;
