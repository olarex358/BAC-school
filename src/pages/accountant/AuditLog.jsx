import React, { useEffect, useState } from "react";
import SessionTermSelector from "../../components/SessionTermSelector";
import { getCurrentAcademicPeriod } from "../../utils/academicPeriod";
import "./AccountantDashboard.css";

function AuditLog() {
  const [audit, setAudit] = useState([]);
  const [period, setPeriod] = useState(getCurrentAcademicPeriod());
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const data =
      JSON.parse(localStorage.getItem("schoolPortalPaymentAudit")) || [];
    setAudit(data);
  }, []);

  // 🔹 FILTER: MANUAL PAYMENTS ONLY
  const filteredAudit = audit.filter(a => {
    const p = a.payment || {};

    // Ignore Paystack records completely
    if (p.channel === "paystack") return false;

    if (period.session && p.session && p.session !== period.session) return false;
    if (period.term && p.term && p.term !== period.term) return false;

    if (actionFilter && a.action !== actionFilter) return false;

    return true;
  });

  const exportCSV = () => {
    if (!filteredAudit.length) {
      alert("No audit records to export");
      return;
    }

    const rows = [
      ["Action", "Actor", "Student", "Amount", "Session", "Term", "Date"],
      ...filteredAudit.map(a => [
        a.action,
        a.actor,
        a.payment?.studentId || "",
        a.payment?.amount || "",
        a.payment?.session || "",
        a.payment?.term || "",
        new Date(a.timestamp).toLocaleString()
      ])
    ];

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "manual-payment-audit.csv";
    a.click();
  };

  return (
    <div className="content-section">
      <h2>Audit Log (Manual Payments)</h2>

      <SessionTermSelector value={period} onChange={setPeriod} />

      <select
        value={actionFilter}
        onChange={e => setActionFilter(e.target.value)}
      >
        <option value="">All Actions</option>
        <option value="APPROVED_PAYMENT">Approved</option>
        <option value="REJECTED_PAYMENT">Rejected</option>
        <option value="REVERSED_PAYMENT">Reversed</option>
      </select>

      <button onClick={exportCSV}>Export CSV</button>

      {filteredAudit.length === 0 ? (
        <p>No audit records found.</p>
      ) : (
        filteredAudit
          .slice()
          .reverse()
          .map((a, i) => (
            <div key={i} className="card">
              <p>
                <strong>{a.action}</strong> by {a.actor}
              </p>
              <p>
                Student: {a.payment?.studentId || "—"} | Amount: ₦
                {Number(a.payment?.amount || 0).toLocaleString()}
              </p>
              <p>{new Date(a.timestamp).toLocaleString()}</p>
            </div>
          ))
      )}
    </div>
  );
}

export default AuditLog;
