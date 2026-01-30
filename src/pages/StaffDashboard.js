// src/pages/StaffDashboard.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Icons
import profileIcon from "../icon/profile.png";
import resultsInputIcon from "../icon/attendance.png";
import viewReportsIcon from "../icon/result.png";
import subjectIcon from "../icon/subject.png";
import calendarIcon from "../icon/calender.png";
import mailsIcon from "../icon/mails.png";
import passwordIcon from "../icon/password.png";
import attendanceIcon from "../icon/attendance.png";
import timetableIcon from "../icon/calender.png";
import libraryIcon from "../icon/library.png";

function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="content-section">Loading staff dashboard...</div>;
  }

  const role = user.role || "";

  const hasRole = (r) => role.includes(r);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Busarialao College</h2>

        <ul>
          <li><Link to="/staff-profile">My Profile</Link></li>

          {(hasRole("Teacher") || hasRole("Results Manager")) && (
            <li><Link to="/results-management">Input Results</Link></li>
          )}

          {(hasRole("Teacher") || hasRole("View Reports")) && (
            <li><Link to="/view-reports">View Reports</Link></li>
          )}

          {hasRole("Teacher") && (
            <li><Link to="/mark-attendance">Mark Attendance</Link></li>
          )}

          <li><Link to="/staff-subjects">My Subjects</Link></li>
          <li><Link to="/staff-calendar">School Calendar</Link></li>
          <li><Link to="/staff-mails">Internal Mails</Link></li>
          <li><Link to="/staff-timetable">My Timetable</Link></li>
          <li><Link to="/staff-digital-library">Digital Library</Link></li>
          <li><Link to="/staff-password-change">Change Password</Link></li>
        </ul>

        <button onClick={handleLogout}>Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="top-nav">
          <h2>Staff Dashboard</h2>

          <div className="user-profile">
            <h2>
              Welcome, {user.firstname || user.username} {user.surname || ""}
            </h2>
            <p>
              <strong>Role:</strong> <span>{role}</span>
            </p>
          </div>
        </header>

        {/* CARDS */}
        <div className="cards-container">
          <div className="card" onClick={() => navigate("/staff-profile")}>
            <img src={profileIcon} alt="" />
            My Profile
          </div>

          {(hasRole("Teacher") || hasRole("Results Manager")) && (
            <div className="card" onClick={() => navigate("/results-management")}>
              <img src={resultsInputIcon} alt="" />
              Input Results
            </div>
          )}

          {(hasRole("Teacher") || hasRole("View Reports")) && (
            <div className="card" onClick={() => navigate("/view-reports")}>
              <img src={viewReportsIcon} alt="" />
              View Reports
            </div>
          )}

          {hasRole("Teacher") && (
            <div className="card" onClick={() => navigate("/mark-attendance")}>
              <img src={attendanceIcon} alt="" />
              Mark Attendance
            </div>
          )}

          <div className="card" onClick={() => navigate("/staff-subjects")}>
            <img src={subjectIcon} alt="" />
            My Subjects
          </div>

          <div className="card" onClick={() => navigate("/staff-calendar")}>
            <img src={calendarIcon} alt="" />
            School Calendar
          </div>

          <div className="card" onClick={() => navigate("/staff-mails")}>
            <img src={mailsIcon} alt="" />
            Internal Mails
          </div>

          <div className="card" onClick={() => navigate("/staff-timetable")}>
            <img src={timetableIcon} alt="" />
            My Timetable
          </div>

          <div className="card" onClick={() => navigate("/staff-digital-library")}>
            <img src={libraryIcon} alt="" />
            Digital Library
          </div>

          <div className="card" onClick={() => navigate("/staff-password-change")}>
            <img src={passwordIcon} alt="" />
            Change Password
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
