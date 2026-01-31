// src/pages/StudentAttendance.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import AttendanceNav from "../components/AttendanceNav";
import attendanceIcon from "../icon/attendance.png";

function StudentAttendance() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  // ✅ READ-ONLY attendance cache (no apiUrl here)
  const [allAttendanceRecords, , loadingAttendance] = useLocalStorage(
    "schoolPortalAttendance",
    []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") {
      setLoggedInStudent(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  /* =========================
     FILTER STUDENT RECORDS
  ========================= */
  const studentAttendance = useMemo(() => {
    if (!loggedInStudent) return [];

    const adm = loggedInStudent.admissionNo;

    return (allAttendanceRecords || [])
      .filter(
        (r) =>
          (r.admissionNo || r.studentId) === adm
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [loggedInStudent, allAttendanceRecords]);

  /* =========================
     SUMMARY
  ========================= */
  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;

    studentAttendance.forEach((r) => {
      const st = r.status || r.attendanceStatus;
      if (st === "Present") present++;
      else if (st === "Absent") absent++;
      else if (st === "Late") late++;
    });

    const totalRecords = studentAttendance.length;
    const percentage = totalRecords
      ? ((present / totalRecords) * 100).toFixed(2)
      : 0;

    return {
      present,
      absent,
      late,
      totalRecords,
      percentage,
    };
  }, [studentAttendance]);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalOpen(true);
  };

  if (!loggedInStudent || loadingAttendance) {
    return <div className="content-section">Loading attendance…</div>;
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
        <img
          src={attendanceIcon}
          alt=""
          style={{ width: 30, marginRight: 8 }}
        />
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
            {studentAttendance.length ? (
              studentAttendance.map((r, idx) => (
                <tr key={r._id || r.id || idx}>
                  <td>{r.date}</td>
                  <td>{r.class}</td>
                  <td>{r.status}</td>
                  <td>{r.markedBy || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No attendance records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={() =>
          showAlert("Attendance updates automatically when your teacher marks it.")
        }
        className="logout-button"
      >
        Info
      </button>
    </div>
  );
}

export default StudentAttendance;
