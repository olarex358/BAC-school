// src/pages/StudentAttendance.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


import attendanceIcon from '../icon/attendance.png';

function StudentAttendance() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  const [allAttendanceRecords, , loadingAttendance] = useLocalStorage('schoolPortalAttendance', [], 'http://localhost:5000/api/schoolPortalAttendance');
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalRecords: 0,
    percentage: 0
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'student') {
      setLoggedInStudent(user);
    } else {
      navigate('/home');
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInStudent && allAttendanceRecords.length > 0) {
      const filteredRecords = allAttendanceRecords.filter(
        record => record.studentId === loggedInStudent.admissionNo
      ).sort((a, b) => new Date(b.date) - new Date(a.date));

      setStudentAttendance(filteredRecords);

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      filteredRecords.forEach(record => {
        if (record.status === 'Present') {
          presentCount++;
        } else if (record.status === 'Absent') {
          absentCount++;
        } else if (record.status === 'Late') {
          lateCount++;
        }
      });

      const total = presentCount + absentCount + lateCount;
      const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

      setAttendanceSummary({
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        totalRecords: total,
        percentage: parseFloat(percentage)
      });
    } else {
        setStudentAttendance([]);
        setAttendanceSummary({
            present: 0,
            absent: 0,
            late: 0,
            totalRecords: 0,
            percentage: 0
        });
    }
  }, [loggedInStudent, allAttendanceRecords]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (!loggedInStudent || loadingAttendance) {
    return <div className="content-section">Loading attendance records...</div>;
  }

  const attendanceRateClass = attendanceSummary.percentage >= 80 ? 'rate-green' : attendanceSummary.percentage >= 60 ? 'rate-orange' : 'rate-red';

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Attendance Records</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here is your attendance overview:</p>

      <div className="attendance-summary-card">
        <div className="attendance-icon-container">
          <img src={attendanceIcon} alt="Attendance Icon" className="attendance-icon" />
        </div>
        <div className="attendance-summary-content">
          <h3>Attendance Summary</h3>
          <div className="summary-stats-grid">
            <div className="stat-item">
              <strong>Total Days:</strong> <span>{attendanceSummary.totalRecords}</span>
            </div>
            <div className="stat-item">
              <strong>Present:</strong> <span className="text-green-600">{attendanceSummary.present}</span>
            </div>
            <div className="stat-item">
              <strong>Absent:</strong> <span className="text-red-600">{attendanceSummary.absent}</span>
            </div>
            <div className="stat-item">
              <strong>Late:</strong> <span className="text-orange-600">{attendanceSummary.late}</span>
            </div>
          </div>
          <p className={`attendance-rate ${attendanceRateClass}`}>
            Attendance Rate: {attendanceSummary.percentage}%
          </p>
        </div>
      </div>

      <h2>Detailed Records</h2>
      {studentAttendance.length > 0 ? (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {studentAttendance.map((record, index) => (
                <tr key={record._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td>{record.date}</td>
                  <td>{record.class}</td>
                  <td className={`status-cell status-${record.status.toLowerCase()}`}>
                    {record.status}
                  </td>
                  <td>{record.markedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No attendance records found for you yet.</p>
      )}

      <p className="mt-4">
        For any discrepancies or detailed attendance breakdown by subject, please contact your class teacher.
      </p>
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentAttendance;
