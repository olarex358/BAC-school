// src/pages/StudentProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/uncreated-pages.css';


function StudentProfile() {
  const navigate = useNavigate();

  // Tabs
  const [activeTab, setActiveTab] = useState('profile');

  // Student
  const [studentProfile, setStudentProfile] = useState(null);

  // Data
  const [students, , loadingStudents] = useLocalStorage(
    'schoolPortalStudents',
    [],
    'http://localhost:5000/api/schoolPortalStudents'
  );

  const [results] = useLocalStorage(
    'schoolPortalResults',
    [],
    'http://localhost:5000/api/schoolPortalResults'
  );

  const [attendance] = useLocalStorage(
    'schoolPortalAttendance',
    [],
    'http://localhost:5000/api/schoolPortalAttendance'
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);

  // Auth + load student
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!loggedInUser || loggedInUser.type !== 'student') {
      navigate('/login');
      return;
    }

    const found = students.find(
      s => s.admissionNo === loggedInUser.admissionNo
    );

    if (!found) {
      localStorage.removeItem('loggedInUser');
      navigate('/login');
      return;
    }

    setStudentProfile(found);
  }, [students, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!studentProfile || loadingStudents) {
    return <div className="content-section">Loading profile...</div>;
  }

  // Filter data for this student
  const myResults = results.filter(
    r =>
      r.studentAdmissionNo === studentProfile.admissionNo &&
      r.status === 'Approved'
  );

  const myAttendance = attendance.filter(
    a => a.studentId === studentProfile.admissionNo
  );

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />

      <h1>My Profile</h1>

      {/* TABS */}
      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
        >
          Results
        </button>
        <button
          className={activeTab === 'attendance' ? 'active' : ''}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="profile-card">
          <div className="profile-details">
            <p><strong>Full Name:</strong> {studentProfile.firstName} {studentProfile.lastName}</p>
            <p><strong>Admission No:</strong> {studentProfile.admissionNo}</p>
            <p><strong>Class:</strong> {studentProfile.studentClass}</p>
            <p><strong>Date of Birth:</strong> {studentProfile.dob}</p>
            <p><strong>Parent Name:</strong> {studentProfile.parentName}</p>
            <p><strong>Parent Phone:</strong> {studentProfile.parentPhone}</p>
            <p><strong>Address:</strong> {studentProfile.address}</p>
            <p><strong>Enrollment Date:</strong> {studentProfile.enrollmentDate}</p>
            <p><strong>Medical Notes:</strong> {studentProfile.medicalNotes || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
  <div className="table-container">
    <h3>My Results</h3>

    {myResults.length > 0 ? (
      <table className="results-table">
        <thead>
          <tr>
            <th>Term</th>
            <th>Session</th>
            <th>Subjects</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {[...new Set(myResults.map(r => `${r.termSelect}-${r.academicYear}`))]
            .map(key => {
              const [term, year] = key.split('-');
              const count = myResults.filter(
                r => r.termSelect === term && r.academicYear === year
              ).length;

              return (
                <tr key={key}>
                  <td>{term}</td>
                  <td>{year}</td>
                  <td>{count}</td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/student-result/${term}/${year}`)
                      }
                    >
                      View Result
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    ) : (
      <p>No approved results available.</p>
    )}
  </div>
)}


      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="table-container">
          <h3>My Attendance</h3>

          {myAttendance.length > 0 ? (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map((a, i) => (
                  <tr key={i}>
                    <td>{a.date}</td>
                    <td>{a.class}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No attendance records found.</p>
          )}
        </div>
      )}

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StudentProfile;
