// src/pages/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Icons
import profileIcon from "../icon/profile.png";
import attendanceIcon from "../icon/attendance.png";
import subjectIcon from "../icon/subject.png";
import resultIcon from "../icon/result.png";
import calendarIcon from "../icon/calender.png";
import feesIcon from "../icon/fees.png";
import mailsIcon from "../icon/mails.png";
import passwordIcon from "../icon/password.png";
import timetableIcon from "../icon/calender.png";
import libraryIcon from "../icon/library.png";
import certificationIcon from "../icon/certification.png";
import { useAuth } from "../context/AuthContext";

function StudentDashboard() {
  const [studentInfo, setStudentInfo] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();


  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (loggedInUser && loggedInUser.type === "student") {
      setStudentInfo(loggedInUser);
    } else {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/home");
  };

  if (!studentInfo) {
    return <div className="content-section">Loading student dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2>Busari-alao College</h2>
          <ul>
            <li><Link to="/student-profile">My Profile</Link></li>
            <li><Link to="/student-results">My Results</Link></li>
            <li><Link to="/student-syllabus">My Syllabus</Link></li>
            <li><Link to="/student-certification">My Certification</Link></li>
            <li><Link to="/student-calendar">My Calendar</Link></li>
            <li><Link to="/student-attendance">My Attendance</Link></li>
            <li><Link to="/student-fees">My Fees</Link></li>
            <li><Link to="/student-mails">My Mails</Link></li>
            <li><Link to="/student-password-change">Change Password</Link></li>
            <li><Link to="/student-subject">My Subjects</Link></li>
            <li><Link to="/student-timetable">My Timetable</Link></li>
            <li><Link to="/student-certification-registration">Register for Certification</Link></li>
            <li><Link to="/student-digital-library">Digital Library</Link></li>
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main-content">
          <header className="top-nav">
            <h2>Dashboard</h2>
            <div className="user-profile">
              <h2>
                Welcome,{" "}
                <span>
                  {studentInfo.firstName} {studentInfo.lastName}
                </span>
              </h2>
              <p>
                <strong>Class:</strong>{" "}
                <span>{studentInfo.studentClass}</span>
              </p>
            </div>
          </header>

          {/* CARDS */}
          <div className="cards-container dashboard-grid">
            <Link to="/student-profile">
              <div className="card">
                <img src={profileIcon} alt="" />
                My Profile
              </div>
            </Link>

            <Link to="/student-attendance">
              <div className="card">
                <img src={attendanceIcon} alt="" />
                Attendance
              </div>
            </Link>

            <Link to="/student-subjects">
              <div className="card">
                <img src={subjectIcon} alt="" />
                My Subjects
              </div>
            </Link>

            <Link to="/student-results">
              <div className="card">
                <img src={resultIcon} alt="" />
                My Results
              </div>
            </Link>

            <Link to="/student-calendar">
              <div className="card">
                <img src={calendarIcon} alt="" />
                Calendar
              </div>
            </Link>

            <Link to="/student-fees">
              <div className="card">
                <img src={feesIcon} alt="" />
                My Fees
              </div>
            </Link>

            <Link to="/student-mails">
              <div className="card">
                <img src={mailsIcon} alt="" />
                Mails
              </div>
            </Link>

            <Link to="/student-password-change">
              <div className="card">
                <img src={passwordIcon} alt="" />
                Password
              </div>
            </Link>

            <Link to="/student-timetable">
              <div className="card">
                <img src={timetableIcon} alt="" />
                My Timetable
              </div>
            </Link>

            <Link to="/student-digital-library">
              <div className="card">
                <img src={libraryIcon} alt="" />
                Digital Library
              </div>
            </Link>

            <Link to="/student-certification-registration">
              <div className="card">
                <img src={certificationIcon} alt="" />
                Certification
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
