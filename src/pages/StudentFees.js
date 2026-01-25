// src/pages/StudentFees.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function StudentFees() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  // Data from localStorage
  const [allFeeRecords, , loadingFees] = useLocalStorage('schoolPortalFeeRecords', [], 'http://localhost:5000/api/schoolPortalFeeRecords');

  // State for calculated stats
  const [studentFeeRecords, setStudentFeeRecords] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  // Effect to check if user is a student
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'student') {
      setLoggedInStudent(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Effect to filter and calculate fees when data changes
  useEffect(() => {
    if (loggedInStudent && allFeeRecords.length > 0) {
      const studentRecords = allFeeRecords.filter(rec =>
        rec.isGeneralFee || rec.studentId === loggedInStudent.admissionNo
      );
      setStudentFeeRecords(studentRecords);

      const totalDueAmount = studentRecords.reduce((sum, rec) => sum + rec.amount, 0);
      setTotalDue(totalDueAmount);

      const paidRecords = studentRecords.filter(rec => rec.status === 'Paid');
      const totalPaidAmount = paidRecords.reduce((sum, rec) => sum + rec.amount, 0);
      setTotalPaid(totalPaidAmount);

      setOutstandingBalance(totalDueAmount - totalPaidAmount);
    } else {
      setStudentFeeRecords([]);
      setTotalDue(0);
      setTotalPaid(0);
      setOutstandingBalance(0);
    }
  }, [loggedInStudent, allFeeRecords]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  const handlePrintInvoice = () => {
    if (outstandingBalance <= 0) {
      showAlert('No outstanding balance. An invoice cannot be generated.');
      return;
    }
    const invoiceContent = `
      --- INVOICE ---
      Student: ${loggedInStudent.firstName} ${loggedInStudent.lastName}
      Admission No: ${loggedInStudent.admissionNo}
      Total Due: ₦${totalDue.toLocaleString()}
      Total Paid: ₦${totalPaid.toLocaleString()}
      Outstanding Balance: ₦${outstandingBalance.toLocaleString()}
      
      Details:
      ${studentFeeRecords.map(rec => `
        - Fee Type: ${rec.feeType}
        - Amount: ₦${rec.amount.toLocaleString()}
        - Due Date: ${rec.dueDate}
        - Status: ${rec.status}
      `).join('')}

      ---
      Please contact the bursary for payment.
    `;
    console.log("Simulating invoice print:", invoiceContent);
    showAlert('Invoice generated and sent to a virtual printer.');
  };

  if (!loggedInStudent || loadingFees) {
    return <div className="content-section">Loading fee details...</div>;
  }

  const statusColorClass = outstandingBalance > 0 ? 'status-red' : 'status-green';
  const statusText = outstandingBalance > 0 ? 'Outstanding' : 'Paid in Full';
  const totalPaidColorClass = totalPaid > 0 ? 'status-green' : 'status-gray';

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
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here is an overview of your school fees:</p>
      
      <div className="fees-summary-card">
        <div className="summary-item">
            <h3 className="summary-title">Total Due:</h3>
            <p className="summary-value">₦{totalDue.toLocaleString()}</p>
        </div>
        <div className="summary-item">
            <h3 className="summary-title">Total Paid:</h3>
            <p className={`summary-value ${totalPaidColorClass}`}>₦{totalPaid.toLocaleString()}</p>
        </div>
        <div className="summary-item">
            <h3 className="summary-title">Outstanding Balance:</h3>
            <p className={`summary-value ${statusColorClass}`}>₦{outstandingBalance.toLocaleString()}</p>
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
                  <tr key={rec._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>{rec.feeType}</td>
                    <td>₦{rec.amount.toLocaleString()}</td>
                    <td>{rec.dueDate}</td>
                    <td className={`status-cell status-${rec.status.toLowerCase()}`}>{rec.status}</td>
                    <td>{rec.notes || 'N/A'}</td>
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

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentFees;
