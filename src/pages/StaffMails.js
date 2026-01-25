// src/pages/StaffMails.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage'; // Import useLocalStorage

// Import the mails icon
import mailsIcon from '../icon/mails.png';

function StaffMails() {
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const navigate = useNavigate();
  // Load all admin messages
  const [adminMessages, , loadingMessages] = useLocalStorage('schoolPortalAdminMessages', [], 'http://localhost:5000/api/schoolPortalAdminMessages');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'staff') {
      setLoggedInStaff(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!loggedInStaff || loadingMessages) {
    return <div className="content-section">Loading staff mails...</div>;
  }

  // Filter messages relevant to this staff member
  const staffRelevantMessages = adminMessages.filter(msg =>
    msg.recipientType === 'allStaff' ||
    (msg.recipientType === 'individualStaff' && msg.recipientId === loggedInStaff.staffId)
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

  return (
    <div className="content-section">
      <h1>Internal Mails (Staff View)</h1>
      <p>Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here are your recent internal messages:</p>

      {staffRelevantMessages.length > 0 ? (
        staffRelevantMessages.map(mail => (
          <div key={mail._id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src={mailsIcon} alt="Mail Icon" width="40px" height="40px" style={{ marginRight: '10px' }} />
              <div>
                <strong>Subject: {mail.subject}</strong><br/>
                <em>From: {mail.sender} | Date: {new Date(mail.timestamp).toLocaleDateString()} {new Date(mail.timestamp).toLocaleTimeString()}</em>
              </div>
            </div>
            <p>{mail.body}</p>
          </div>
        ))
      ) : (
        <p>No new messages for you.</p>
      )}

      <p style={{ marginTop: '20px' }}>
        For composing new messages or accessing the full mail archive, please use the school's dedicated communication platform.
      </p>

      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default StaffMails;