import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container">
        <aside className="sidebar">
          <h2>Busarialao College</h2>
          <ul>
            <li><button className="link-btn" onClick={() => navigate("/student-dashboard")}>Dashboard</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-profile")}>Profile</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-results")}>Results</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-attendance")}>Attendance</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-subjects")}>Subjects</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-timetable")}>Timetable</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-syllabus")}>Syllabus</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-digital-library")}>Digital Library</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-fees")}>Fees</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-calendar")}>Calendar</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-mails")}>Messages</button></li>
            <li><button className="link-btn" onClick={() => navigate("/student-password-change")}>Change Password</button></li>
          </ul>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </aside>

        <div className="main-content">
          <h1>Student Dashboard</h1>
          <h2>Welcome, {user?.username || "Student"}</h2>

          <div className="cards-container dashboard-grid">
            <div className="card" onClick={() => navigate("/student-results")}>
              View Results
            </div>

            <div className="card" onClick={() => navigate("/student-attendance")}>
              Attendance
            </div>

            <div className="card" onClick={() => navigate("/student-timetable")}>
              Timetable
            </div>

            <div className="card" onClick={() => navigate("/student-syllabus")}>
              Syllabus
            </div>

            <div className="card" onClick={() => navigate("/student-digital-library")}>
              Digital Library
            </div>

            <div className="card" onClick={() => navigate("/student-fees")}>
              Fees / Payments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
