// src/pages/AdminCalendarManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';
 // New CSS file for styling

function AdminCalendarManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // Update hook to get data from the backend
  const [calendarEvents, setCalendarEvents, loadingEvents] = useLocalStorage('schoolPortalCalendarEvents', [], 'http://localhost:5000/api/schoolPortalCalendarEvents');

  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    description: '',
    audience: 'all'
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(() => {});
  const [isModalAlert, setIsModalAlert] = useState(false);

  // Helper functions for modal control
  const showConfirm = (msg, action) => {
    setModalMessage(msg);
    setModalAction(() => action);
    setIsModalAlert(false);
    setIsModalOpen(true);
  };

  const showAlert = (msg, action = () => {}) => {
    setModalMessage(msg);
    setModalAction(() => action);
    setIsModalAlert(true);
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
    if (!eventForm.title.trim()) errors.title = 'Title is required.';
    if (!eventForm.date) errors.date = 'Date is required.';
    if (!eventForm.description.trim()) errors.description = 'Description is required.';
    if (!eventForm.audience) errors.audience = 'Audience is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setEventForm(prev => ({ ...prev, [id]: value }));
    setFormErrors(prev => ({ ...prev, [id]: '' }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validateForm()) {
      showAlert('Please correct the errors in the form.');
      return;
    }
    const eventToAddOrUpdate = {
      ...eventForm,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/schoolPortalCalendarEvents/${editEventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventToAddOrUpdate),
        });
        if (response.ok) {
          const updatedEvent = await response.json();
          setCalendarEvents(prevEvents =>
            prevEvents.map(event =>
              event._id === updatedEvent._id ? updatedEvent : event
            )
          );
          showAlert('Calendar event updated successfully!');
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to update calendar event.');
        }
      } else {
        const response = await fetch('http://localhost:5000/api/schoolPortalCalendarEvents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventToAddOrUpdate),
        });
        if (response.ok) {
          const newEvent = await response.json();
          setCalendarEvents(prevEvents => [...prevEvents, newEvent]);
          showAlert('Calendar event added successfully!');
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to add new calendar event.');
        }
      }
    } catch (err) {
      showAlert('An unexpected error occurred. Please check your network connection.');
    }
    
    setEventForm({ title: '', date: '', description: '', audience: 'all' });
    setIsEditing(false);
    setEditEventId(null);
    setFormErrors({});
  };

  const editEvent = (idToEdit) => {
    const event = calendarEvents.find(e => e._id === idToEdit);
    if (event) {
      setEventForm(event);
      setIsEditing(true);
      setEditEventId(idToEdit);
      setMessage(null);
      setFormErrors({});
    }
  };

  const deleteEvent = (idToDelete) => {
    showConfirm(
      'Are you sure you want to delete this event?',
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/schoolPortalCalendarEvents/${idToDelete}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setCalendarEvents(prevEvents => prevEvents.filter(event => event._id !== idToDelete));
            showAlert('Event deleted successfully!');
          } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Failed to delete event.');
          }
        } catch (err) {
          showAlert('An unexpected error occurred. Please check your network connection.');
        }
      }
    );
  };

  const clearForm = () => {
    setEventForm({ title: '', date: '', description: '', audience: 'all' });
    setIsEditing(false);
    setEditEventId(null);
    setFormErrors({});
    setMessage(null);
  };
  
  // Sorting logic
  const sortTable = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedEvents = [...calendarEvents]
    .filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.date.includes(searchTerm)
    )
    .sort((a, b) => {
      let keyA = a[sortConfig.key];
      let keyB = b[sortConfig.key];
      
      // Special handling for date sorting
      if (sortConfig.key === 'date') {
        keyA = new Date(keyA);
        keyB = new Date(keyB);
      }
      
      if (keyA < keyB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (keyA > keyB) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

  if (!loggedInAdmin) {
    return <div className="content-section">Access Denied. Please log in as an Admin.</div>;
  }

  if (loadingEvents) {
    return <div className="content-section">Loading calendar events...</div>;
  }

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => { modalAction(); setIsModalOpen(false); }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>Calendar Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Calendar Event' : 'Add New Calendar Event'}</h2>
        {message && (
          <div className={`form-message form-message-${message.type}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="calendar-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Event Title:</label>
            <input
              type="text"
              id="title"
              value={eventForm.title}
              onChange={handleChange}
              placeholder="e.g., Mid-Term Break"
              className={`form-input ${formErrors.title ? 'form-input-error' : ''}`}
            />
            {formErrors.title && <p className="error-message">{formErrors.title}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="date" className="form-label">Date:</label>
            <input
              type="date"
              id="date"
              value={eventForm.date}
              onChange={handleChange}
              className={`form-input ${formErrors.date ? 'form-input-error' : ''}`}
            />
            {formErrors.date && <p className="error-message">{formErrors.date}</p>}
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="description" className="form-label">Description:</label>
            <textarea
              id="description"
              value={eventForm.description}
              onChange={handleChange}
              rows="3"
              placeholder="A brief description of the event."
              className={`form-input ${formErrors.description ? 'form-input-error' : ''}`}
            ></textarea>
            {formErrors.description && <p className="error-message">{formErrors.description}</p>}
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="audience" className="form-label">Audience:</label>
            <select
              id="audience"
              value={eventForm.audience}
              onChange={handleChange}
              className={`form-input ${formErrors.audience ? 'form-input-error' : ''}`}
            >
              <option value="all">All (Students & Staff)</option>
              <option value="students">Students Only</option>
              <option value="staff">Staff Only</option>
            </select>
            {formErrors.audience && <p className="error-message">{formErrors.audience}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" className="form-submit-btn">
              {isEditing ? 'Update Event' : 'Add Event'}
            </button>
            <button type="button" onClick={clearForm} className="form-clear-btn">
              Clear Form
            </button>
          </div>
        </form>
      </div>
      <div className="sub-section">
        <h2>All Calendar Events</h2>
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />
        <div className="table-container">
          <table className="calendar-table">
            <thead>
              <tr>
                <th onClick={() => sortTable('title')}>Title {sortConfig.key === 'title' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th onClick={() => sortTable('date')}>Date {sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th>Description</th>
                <th onClick={() => sortTable('audience')}>Audience {sortConfig.key === 'audience' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.length > 0 ? (
                sortedEvents.map((event, index) => (
                  <tr key={event._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>{event.title}</td>
                    <td>{event.date}</td>
                    <td>{event.description}</td>
                    <td>{event.audience.charAt(0).toUpperCase() + event.audience.slice(1)}</td>
                    <td className="table-actions">
                      <button className="action-btn edit-btn" onClick={() => editEvent(event._id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteEvent(event._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No calendar events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminCalendarManagement;
