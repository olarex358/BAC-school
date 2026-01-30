// src/pages/StudentAttendance.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import AttendanceNav from "../components/AttendanceNav";
import attendanceIcon from "../icon/attendance.png";

function StudentAttendance() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  const [allAttendanceRecords, , loadingAttendance] = useLocalStorage(
    "schoolPortalAttendance",
    [],
    "http://localhost:5000/api/schoolPortalAttendance"
  );

  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalRecords: 0,
    percentage: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") setLoggedInStudent(user);
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!loggedInStudent) return;

    const adm = loggedInStudent.admissionNo;

    const filteredRecords = (allAttendanceRecords || [])
      .filter((record) => (record.admissionNo || record.studentId) === adm)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setStudentAttendance(filteredRecords);

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    filteredRecords.forEach((record) => {
      const st = record.status || record.attendanceStatus;
      if (st === "Present") presentCount++;
      else if (st === "Absent") absentCount++;
      else if (st === "Late") lateCount++;
    });

    const totalRecords = filteredRecords.length;
    const percentage = totalRecords ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

    setAttendanceSummary({
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      totalRecords,
      percentage,
    });
  }, [loggedInStudent, allAttendanceRecords]);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalOpen(true);
  };

  if (!loggedInStudent || loadingAttendance) {
    return <div className="content-section">Loading attendance...</div>;
  }

  return (
    <div className="content-section">
      <AttendanceNav />

      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        isAlert
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      />

      <h1>
        <img src={attendanceIcon} alt="" style={{ width: 30, marginRight: 8 }} />
        My Attendance
      </h1>

      <div className="results-summary-card">
        <div className="summary-item">
          <h3>Total Records</h3>
          <p>{attendanceSummary.totalRecords}</p>
        </div>
        <div className="summary-item">
          <h3>Present</h3>
          <p>{attendanceSummary.present}</p>
        </div>
        <div className="summary-item">
          <h3>Absent</h3>
          <p>{attendanceSummary.absent}</p>
        </div>
        <div className="summary-item">
          <h3>Late</h3>
          <p>{attendanceSummary.late}</p>
        </div>
        <div className="summary-item">
          <h3>Attendance %</h3>
          <p>{attendanceSummary.percentage}%</p>
        </div>
      </div>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Status</th>
              <th>Marked By</th>
            </tr>
          </thead>
          <tbody>
            {studentAttendance.map((r, idx) => (
              <tr key={r._id || r.id || idx}>
                <td>{r.date}</td>
                <td>{r.class || r.classSelect}</td>
                <td>{r.status || r.attendanceStatus}</td>
                <td>{r.markedBy || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => showAlert("Attendance is updated automatically.")} className="logout-button">
        Info
      </button>
    </div>
  );
}

export default StudentAttendance;
