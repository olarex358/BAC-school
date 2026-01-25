// src/pages/StudentCalendar.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


// Import the calendar icon
import calendarIcon from '../icon/calender.png';

function StudentCalendar() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  const [allCalendarEvents] = useLocalStorage('schoolPortalCalendarEvents', []);

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
    return <div className="content-section">Loading calendar...</div>;
  }

  const studentRelevantEvents = allCalendarEvents.filter(event =>
    event.audience === 'all' || event.audience === 'students'
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Calendar</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here are your important dates and events:</p>

      {studentRelevantEvents.length > 0 ? (
        <div className="calendar-grid">
          {studentRelevantEvents.map(event => (
            <div key={event._id} className="event-card">
              <div className="event-icon-container">
                <img src={calendarIcon} alt="Calendar Icon" className="event-icon" />
              </div>
              <div className="event-details">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-date">
                  <strong>Date:</strong> {event.date}
                </p>
                <p className="event-description">
                  {event.description}
                </p>
                <p className="event-audience">
                  Audience: {event.audience.charAt(0).toUpperCase() + event.audience.slice(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data-message">No calendar events posted for students yet.</p>
      )}

      <p className="mt-4">
        For a more detailed and interactive calendar, please visit the school's official website.
      </p>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentCalendar;
