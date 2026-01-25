// src/pages/StudentSubjects.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function StudentSubjects() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [allSubjects] = useLocalStorage('schoolPortalSubjects', []);
  const navigate = useNavigate();
  
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
    return <div className="content-section">Loading subjects...</div>;
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
      <h1>My Subjects</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here are the subjects available:</p>

      {allSubjects.length > 0 ? (
        <div className="table-container">
          <table className="subjects-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
              </tr>
            </thead>
            <tbody>
              {allSubjects.map((subject, index) => (
                <tr key={subject.subjectCode} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td>{subject.subjectName}</td>
                  <td>{subject.subjectCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data-message">No subjects have been registered in the system yet.</p>
      )}

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentSubjects;
