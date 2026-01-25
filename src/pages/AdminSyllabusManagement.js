// src/pages/AdminSyllabusManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function AdminSyllabusManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // Update hooks to get data from the backend
  const [syllabusEntries, setSyllabusEntries, loadingSyllabus] = useLocalStorage('schoolPortalSyllabusEntries', [], 'http://localhost:5000/api/schoolPortalSyllabusEntries');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');

  const [syllabusForm, setSyllabusForm] = useState({
    title: '',
    description: '',
    applicableClass: '',
    applicableSubject: '',
    audience: 'all'
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSyllabusId, setEditSyllabusId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueClasses = [...new Set(students.map(s => s.studentClass))].sort();
  const uniqueSubjects = [...new Set(subjects.map(s => s.subjectCode))].sort();

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
    if (!syllabusForm.title.trim()) errors.title = 'Title is required.';
    if (!syllabusForm.description.trim()) errors.description = 'Description is required.';
    if (!syllabusForm.applicableClass) errors.applicableClass = 'Applicable Class is required.';
    if (!syllabusForm.applicableSubject) errors.applicableSubject = 'Applicable Subject is required.';
    if (!syllabusForm.audience) errors.audience = 'Audience is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSyllabusForm(prev => ({ ...prev, [id]: value }));
    setFormErrors(prev => ({ ...prev, [id]: '' }));
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }
    const syllabusToAddOrUpdate = {
      ...syllabusForm,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/schoolPortalSyllabusEntries/${editSyllabusId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syllabusToAddOrUpdate),
        });
        if (response.ok) {
          const updatedEntry = await response.json();
          setSyllabusEntries(prevEntries =>
            prevEntries.map(entry =>
              entry._id === updatedEntry._id ? updatedEntry : entry
            )
          );
          setMessage({ type: 'success', text: 'Syllabus entry updated successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to update syllabus entry.' });
        }
      } else {
        const response = await fetch('http://localhost:5000/api/schoolPortalSyllabusEntries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syllabusToAddOrUpdate),
        });
        if (response.ok) {
          const newEntry = await response.json();
          setSyllabusEntries(prevEntries => [...prevEntries, newEntry]);
          setMessage({ type: 'success', text: 'Syllabus entry added successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to add new syllabus entry.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
    }
    
    setSyllabusForm({ title: '', description: '', applicableClass: '', applicableSubject: '', audience: 'all' });
    setIsEditing(false);
    setEditSyllabusId(null);
    setFormErrors({});
  };

  const editSyllabus = (idToEdit) => {
    const entry = syllabusEntries.find(e => e._id === idToEdit);
    if (entry) {
      setSyllabusForm(entry);
      setIsEditing(true);
      setEditSyllabusId(idToEdit);
      setMessage(null);
      setFormErrors({});
    }
  };

  const deleteSyllabus = async (idToDelete) => {
    if (window.confirm('Are you sure you want to delete this syllabus entry?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/schoolPortalSyllabusEntries/${idToDelete}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setSyllabusEntries(prevEntries => prevEntries.filter(entry => entry._id !== idToDelete));
          setMessage({ type: 'success', text: 'Syllabus entry deleted successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to delete syllabus entry.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
      }
    }
  };

  const clearForm = () => {
    setSyllabusForm({ title: '', description: '', applicableClass: '', applicableSubject: '', audience: 'all' });
    setIsEditing(false);
    setEditSyllabusId(null);
    setFormErrors({});
    setMessage(null);
  };

  const filteredSyllabus = syllabusEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.applicableClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.applicableSubject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  if (!loggedInAdmin) {
    return <div className="content-section">Access Denied. Please log in as an Admin.</div>;
  }

  if (loadingSyllabus) {
    return <div className="content-section">Loading syllabus data...</div>;
  }

  return (
    <div className="content-section">
      <h1>Syllabus Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Syllabus Entry' : 'Add New Syllabus Entry'}</h2>
        {message && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', color: 'white', backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Syllabus Title:</label>
            <input
              type="text"
              id="title"
              value={syllabusForm.title}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.title ? 'red' : '' }}
            />
            {formErrors.title && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.title}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="applicableClass" style={{ display: 'block', marginBottom: '5px' }}>Applicable Class:</label>
            <select
              id="applicableClass"
              value={syllabusForm.applicableClass}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.applicableClass ? 'red' : '' }}
            >
              <option value="">-- Select Class --</option>
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {formErrors.applicableClass && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.applicableClass}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="applicableSubject" style={{ display: 'block', marginBottom: '5px' }}>Applicable Subject:</label>
            <select
              id="applicableSubject"
              value={syllabusForm.applicableSubject}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.applicableSubject ? 'red' : '' }}
            >
              <option value="">-- Select Subject --</option>
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subCode => (
                <option key={subCode} value={subCode}>{getSubjectName(subCode)}</option>
              ))}
            </select>
            {formErrors.applicableSubject && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.applicableSubject}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="audience" style={{ display: 'block', marginBottom: '5px' }}>Audience:</label>
            <select
              id="audience"
              value={syllabusForm.audience}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.audience ? 'red' : '' }}
            >
              <option value="all">All (Students & Staff)</option>
              <option value="students">Students Only</option>
              <option value="staff">Staff Only</option>
            </select>
            {formErrors.audience && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.audience}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 100%' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description / Content:</label>
            <textarea
              id="description"
              value={syllabusForm.description}
              onChange={handleChange}
              required
              rows="5"
              style={{ borderColor: formErrors.description ? 'red' : '' }}
            ></textarea>
            {formErrors.description && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.description}</p>}
          </div>
          <button type="submit" style={{ flex: '1 1 calc(50% - 7.5px)' }}>{isEditing ? 'Update Syllabus' : 'Add Syllabus'}</button>
          <button type="button" onClick={clearForm} style={{ flex: '1 1 calc(50% - 7.5px)', backgroundColor: '#6c757d', borderColor: '#6c757d' }}>Clear Form</button>
        </form>
      </div>
      <div className="sub-section">
        <h2>All Syllabus Entries</h2>
        <input
          type="text"
          placeholder="Search syllabus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
        />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Audience</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSyllabus.length > 0 ? (
                filteredSyllabus.map(entry => (
                  <tr key={entry._id}>
                    <td>{entry.title}</td>
                    <td>{entry.applicableClass.charAt(0).toUpperCase() + entry.applicableClass.slice(1)}</td>
                    <td>{getSubjectName(entry.applicableSubject)}</td>
                    <td>{entry.audience.charAt(0).toUpperCase() + entry.audience.slice(1)}</td>
                    <td>{entry.description.substring(0, 100)}...</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => editSyllabus(entry._id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteSyllabus(entry._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No syllabus entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminSyllabusManagement;