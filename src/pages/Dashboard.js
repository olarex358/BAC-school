// src/pages/Dashboard.js
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";

// Icons
import studentIcon from "../icon/profile.png";
import resultsInputIcon from "../icon/attendance.png";
import academicIcon from "../icon/subject.png";
import masterResultIcon from "../icon/result.png";
import staffIcon from "../icon/password.png";
import permissionsIcon from "../icon/settings.png";
import mailsIcon from "../icon/mails.png";
import feesIcon from "../icon/fees.png";
import calendarIcon from "../icon/calender.png";
import syllabusIcon from "../icon/sylabus.png";
import pendingResultsIcon from "../icon/warning.png";
import timetableIcon from "../icon/calender.png";
import digitalLibraryIcon from "../icon/result.png";
import newsIcon from "../icon/news.png";
import certificationIcon from "../icon/certification.png";

import AttendanceAlertCard from "../components/AttendanceAlertCard";
import AttendanceNotifications from "../components/AttendanceNotifications";



function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // DATA (single source of truth)
  const [applications] = useLocalStorage("schoolPortalApplications", []);
  const [students] = useLocalStorage("schoolPortalStudents", []);
  const [staffs] = useLocalStorage("schoolPortalStaff", []);
  const [subjects] = useLocalStorage("schoolPortalSubjects", []);
  const [results] = useLocalStorage("schoolPortalResults", []);
  const [users] = useLocalStorage("schoolPortalUsers", []);
  const [feeRecords] = useLocalStorage("schoolPortalFeeRecords", []);
  const [calendarEvents] = useLocalStorage("schoolPortalCalendarEvents", []);
  const [syllabusEntries] = useLocalStorage("schoolPortalSyllabusEntries", []);
  const [pendingResults] = useLocalStorage("schoolPortalPendingResults", []);
  const [digitalResources] = useLocalStorage("schoolPortalDigitalLibrary", []);
  const [certifications] = useLocalStorage("schoolPortalCertificationResults", []);

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2>Busarialao College</h2>

          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li>
              <Link to="/admin/applications">
                Admission Applications ({applications.length})
              </Link>
            </li>
            <li><Link to="/student-management">Student Management</Link></li>
            <li><Link to="/staff-management">Staff Management</Link></li>
            <li><Link to="/results-management">Results Management</Link></li>
            <li>
              <Link to="/admin-results-approval">
                Results Approval ({pendingResults.length})
              </Link>
            </li>
            <li><Link to="/view-reports">View Reports</Link></li>
            <li><Link to="/academic-management">Academic Management</Link></li>
            <li><Link to="/user-permissions-management">User / Permissions</Link></li>
            <li><Link to="/admin-messaging">Admin Messaging</Link></li>
            <li><Link to="/admin-fees-management">Fee Management</Link></li>
            <li><Link to="/admin-calendar-management">Calendar</Link></li>
            <li><Link to="/admin-syllabus-management">Syllabus</Link></li>
            <li><Link to="/admin-timetable-management">Timetable</Link></li>
            <li><Link to="/promotion-management">Promotions</Link></li>
            <li>
              <Link to="/admin-digital-library">
                Digital Library ({digitalResources.length})
              </Link>
            </li>
            
            <li>
              <Link to="/admin-certification-management">
                Certification ({certifications.length})
              </Link>
            </li>
            <li><Link to="/admin-home-content">Manage News</Link></li>
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

        {/* MAIN CONTENT */}
        <div className="main-content">
          <h1>Admin Portal Dashboard</h1>
          <h2>Welcome, {user?.username}</h2>

          <div className="cards-container dashboard-grid">

            <div className="card" onClick={() => navigate("/student-management")}>
              <img src={studentIcon} alt="" />
              Students ({students.length})
            </div>

            <div className="card" onClick={() => navigate("/admin/applications")}>
              <img src={studentIcon} alt="" />
              Admissions
              <small>
                Pending {applications.filter(a => a.status === "Pending").length} | 
                Approved {applications.filter(a => a.status === "Approved").length}
              </small>
            </div>

            <div className="card" onClick={() => navigate("/attendance-alerts")}>
              <AttendanceAlertCard />
            </div>
            
            <div className="card" onClick={() => navigate("/results-management")}>
              <img src={resultsInputIcon} alt="" />
              Input Results ({results.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-results-approval")}>
              <img src={pendingResultsIcon} alt="" />
              Results Approval ({pendingResults.length})
            </div>

            <div className="card" onClick={() => navigate("/academic-management")}>
              <img src={academicIcon} alt="" />
              Academic ({subjects.length})
            </div>

            <div className="card" onClick={() => navigate("/view-reports")}>
              <img src={masterResultIcon} alt="" />
              Master Results
            </div>

            <div className="card" onClick={() => navigate("/staff-management")}>
              <img src={staffIcon} alt="" />
              Staff ({staffs.length})
            </div>

            <div className="card" onClick={() => navigate("/user-permissions-management")}>
              <img src={permissionsIcon} alt="" />
              Users ({users.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-messaging")}>
              <img src={mailsIcon} alt="" />
              Messaging
            </div>

            <div className="card" onClick={() => navigate("/admin-fees-management")}>
              <img src={feesIcon} alt="" />
              Fees ({feeRecords.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-calendar-management")}>
              <img src={calendarIcon} alt="" />
              Calendar ({calendarEvents.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-syllabus-management")}>
              <img src={syllabusIcon} alt="" />
              Syllabus ({syllabusEntries.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-timetable-management")}>
              <img src={timetableIcon} alt="" />
              Timetable
            </div>

            <div className="card" onClick={() => navigate("/admin-digital-library")}>
              <img src={digitalLibraryIcon} alt="" />
              Digital Library ({digitalResources.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-certification-management")}>
              <img src={certificationIcon} alt="" />
              Certification ({certifications.length})
            </div>

            <div className="card" onClick={() => navigate("/admin-home-content")}>
              <img src={newsIcon} alt="" />
              Manage News
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
