// src/pages/StudentMails.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


// Import the mails icon
import mailsIcon from '../icon/mails.png';

function StudentMails() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();
  
  const [adminMessages, , loadingMessages] = useLocalStorage('schoolPortalAdminMessages', [], 'http://localhost:5000/api/schoolPortalAdminMessages');

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

  if (!loggedInStudent || loadingMessages) {
    return <div className="content-section">Loading mails...</div>;
  }

  const studentRelevantMessages = adminMessages.filter(msg =>
    msg.recipientType === 'allStudents' ||
    (msg.recipientType === 'individualStudent' && msg.recipientId === loggedInStudent.admissionNo)
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Mails</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here are your recent messages and announcements:</p>

      {studentRelevantMessages.length > 0 ? (
        <div className="mails-list">
          {studentRelevantMessages.map(mail => (
            <div key={mail._id} className="mail-card">
              <div className="mail-icon-container">
                <img src={mailsIcon} alt="Mail Icon" className="mail-icon" />
              </div>
              <div className="mail-content">
                <h3 className="mail-subject">{mail.subject}</h3>
                <p className="mail-meta">
                  From: {mail.sender} | Date: {new Date(mail.timestamp).toLocaleDateString()}
                </p>
                <p className="mail-body">
                  {mail.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data-message">No new messages for you.</p>
      )}

      <p className="mt-4">
        For any mail-related issues or to compose a new message, please visit the IT support desk.
      </p>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentMails;
