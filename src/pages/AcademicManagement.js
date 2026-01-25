// src/pages/AcademicManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function AcademicManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // 1. FIX: useLocalStorage for local persistence only (no API URL)
  const [subjects, setSubjects] = useLocalStorage('schoolPortalSubjects', []);

  // NEW: State for API loading and fetching errors.
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [newSubject, setNewSubject] = useState({
    subjectName: '',
    subjectCode: ''
  });
  const [submitButtonText, setSubmitButtonText] = useState('Add Subject');
  const [isEditing, setIsEditing] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null); // To store the MongoDB _id
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);

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
    const adminToken = localStorage.getItem('adminToken'); // Get the token

    if (user && user.type === 'admin') {
      setLoggedInAdmin(user);
    } else {
      // Navigate to login if not authenticated as admin
      navigate('/login');
      return;
    }
    
    // 2. FIX: Dedicated useEffect for secure data fetch
    const fetchSubjects = async () => {
        setLoadingSubjects(true);
        setFetchError(null);
        
        if (!adminToken) {
            setFetchError('No Admin Token found. Please log in to view subjects.');
            setLoadingSubjects(false);
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/schoolPortalSubjects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch subjects (Status: ${response.status}).`);
            }

            const data = await response.json();
            setSubjects(data);
            
        } catch (err) {
            setFetchError(err.message || 'An unexpected error occurred during subject fetch.');
            console.error('Fetch error:', err);
        } finally {
            setLoadingSubjects(false);
        }
    };
    
    fetchSubjects();

  }, [navigate,]); // Added setSubjects to dependency array

  const validateForm = () => {
    let errors = {};
    if (!newSubject.subjectName.trim()) errors.subjectName = 'Subject Name is required.';
    if (!newSubject.subjectCode.trim()) errors.subjectCode = 'Subject Code is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setNewSubject(prevSubject => ({
      ...prevSubject,
      [id]: value
    }));
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [id]: ''
    }));
  };

  // 3. FIX: Secure API call for submit (POST/PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validateForm()) {
      showAlert('Please correct the errors in the form.');
      return;
    }

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        showAlert('Authentication failed: Admin token missing. Please log in.');
        return;
    }

    const secureHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX
    };

    try {
        if (isEditing) {
            const response = await fetch(`http://localhost:5000/api/schoolPortalSubjects/${editSubjectId}`, {
                method: 'PUT',
                headers: secureHeaders,
                body: JSON.stringify(newSubject),
            });
            if (response.ok) {
                const updatedSubject = await response.json();
                setSubjects(prevSubjects =>
                    prevSubjects.map(sub => (sub._id === updatedSubject._id ? updatedSubject : sub))
                );
                showAlert('Subject data updated successfully!');
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to update subject.');
            }
        } else {
            const response = await fetch('http://localhost:5000/api/schoolPortalSubjects', {
                method: 'POST',
                headers: secureHeaders,
                body: JSON.stringify(newSubject),
            });
            if (response.ok) {
                const createdSubject = await response.json();
                setSubjects(prevSubjects => [...prevSubjects, createdSubject]);
                showAlert('New subject added successfully!');
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to add new subject. Check if the subject code is already in use.');
            }
        }
    } catch (err) {
        showAlert('An unexpected error occurred. Please check your network connection.');
    }

    setNewSubject({
      subjectName: '',
      subjectCode: ''
    });
    setSubmitButtonText('Add Subject');
    setIsEditing(false);
    setEditSubjectId(null);
    setFormErrors({});
  };

  const editSubject = (subjectCodeToEdit) => {
    const subjectToEdit = subjects.find(s => s.subjectCode === subjectCodeToEdit);
    if (subjectToEdit) {
      setNewSubject(subjectToEdit);
      setSubmitButtonText('Update Subject');
      setIsEditing(true);
      setEditSubjectId(subjectToEdit._id);
      setFormErrors({});
      setMessage(null);
    }
  };

  // 4. FIX: Secure API call for delete
  const deleteSubject = (subjectCodeToDelete) => {
    showConfirm(
      `Are you sure you want to delete subject: ${subjectCodeToDelete}?`,
      async () => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            showAlert('Authentication failed: Admin token missing. Please log in.');
            return;
        }

        const subjectToDelete = subjects.find(s => s.subjectCode === subjectCodeToDelete);
        if (!subjectToDelete) {
            showAlert('Subject not found.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/schoolPortalSubjects/${subjectToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX
                }
            });
            if (response.ok) {
                setSubjects(prevSubjects => prevSubjects.filter(subject => subject.subjectCode !== subjectCodeToDelete));
                showAlert('Subject deleted successfully!');
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to delete subject.');
            }
        } catch (err) {
            showAlert('An unexpected error occurred. Please check your network connection.');
        }
      }
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearchAndForm = () => {
    setSearchTerm('');
    setNewSubject({
      subjectName: '',
      subjectCode: ''
    });
    setSubmitButtonText('Add Subject');
    setIsEditing(false);
    setEditSubjectId(null);
    setFormErrors({});
    setMessage(null);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loggedInAdmin || loadingSubjects) {
    return <div className="content-section">Loading subjects data...</div>;
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
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => { modalAction(); setIsModalOpen(false); }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>Academic Management (Subjects)</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Subject' : 'Add/Edit Subject'}</h2>
        <form id="subjectForm" onSubmit={handleSubmit} className="academic-form">
          <div className="form-group">
            <label htmlFor="subjectName" className="form-label">Subject Name:</label>
            <input
              type="text"
              id="subjectName"
              placeholder="e.g., Mathematics"
              value={newSubject.subjectName}
              onChange={handleChange}
              className={`form-input ${formErrors.subjectName ? 'form-input-error' : ''}`}
            />
            {formErrors.subjectName && <p className="error-message">{formErrors.subjectName}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="subjectCode" className="form-label">Subject Code:</label>
            <input
              type="text"
              id="subjectCode"
              placeholder="e.g., MATH101"
              value={newSubject.subjectCode}
              onChange={handleChange}
              readOnly={isEditing}
              disabled={isEditing}
              className={`form-input ${formErrors.subjectCode ? 'form-input-error' : ''} ${isEditing ? 'form-input-disabled' : ''}`}
            />
            {formErrors.subjectCode && <p className="error-message">{formErrors.subjectCode}</p>}
          </div>
          <div className="form-actions">
            <button type="submit" className="form-submit-btn">
              {submitButtonText}
            </button>
            <button type="button" onClick={clearSearchAndForm} className="form-clear-btn">
              Clear Form
            </button>
          </div>
        </form>
      </div>
      <div className="sub-section">
        <h2>Existing Subjects</h2>
        <div className="filter-controls">
          <input
            type="text"
            id="subjectSearchFilter"
            placeholder="Search by Name or Code"
            value={searchTerm}
            onChange={handleSearchChange}
            className="filter-input"
          />
          <button onClick={clearSearchAndForm} className="filter-clear-btn">
            Clear Filter / Reset Form
          </button>
        </div>
        <div className="table-container">
          <table className="subject-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => (
                  <tr key={subject._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>{subject.subjectName}</td>
                    <td>{subject.subjectCode}</td>
                    <td className="table-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => editSubject(subject.subjectCode)}>
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteSubject(subject.subjectCode)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">No subjects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AcademicManagement;