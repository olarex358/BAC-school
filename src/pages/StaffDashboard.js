// src/pages/StaffDashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Import icons for cards (ensure these paths are correct relative to src/pages/)
import profileIcon from '../icon/profile.png';
import resultsInputIcon from '../icon/attendance.png'; // Using attendance icon for input results
import viewReportsIcon from '../icon/result.png'; // Using result icon for view reports
import subjectIcon from '../icon/subject.png';
import calendarIcon from '../icon/calender.png'; // Corrected spelling to match file name
import mailsIcon from '../icon/mails.png';
import passwordIcon from '../icon/password.png';
import attendanceIcon from '../icon/attendance.png';
import timetableIcon from '../icon/calender.png'; 
import libraryIcon from '../icon/library.png'
import { useAuth } from '../context/AuthContext';   

function StaffDashboard() {
  const [staffInfo, setStaffInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUser.type === 'staff') {
      setStaffInfo(loggedInUser);
    } else {
      navigate('/login'); // Redirect if not logged in as a staff
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };
const { user } = useAuth();

  const handleCardClick = (path) => {
    navigate(path);
  };

  if (!staffInfo) {
    return <div className="content-section">Loading staff dashboard...</div>;
  }

  return (
    <div className="container"> {/* Use container class for overall layout */}
        <aside className="sidebar"> {/* Sidebar structure */}
            <h2>Busari-alao College</h2>
            <ul>
                {/* Staff sidebar links */}
                <li><Link to="/staff-profile">My Profile</Link></li>
                {/* Conditional access to Results Management for teachers/results managers */}
                {staffInfo.role && (staffInfo.role.includes('Teacher') || staffInfo.role.includes('Results Manager')) && (
                    <li><Link to="/results-management">Input Results</Link></li>
                )}
                {staffInfo.role && (staffInfo.role.includes('Teacher') || staffInfo.role.includes('View Reports')) && (
                    <li><Link to="/view-reports">View Reports</Link></li>
                )}
                {staffInfo.role && staffInfo.role.includes('Teacher')&&(<li><Link to="/mark-attendance">Mark Attendance</Link></li>)}
                {/* Staff-specific sidebar links */}
                <li><Link to="/staff-subjects">My Subjects</Link></li>
                <li><Link to="/staff-calendar">School Calendar</Link></li>
                <li><Link to="/staff-mails">Internal Mails</Link></li>
                <li><Link to="/mark-attendance">Mark Attendance</Link></li>
                <li><Link to="/staff-timetable">My Timetable</Link></li>
                <li><Link to="/staff-digital-library">Digital Library</Link></li> 
                <li><Link to="/staff-password-change">Change Password</Link></li>
            </ul>
            <button type="button" onClick={handleLogout}>Logout</button>
        </aside>
        <div className="main-content"> {/* Main content area */}
            <header className="top-nav"> {/* Top navigation bar */}
                <h2>Staff Dashboard</h2>
                <div className="user-profile" id="staffInfo">
                    <h2> Welcome, {staffInfo.firstname} {staffInfo.surname}</h2>
                    <p><strong>Role:</strong><span>{staffInfo.role}</span></p>
                </div>
            </header>
            <div className="cards-container"> {/* Cards grid */}
                <div className="card" onClick={() => handleCardClick('/staff-profile')}>
                    <img src={profileIcon} alt="My profile" width="50px" height="50px" />
                    My Profile
                </div>
                {/* Conditional access cards */}
                {staffInfo.role && (staffInfo.role.includes('Teacher') || staffInfo.role.includes('Results Manager')) && (
                    <div className="card" onClick={() => handleCardClick('/results-management')}>
                        <img src={resultsInputIcon} alt="Input Results" width="50px" height="50px"/>
                        Input Results
                    </div>
                )}
                {staffInfo.role && (staffInfo.role.includes('Teacher') || staffInfo.role.includes('View Reports')) && (
                     <div className="card" onClick={() => handleCardClick('/view-reports')}>
                        <img src={viewReportsIcon} alt="View Reports" width="50px" height="50px" />
                        View Reports
                    </div>
                )}
                {staffInfo.role && staffInfo.role.includes('Teacher')&&(
                    <div className='card'onClick={()=>handleCardClick('/mark-attendance')}>
                        <img src={attendanceIcon} alt='Mark attendance' width='50px' height='50px'/> Mark Attendance
                </div>
                )}
                {/* General staff cards */}
                <div className="card" onClick={() => handleCardClick('/staff-subjects')}>
                    <img src={subjectIcon} alt="My Subjects" width="50px" height="50px" />
                    My Subjects
                </div>
                <div className="card" onClick={() => handleCardClick('/staff-calendar')}>
                    <img src={calendarIcon} alt="School Calendar" width="50px" height="50px" />
                    School Calendar
                </div>
                <div className="card" onClick={() => handleCardClick('/staff-mails')}>
                    <img src={mailsIcon} alt="Internal Mails" width="50px" height="50px" />
                    Internal Mails
                </div>
                 <div className="card" onClick={() => handleCardClick('/staff-timetable')}>
                    <img src={timetableIcon} alt="My Timetable" width="50px" height="50px" />
                    My Timetable
                </div>
                <div className="card" onClick={() => handleCardClick('/staff-digital-library')}>
                    <img src={libraryIcon} alt="Digital Library" width="50px" height="50px" />
                    Digital Library
                </div>
                <div className="card" onClick={() => handleCardClick('/staff-password-change')}>
                    <img src={passwordIcon} alt="Change Password" width="50px" height="50px" />
                    Change Password
                </div>
            </div>
        </div>
    </div>
  );
}

export default StaffDashboard;