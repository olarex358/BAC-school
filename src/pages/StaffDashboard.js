import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container">
        <aside className="sidebar">
          <h2>Busarialao College</h2>
          <ul>
            <li><button className="link-btn" onClick={() => navigate("/staff-dashboard")}>Dashboard</button></li>
            <li><button className="link-btn" onClick={() => navigate("/mark-attendance")}>Mark Attendance</button></li>
            <li><button className="link-btn" onClick={() => navigate("/results-management")}>Results Management</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-subjects")}>My Subjects</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-timetable")}>Timetable</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-calendar")}>Calendar</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-mails")}>Messages</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-password-change")}>Change Password</button></li>
            <li><button className="link-btn" onClick={() => navigate("/staff-profile")}>Profile</button></li>
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
          <h1>Staff Dashboard</h1>
          <h2>Welcome, {user?.username || "Staff"}</h2>

          <div className="cards-container dashboard-grid">
            <div className="card" onClick={() => navigate("/mark-attendance")}>
              Mark Attendance
            </div>

            <div className="card" onClick={() => navigate("/results-management")}>
              Results Management
            </div>

            <div className="card" onClick={() => navigate("/staff-subjects")}>
              My Subjects
            </div>

            <div className="card" onClick={() => navigate("/staff-timetable")}>
              Timetable
            </div>

            <div className="card" onClick={() => navigate("/staff-calendar")}>
              Calendar
            </div>

            <div className="card" onClick={() => navigate("/staff-mails")}>
              Messages
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
