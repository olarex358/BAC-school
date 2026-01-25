// src/pages/StudentSyllabus.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


// Import the syllabus icon
import syllabusIcon from '../icon/sylabus.png';

function StudentSyllabus() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();
  
  const [allSyllabusEntries, , loadingSyllabus] = useLocalStorage('schoolPortalSyllabusEntries', [], 'http://localhost:5000/api/schoolPortalSyllabusEntries');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');

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
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!loggedInStudent) {
    return <div className="content-section">Loading syllabus...</div>;
  }

  const studentRelevantSyllabus = allSyllabusEntries.filter(entry =>
    (entry.audience === 'all' || entry.audience === 'students') &&
    (entry.applicableClass === 'all' || entry.applicableClass === loggedInStudent.studentClass)
  ).sort((a, b) => a.applicableClass.localeCompare(b.applicableClass) || a.applicableSubject.localeCompare(b.applicableSubject));

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  if (!loggedInStudent || loadingSyllabus) {
    return <div className="content-section">Loading syllabus...</div>;
  }

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Syllabus</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here are your relevant syllabus outlines:</p>

      {studentRelevantSyllabus.length > 0 ? (
        <div className="syllabus-grid">
          {studentRelevantSyllabus.map(entry => (
            <div key={entry._id} className="syllabus-card">
              <div className="syllabus-header">
                <img src={syllabusIcon} alt="Syllabus Icon" className="syllabus-icon" />
                <div className="syllabus-info">
                  <h3 className="syllabus-title">{entry.title}</h3>
                  <p className="syllabus-meta">
                    <strong>Class:</strong> {entry.applicableClass === 'all' ? 'All Classes' : entry.applicableClass}
                  </p>
                  <p className="syllabus-meta">
                    <strong>Subject:</strong> {entry.applicableSubject === 'all' ? 'All Subjects' : getSubjectName(entry.applicableSubject)}
                  </p>
                </div>
              </div>
              <p className="syllabus-description">
                {entry.description}
              </p>
              <p className="syllabus-audience">
                Audience: {entry.audience.charAt(0).toUpperCase() + entry.audience.slice(1)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data-message">No syllabus entries posted for you yet.</p>
      )}

      <p className="mt-4">
        For detailed subject-specific syllabus and learning objectives, please refer to the academic department or your subject teachers.
      </p>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentSyllabus;
