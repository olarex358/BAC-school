// src/pages/AdminMessaging.js
import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';


function AdminMessaging() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');
  const [staffs] = useLocalStorage('schoolPortalStaff', [], 'http://localhost:5000/api/schoolPortalStaff');
  const [adminMessages, setAdminMessages, loadingMessages] = useLocalStorage('schoolPortalAdminMessages', [], 'http://localhost:5000/api/schoolPortalAdminMessages');

  const [recipientType, setRecipientType] = useState('allStudents');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);
  const [modalAction, setModalAction] = useState(() => {});

  const showAlert = (msg, action = () => {}) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setModalAction(() => action);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'admin') {
      setLoggedInAdmin(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const validateForm = () => {
    let errors = {};
    if (!messageSubject.trim()) {
      errors.messageSubject = 'Subject cannot be empty.';
    }
    if (!messageBody.trim()) {
      errors.messageBody = 'Message body cannot be empty.';
    }
    if (recipientType === 'individualStudent' && !selectedRecipientId) {
      errors.selectedRecipientId = 'Please select a student.';
    }
    if (recipientType === 'individualStaff' && !selectedRecipientId) {
      errors.selectedRecipientId = 'Please select a staff member.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showAlert('Please correct the errors in the form.');
      return;
    }
    const newMessage = {
      sender: loggedInAdmin ? loggedInAdmin.username : 'Admin',
      subject: messageSubject,
      body: messageBody,
      timestamp: new Date().toISOString(),
      recipientType: recipientType,
      recipientId: selectedRecipientId || null,
      isRead: false,
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/schoolPortalAdminMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        const createdMessage = await response.json();
        setAdminMessages(prevMessages => [...prevMessages, createdMessage]);
        
        showAlert(`Message sent to ${recipientType.replace('individual', '').replace('all', '')} successfully!`);
      } else {
        const errorData = await response.json();
        showAlert(errorData.message || 'Failed to send message.');
      }
    } catch (err) {
      showAlert('An unexpected error occurred. Please check your network connection.');
    }

    setSelectedRecipientId('');
    setMessageSubject('');
    setMessageBody('');
    setFormErrors({});
  };

  const getRecipientOptions = () => {
    if (recipientType === 'individualStudent') {
      return students.map(s => ({ id: s.admissionNo, name: `${s.firstName} ${s.lastName} (${s.admissionNo})` }));
    } else if (recipientType === 'individualStaff') {
      return staffs.map(s => ({ id: s.staffId, name: `${s.firstname} ${s.surname} (${s.staffId})` }));
    }
    return [];
  };

  if (!loggedInAdmin) {
    return <div className="content-section">Access Denied. Please log in as an Admin.</div>;
  }

  if (loadingMessages) {
    return <div className="content-section">Loading messages...</div>;
  }

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>Admin Messaging</h1>
      <p>Compose and send internal messages to students and staff.</p>
      <div className="sub-section">
        <h2>Compose New Message</h2>
        <form onSubmit={handleSendMessage} className="messaging-form">
          <div className="form-group form-group-full">
            <label htmlFor="recipientType" className="form-label">Send To:</label>
            <select
              id="recipientType"
              value={recipientType}
              onChange={(e) => { setSelectedRecipientId(''); setRecipientType(e.target.value); setFormErrors({}); }}
              className="form-input"
            >
              <option value="allStudents">All Students</option>
              <option value="individualStudent">Individual Student</option>
              <option value="allStaff">All Staff</option>
              <option value="individualStaff">Individual Staff</option>
            </select>
          </div>
          {(recipientType === 'individualStudent' || recipientType === 'individualStaff') && (
            <div className="form-group form-group-full">
              <label htmlFor="selectedRecipientId" className="form-label">Select Recipient:</label>
              <select
                id="selectedRecipientId"
                value={selectedRecipientId}
                onChange={(e) => { setSelectedRecipientId(e.target.value); setFormErrors(prev => ({ ...prev, selectedRecipientId: '' })); }}
                className={`form-input ${formErrors.selectedRecipientId ? 'form-input-error' : ''}`}
              >
                <option value="">-- Select --</option>
                {getRecipientOptions().map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              {formErrors.selectedRecipientId && <p className="error-message">{formErrors.selectedRecipientId}</p>}
            </div>
          )}
          <div className="form-group form-group-full">
            <label htmlFor="messageSubject" className="form-label">Subject:</label>
            <input
              type="text"
              id="messageSubject"
              value={messageSubject}
              onChange={(e) => { setMessageSubject(e.target.value); setFormErrors(prev => ({ ...prev, messageSubject: '' })); }}
              className={`form-input ${formErrors.messageSubject ? 'form-input-error' : ''}`}
              required
            />
            {formErrors.messageSubject && <p className="error-message">{formErrors.messageSubject}</p>}
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="messageBody" className="form-label">Message:</label>
            <textarea
              id="messageBody"
              value={messageBody}
              onChange={(e) => { setMessageBody(e.target.value); setFormErrors(prev => ({ ...prev, messageBody: '' })); }}
              rows="5"
              className={`form-input ${formErrors.messageBody ? 'form-input-error' : ''}`}
              required
            ></textarea>
            {formErrors.messageBody && <p className="error-message">{formErrors.messageBody}</p>}
          </div>
          <div className="form-actions form-group-full">
            <button type="submit" className="form-submit-btn">
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminMessaging;
