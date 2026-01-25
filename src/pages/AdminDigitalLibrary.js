// src/pages/AdminDigitalLibrary.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function AdminDigitalLibrary() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // Update hooks to get data from the backend
  const [digitalResources, setDigitalResources, loadingResources] = useLocalStorage('schoolPortalDigitalLibrary', [], 'http://localhost:5000/api/schoolPortalDigitalLibrary');
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    audience: 'all',
    applicableClass: 'all',
    filename: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editResourceId, setEditResourceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Protect the route
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'admin') {
      setLoggedInAdmin(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const uniqueClasses = ['all', ...new Set(students.map(s => s.studentClass))].sort();

  const validateForm = () => {
    let errors = {};
    if (!resourceForm.title.trim()) errors.title = 'Title is required.';
    if (!resourceForm.description.trim()) errors.description = 'Description is required.';
    if (!resourceForm.audience) errors.audience = 'Audience is required.';
    if (!resourceForm.filename && !isEditing) errors.filename = 'A file is required.';
    if (!resourceForm.applicableClass) errors.applicableClass = 'Applicable Class is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setResourceForm(prev => ({
        ...prev,
        filename: file ? file.name : ''
      }));
      setFormErrors(prev => ({ ...prev, filename: '' }));
    } else {
      setResourceForm(prev => ({ ...prev, [id]: value }));
      setFormErrors(prev => ({ ...prev, [id]: '' }));
    }
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }
    
    const resourceToSave = {
      ...resourceForm,
      timestamp: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/schoolPortalDigitalLibrary/${editResourceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceToSave),
        });
        if (response.ok) {
          const updatedResource = await response.json();
          setDigitalResources(prev =>
            prev.map(res => (res._id === updatedResource._id ? updatedResource : res))
          );
          setMessage({ type: 'success', text: 'Resource updated successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to update resource.' });
        }
      } else {
        const response = await fetch('http://localhost:5000/api/schoolPortalDigitalLibrary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceToSave),
        });
        if (response.ok) {
          const newResource = await response.json();
          setDigitalResources(prev => [...prev, newResource]);
          setMessage({ type: 'success', text: 'New resource added successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to add new resource.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
    }
    
    setResourceForm({
      title: '',
      description: '',
      audience: 'all',
      applicableClass: 'all',
      filename: ''
    });
    setIsEditing(false);
    setEditResourceId(null);
    setFormErrors({});
  };

  const editResource = (idToEdit) => {
    const resource = digitalResources.find(res => res._id === idToEdit);
    if (resource) {
      setResourceForm(resource);
      setIsEditing(true);
      setEditResourceId(idToEdit);
      setMessage(null);
      setFormErrors({});
    }
  };

  const deleteResource = async (idToDelete) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/schoolPortalDigitalLibrary/${idToDelete}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setDigitalResources(prev => prev.filter(res => res._id !== idToDelete));
          setMessage({ type: 'success', text: 'Resource deleted successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to delete resource.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
      }
    }
  };

  const clearForm = () => {
    setResourceForm({
      title: '',
      description: '',
      audience: 'all',
      applicableClass: 'all',
      filename: ''
    });
    setIsEditing(false);
    setEditResourceId(null);
    setFormErrors({});
    setMessage(null);
  };

  const filteredResources = digitalResources.filter(res =>
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.filename.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (!loggedInAdmin) {
    return <div className="content-section">Access Denied. Please log in as an Admin.</div>;
  }

  if (loadingResources) {
    return <div className="content-section">Loading resources data...</div>;
  }

  return (
    <div className="content-section">
      <h1>Digital Library Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Digital Resource' : 'Add New Digital Resource'}</h2>
        {message && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', color: 'white', backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Resource Title:</label>
            <input
              type="text"
              id="title"
              value={resourceForm.title}
              onChange={handleChange}
              required
              placeholder="e.g., JSS1 Math Textbook"
              style={{ borderColor: formErrors.title ? 'red' : '' }}
            />
            {formErrors.title && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.title}</p>}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
            <textarea
              id="description"
              value={resourceForm.description}
              onChange={handleChange}
              required
              rows="3"
              placeholder="A brief description of the resource."
              style={{ borderColor: formErrors.description ? 'red' : '' }}
            ></textarea>
            {formErrors.description && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.description}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="audience" style={{ display: 'block', marginBottom: '5px' }}>Audience:</label>
            <select
              id="audience"
              value={resourceForm.audience}
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
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="applicableClass" style={{ display: 'block', marginBottom: '5px' }}>Applicable Class:</label>
            <select
              id="applicableClass"
              value={resourceForm.applicableClass}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.applicableClass ? 'red' : '' }}
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {formErrors.applicableClass && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.applicableClass}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 100%' }}>
            <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>File Upload (Simulated):</label>
            <input
              type="file"
              id="filename"
              onChange={handleChange}
              style={{ borderColor: formErrors.filename ? 'red' : '' }}
              disabled={isEditing}
            />
            {formErrors.filename && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.filename}</p>}
            {resourceForm.filename && <small>File selected: {resourceForm.filename}</small>}
          </div>
          <button type="submit">{isEditing ? 'Update Resource' : 'Add Resource'}</button>
          <button type="button" onClick={clearForm} style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}>Clear Form</button>
        </form>
      </div>
      <div className="sub-section">
        <h2>All Digital Resources</h2>
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
        />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>File</th>
                <th>Audience</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length > 0 ? (
                filteredResources.map(res => (
                  <tr key={res._id}>
                    <td>{res.title}</td>
                    <td>{res.description.substring(0, 50)}...</td>
                    <td>
                      <a href="#" onClick={(e) => { e.preventDefault(); alert(`Simulating download of ${res.filename}`); }}>
                        {res.filename}
                      </a>
                    </td>
                    <td>{res.audience}</td>
                    <td>{res.applicableClass}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => editResource(res._id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteResource(res._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No digital resources found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDigitalLibrary;