// src/pages/AdminTimetableManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';

function AdminTimetableManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // 1. Data State
  const [timetableEntries, setTimetableEntries] = useLocalStorage('schoolPortalTimetables', []);
  const [students, setStudents] = useLocalStorage('schoolPortalStudents', []);
  const [subjects, setSubjects] = useLocalStorage('schoolPortalSubjects', []);
  const [staffs, setStaffs] = useLocalStorage('schoolPortalStaff', []);
  
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const initialTimetableState = {
    classSelect: '',
    subjectSelect: '',
    teacherSelect: '',
    day: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'Class'
  };

  const [timetableForm, setTimetableForm] = useState(initialTimetableState);
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editEntryId, setEditEntryId] = useState(null);

  // 2. MODAL STATE AND HELPERS (CRITICAL)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(() => {});
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showConfirm = (msg, action) => {
    setModalMessage(msg);
    setModalAction(() => action);
    setIsModalAlert(false); // Confirmation needs two buttons
    setIsModalOpen(true);
  };

  const showAlert = (msg, action = () => {}) => {
    setModalMessage(msg);
    setModalAction(() => action);
    setIsModalAlert(true); // Alert needs one button (OK)
    setIsModalOpen(true);
  };
  
  // Helper function to fetch data securely
  const fetchEntityData = async (entityName, setEntityState) => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      throw new Error('No Admin Token found. Please log in.');
    }
    
    const url = `http://localhost:5000/api/schoolPortal${entityName}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch ${entityName} data.`);
    }

    const data = await response.json();
    setEntityState(data);
  };

  // Securely fetch all data on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user || user.type !== 'admin') {
      navigate('/login');
      return;
    }
    setLoggedInAdmin(user);

    const fetchData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            await Promise.all([
                fetchEntityData('Timetables', setTimetableEntries),
                fetchEntityData('Students', setStudents),
                fetchEntityData('Subjects', setSubjects),
                fetchEntityData('Staff', setStaffs),
            ]);
        } catch (err) {
            setFetchError(err.message || 'An unexpected error occurred during data fetch.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
    
  }, []);


  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const getTeacherName = (staffId) => {
    const staff = staffs.find(s => s.staffId === staffId);
    return staff ? `${staff.surname} ${staff.firstname}` : staffId;
  };
  
  const getClasses = () => {
    const classesFromStudents = [...new Set(students.map(s => s.studentClass))].sort();
    return ['All', ...classesFromStudents];
  };
  
  const uniqueSubjects = subjects.map(s => ({ code: s.subjectCode, name: s.subjectName })).sort((a, b) => a.name.localeCompare(b.name));
  const uniqueTeachers = staffs.filter(s => s.role === 'Teacher').map(s => ({ id: s.staffId, name: `${s.surname} ${s.firstname}` })).sort((a, b) => a.name.localeCompare(b.name));
  
  const validateForm = () => {
    let errors = {};
    if (!timetableForm.classSelect) errors.classSelect = 'Class is required.';
    if (!timetableForm.subjectSelect) errors.subjectSelect = 'Subject is required.';
    if (!timetableForm.teacherSelect) errors.teacherSelect = 'Teacher is required.';
    if (!timetableForm.day) errors.day = 'Day is required.';
    if (!timetableForm.startTime) errors.startTime = 'Start Time is required.';
    if (!timetableForm.endTime) errors.endTime = 'End Time is required.';
    if (!timetableForm.location) errors.location = 'Location is required.';

    if (timetableForm.startTime && timetableForm.endTime) {
        if (timetableForm.startTime >= timetableForm.endTime) {
            errors.endTime = 'End time must be after start time.';
        }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setTimetableForm(prevForm => ({
      ...prevForm,
      [id]: value
    }));
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [id]: ''
    }));
  };
  
  // 3. SECURE SUBMIT HANDLER - Updated to use showAlert
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showAlert('Please correct the errors in the form.');
      return;
    }
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        showAlert('Authentication failed: Admin token missing. Please log in to perform this action.');
        return;
    }
    
    const secureHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
    };

    try {
      if (isEditing) {
        // PUT request for editing
        const response = await fetch(`http://localhost:5000/api/schoolPortalTimetables/${editEntryId}`, {
          method: 'PUT',
          headers: secureHeaders,
          body: JSON.stringify(timetableForm),
        });
        if (response.ok) {
          const updatedEntry = await response.json();
          setTimetableEntries(prevEntries =>
            prevEntries.map(entry =>
              entry._id === updatedEntry._id ? updatedEntry : entry
            )
          );
          showAlert('Timetable entry updated successfully!'); // Success Alert
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to update entry.'); // Error Alert
        }
      } else {
        // POST request for new entry
        const response = await fetch('http://localhost:5000/api/schoolPortalTimetables', {
          method: 'POST',
          headers: secureHeaders,
          body: JSON.stringify(timetableForm),
        });
        if (response.ok) {
          const newEntry = await response.json();
          setTimetableEntries(prevEntries => [...prevEntries, newEntry]);
          showAlert('New timetable entry added successfully!'); // CRITICAL: Success Alert
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to add new entry. Check for conflicts.'); // Error Alert
        }
      }
    } catch (err) {
      showAlert('An unexpected error occurred. Please check your network connection.');
    }
    
    // Clear form and reset state
    setTimetableForm(initialTimetableState);
    setIsEditing(false);
    setEditEntryId(null);
    setFormErrors({});
  };
  
  const editEntry = (entryIdToEdit) => {
    const entryToEdit = timetableEntries.find(e => e._id === entryIdToEdit);
    if (entryToEdit) {
      setTimetableForm(entryToEdit);
      setIsEditing(true);
      setEditEntryId(entryToEdit._id);
      setFormErrors({});
      document.querySelector('.sub-section').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 4. SECURE DELETE HANDLER - Updated to use showConfirm
  const deleteEntry = (entryIdToDelete) => {
    showConfirm(
      'Are you sure you want to delete this timetable entry?',
      async () => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            showAlert('Admin token missing. Please log in to perform this action.');
            return;
        }
        
        try {
          const response = await fetch(`http://localhost:5000/api/schoolPortalTimetables/${entryIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            }
          });
          
          if (response.status === 204 || response.ok) {
            setTimetableEntries(prevEntries => prevEntries.filter(entry => entry._id !== entryIdToDelete));
            showAlert('Timetable entry deleted successfully!'); // Success Alert
          } 
          else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Failed to delete entry.'); // Error Alert
          }
        } catch (err) {
          showAlert('An unexpected error occurred. Please check your network connection.');
        }
      }
    );
  };


  const [filterClass, setFilterClass] = useState('All');
  const [filterDay, setFilterDay] = useState('All');

  const filteredEntries = timetableEntries.filter(entry =>
    (filterClass === 'All' || entry.classSelect === filterClass) &&
    (filterDay === 'All' || entry.day === filterDay)
  ).sort((a, b) => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayA = daysOrder.indexOf(a.day);
    const dayB = daysOrder.indexOf(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return a.startTime.localeCompare(b.startTime);
  });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!loggedInAdmin || loading) {
    return <div className="content-section">Loading timetable data...</div>;
  }
  
  if (fetchError) {
      return (
          <div className="content-section" style={{ color: '#dc3545', fontWeight: 'bold', padding: '20px', border: '1px solid #dc3545', borderRadius: '5px' }}>
              Error fetching data: {fetchError}. Please log in or check the API connection.
          </div>
      );
  }
  
  return (
    <div className="content-section">
      {/* 5. RENDER THE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => { modalAction(); setIsModalOpen(false); }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>Admin Timetable Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}</h2>
        {/* Removed inline message div, replaced with modal alerts */}
        <form id="timetableForm" onSubmit={handleSubmit}>
          
          {/* ... (Form inputs remain the same) ... */}
          <div className="form-group">
            <label htmlFor="classSelect">Class:</label>
            <select
              id="classSelect"
              required
              value={timetableForm.classSelect}
              onChange={handleChange}
              className={formErrors.classSelect ? 'input-error' : ''}
            >
              <option value="">Select Class</option>
              {getClasses().filter(c => c !== 'All').map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {formErrors.classSelect && <p className="error-text">{formErrors.classSelect}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="subjectSelect">Subject:</label>
            <select
              id="subjectSelect"
              required
              value={timetableForm.subjectSelect}
              onChange={handleChange}
              className={formErrors.subjectSelect ? 'input-error' : ''}
            >
              <option value="">Select Subject</option>
              {uniqueSubjects.map(sub => (
                <option key={sub.code} value={sub.code}>{sub.name} ({sub.code})</option>
              ))}
            </select>
            {formErrors.subjectSelect && <p className="error-text">{formErrors.subjectSelect}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="teacherSelect">Teacher:</label>
            <select
              id="teacherSelect"
              required
              value={timetableForm.teacherSelect}
              onChange={handleChange}
              className={formErrors.teacherSelect ? 'input-error' : ''}
            >
              <option value="">Select Teacher</option>
              {uniqueTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.id})</option>
              ))}
            </select>
            {formErrors.teacherSelect && <p className="error-text">{formErrors.teacherSelect}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="day">Day:</label>
            <select
              id="day"
              required
              value={timetableForm.day}
              onChange={handleChange}
              className={formErrors.day ? 'input-error' : ''}
            >
              <option value="">Select Day</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            {formErrors.day && <p className="error-text">{formErrors.day}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time:</label>
            <input
              type="time"
              id="startTime"
              required
              value={timetableForm.startTime}
              onChange={handleChange}
              className={formErrors.startTime ? 'input-error' : ''}
            />
            {formErrors.startTime && <p className="error-text">{formErrors.startTime}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="endTime">End Time:</label>
            <input
              type="time"
              id="endTime"
              required
              value={timetableForm.endTime}
              onChange={handleChange}
              className={formErrors.endTime ? 'input-error' : ''}
            />
            {formErrors.endTime && <p className="error-text">{formErrors.endTime}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location (Room/Hall):</label>
            <input
              type="text"
              id="location"
              placeholder="e.g., Room 101, Science Lab"
              required
              value={timetableForm.location}
              onChange={handleChange}
              className={formErrors.location ? 'input-error' : ''}
            />
            {formErrors.location && <p className="error-text">{formErrors.location}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              required
              value={timetableForm.type}
              onChange={handleChange}
              className={formErrors.type ? 'input-error' : ''}
            >
              <option value="Class">Class</option>
              <option value="Lab">Lab Session</option>
              <option value="Sport">Sport</option>
            </select>
            {formErrors.type && <p className="error-text">{formErrors.type}</p>}
          </div>
          
          <div className="form-actions full-width">
            <button type="submit" className="primary-button">{isEditing ? 'Update Entry' : 'Add Entry'}</button>
            <button 
                type="button" 
                onClick={() => {
                    setTimetableForm(initialTimetableState);
                    setIsEditing(false);
                    setEditEntryId(null);
                    setFormErrors({});
                }} 
                className="secondary-button"
            >
                Clear Form
            </button>
          </div>
        </form>
      </div>

      <div className="sub-section">
        <h2>Timetable List</h2>
        <div className="filter-controls">
            <div className="form-group">
                <label htmlFor="filterClass">Filter by Class:</label>
                <select id="filterClass" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                    {getClasses().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="filterDay">Filter by Day:</label>
                <select id="filterDay" value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                    <option value="All">All Days</option>
                    {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="table-container">
          <table id="timetableTable">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Type</th>
                <th>Day</th>
                <th>Time</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map(entry => (
                  <tr key={entry._id}>
                    <td>{entry.classSelect}</td>
                    <td>{getSubjectName(entry.subjectSelect)}</td>
                    <td>{getTeacherName(entry.teacherSelect)}</td>
                    <td>{entry.type}</td>
                    <td>{entry.day}</td>
                    <td>{`${entry.startTime} - ${entry.endTime}`}</td>
                    <td>{entry.location}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => editEntry(entry._id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteEntry(entry._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No timetable entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminTimetableManagement;