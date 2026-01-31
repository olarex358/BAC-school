import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";

const norm = (v) => String(v ?? "").trim();

function normalizeFee(rec) {
  // Support both shapes:
  // AdminFeesManagement creates: { className, feeName, amount, session, term, dueDate, note, status }
  // Older student page expects: { feeType, notes, studentId, isGeneralFee }
  return {
    ...rec,
    _id: rec._id || rec.id,
    feeType: rec.feeType || rec.feeName || rec.name || "School Fees",
    notes: rec.notes || rec.note || "",
    studentId: rec.studentId || rec.admissionNo || rec.studentAdmissionNo || "",
    isGeneralFee: !!rec.isGeneralFee, // if not provided, stays false
    className: rec.className || rec.class || "",
    dueDate: rec.dueDate || "",
    status: rec.status || "Unpaid", // Paid | Unpaid (fallback)
    amount: Number(rec.amount || 0),
    session: rec.session || "",
    term: rec.term || "",
  };
}

function StudentFees() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  // ✅ remove localhost; read from backend when online, keep local cache always
  const [allFeeRecords, , loadingFees] = useLocalStorage(
    "schoolPortalFeeRecords",
    [],
    "/api/schoolPortalFeeRecords"
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") {
      setLoggedInStudent(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const normalizedFees = useMemo(() => {
    return (allFeeRecords || []).map(normalizeFee);
  }, [allFeeRecords]);

  const studentFeeRecords = useMemo(() => {
    if (!loggedInStudent) return [];

    const adm = norm(loggedInStudent.admissionNo);
    const myClass = norm(loggedInStudent.studentClass);

    return normalizedFees.filter((rec) => {
      // v0.1 rule:
      // - show class-based fees for the student's class (most realistic)
      // - OR explicit student-specific fees (studentId/admissionNo match)
      const classMatch = myClass && norm(rec.className) === myClass;
      const studentMatch = adm && norm(rec.studentId) === adm;
      const generalMatch = rec.isGeneralFee === true; // support legacy "general fee"

      return classMatch || studentMatch || generalMatch;
    });
  }, [normalizedFees, loggedInStudent]);

  const totals = useMemo(() => {
    const totalDue = studentFeeRecords.reduce((sum, rec) => sum + Number(rec.amount || 0), 0);

    const paidRecords = studentFeeRecords.filter((rec) =>
      String(rec.status || "").toLowerCase() === "paid"
    );

    const totalPaid = paidRecords.reduce((sum, rec) => sum + Number(rec.amount || 0), 0);

    return {
      totalDue,
      totalPaid,
      outstandingBalance: totalDue - totalPaid,
    };
  }, [studentFeeRecords]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    navigate("/home");
  };

  const handlePrintInvoice = () => {
    if (!loggedInStudent) return;

    if (totals.outstandingBalance <= 0) {
      showAlert("No outstanding balance. An invoice cannot be generated.");
      return;
    }

    // v0.1: keep it simple (console + modal)
    const invoiceContent = `
--- INVOICE ---
Student: ${loggedInStudent.firstName} ${loggedInStudent.lastName}
Admission No: ${loggedInStudent.admissionNo}
Class: ${loggedInStudent.studentClass || "-"}
Total Due: ₦${totals.totalDue.toLocaleString()}
Total Paid: ₦${totals.totalPaid.toLocaleString()}
Outstanding Balance: ₦${totals.outstandingBalance.toLocaleString()}

Details:
${studentFeeRecords
  .map(
    (rec) => `
- Fee Type: ${rec.feeType}
- Amount: ₦${Number(rec.amount || 0).toLocaleString()}
- Due Date: ${rec.dueDate || "-"}
- Status: ${rec.status || "-"}
`
  )
  .join("")}

---
Please contact the bursary for payment.
`;
    console.log("Invoice print (simulated):", invoiceContent);
    showAlert("Invoice generated (simulated).");
  };

  if (!loggedInStudent || loadingFees) {
    return <div className="content-section">Loading fee details...</div>;
  }

  const statusColorClass =
    totals.outstandingBalance > 0 ? "status-red" : "status-green";
  const statusText =
    totals.outstandingBalance > 0 ? "Outstanding" : "Paid in Full";
  const totalPaidColorClass = totals.totalPaid > 0 ? "status-green" : "status-gray";

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />

      <h1>My Fees & Payment History</h1>
      <p>
        Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here is an
        overview of your school fees:
      </p>

      <div className="fees-summary-card">
        <div className="summary-item">
          <h3 className="summary-title">Total Due:</h3>
          <p className="summary-value">₦{totals.totalDue.toLocaleString()}</p>
        </div>
        <div className="summary-item">
          <h3 className="summary-title">Total Paid:</h3>
          <p className={`summary-value ${totalPaidColorClass}`}>
            ₦{totals.totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="summary-item">
          <h3 className="summary-title">Outstanding Balance:</h3>
          <p className={`summary-value ${statusColorClass}`}>
            ₦{totals.outstandingBalance.toLocaleString()}
          </p>
          <small style={{ opacity: 0.8 }}>{statusText}</small>
        </div>
      </div>

      <div className="sub-section">
        <h2>Fee Records</h2>
        {studentFeeRecords.length > 0 ? (
          <div className="table-container">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {studentFeeRecords.map((rec, index) => (
                  <tr key={rec._id || index} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                    <td>{rec.feeType}</td>
                    <td>₦{Number(rec.amount || 0).toLocaleString()}</td>
                    <td>{rec.dueDate || "-"}</td>
                    <td className={`status-cell status-${String(rec.status || "unpaid").toLowerCase()}`}>
                      {rec.status || "Unpaid"}
                    </td>
                    <td>{rec.notes || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No fee records found for you.</p>
        )}
      </div>

      <button onClick={handlePrintInvoice} className="print-button">
        Print Outstanding Invoice
      </button>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StudentFees;
