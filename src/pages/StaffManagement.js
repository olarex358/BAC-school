// src/pages/StaffManagement.js
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';

function StaffManagement() {
  const navigate = useNavigate();

  // 1. UPDATED: useLocalStorage only for local persistence.
  const [staffs, setStaffs] = useLocalStorage('schoolPortalStaff', []);
  const [subjects] = useLocalStorage('schoolPortalSubjects', []);
  const [students] = useLocalStorage('schoolPortalStudents', []);
  
  // NEW: State for API loading and fetching errors.
  const [loadingStaffs, setLoadingStaffs] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const initialStaffState = {
    surname: '',
    firstname: '',
    staffId: '',
    role: '',
    gender: '',
    dateOfEmployment: '',
    department: '',
    qualifications: '',
    contactEmail: '',
    contactPhone: '',
    resumeDocument: '',
    assignedSubjects: [],
    assignedClasses: [],
    password: ''
  };

  const [newStaff, setNewStaff] = useState(initialStaffState);
  const [submitButtonText, setSubmitButtonText] = useState('Add Staff');
  const [isEditing, setIsEditing] = useState(false);
  const [editStaffId, setEditStaffId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Used for Deletion
  const [staffToDelete, setStaffToDelete] = useState(null); // Used for Deletion
  
  // ⭐️ NEW: State for Registration Success Modal
  const [isRegSuccessModalOpen, setIsRegSuccessModalOpen] = useState(false);
  const [newlyRegisteredStaff, setNewlyRegisteredStaff] = useState(null);

  // 2. FIX: Securely fetch initial staff data on component mount
  useEffect(() => {
    const fetchStaffs = async () => {
        setLoadingStaffs(true);
        setFetchError(null);
        
        const adminToken = localStorage.getItem('adminToken'); // Get the token
        
        if (!adminToken) {
            // FIX: If no token, set an error message and stop loading.
            setFetchError('No Admin Token found. Please log in to view staff data.');
            setLoadingStaffs(false);
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/schoolPortalStaff', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX: Add the Authorization header
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch staff data (Status: ${response.status}).`);
            }

            const data = await response.json();
            setStaffs(data);
            
        } catch (err) {
            setFetchError(err.message || 'An unexpected error occurred during staff fetch.');
            console.error('Fetch error:', err);
        } finally {
            setLoadingStaffs(false);
        }
    };
    
    fetchStaffs();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    // ... (Validation logic remains the same) ...
    switch (name) {
      case 'surname':
      case 'firstname':
      case 'department':
      case 'qualifications':
        if (!value.trim()) error = 'This field cannot be empty.';
        break;
      case 'staffId':
        if (!value.trim()) error = 'Staff ID is required.';
        break;
      case 'contactEmail':
        if (!value.trim()) {
          error = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format.';
        }
        break;
      case 'contactPhone':
        if (!value.trim()) {
          error = 'Contact phone is required.';
        } else if (!/^\d{10,15}$/.test(value)) {
          error = 'Invalid phone number (10-15 digits).';
        }
        break;
      case 'role':
      case 'gender':
        if (!value) error = 'Please select an option.';
        break;
      case 'dateOfEmployment':
        if (!value) error = 'Date is required.';
        break;
      case 'password':
        if (!isEditing && !value) error = 'Password is required for new staff.';
        break;
      default:
        break;
    }
    return error;
  };
  
  const handleChange = (e) => {
    const { id, value, type, files, options } = e.target;
    if (type === 'file') {
      const file = files[0];
      setNewStaff(prevStaff => ({
        ...prevStaff,
        [id]: file ? file.name : ''
      }));
      setFormErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
    } else if (id === 'assignedSubjects' || id === 'assignedClasses') {
      const selectedValues = Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);
      setNewStaff(prevStaff => ({
        ...prevStaff,
        [id]: selectedValues
      }));
    } else {
      setNewStaff(prevStaff => ({
        ...prevStaff,
        [id]: value
      }));
      setFormErrors(prevErrors => ({ ...prevErrors, [id]: validateField(id, value) }));
    }
    setMessage(null);
  };
  
  const generateStaffId = () => {
    const currentYear = new Date().getFullYear();
    const maxCounter = staffs.length > 0
      ? Math.max(...staffs.map(s => parseInt(s.staffId.split('/').pop() || 0)))
      : 0;
    const nextCounter = maxCounter + 1;
    return `BAC/STF/${currentYear}/${String(nextCounter).padStart(4, '0')}`;
  };

  // 3. FIX: Secure API call for submit (POST/PUT) and handle success modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    let errors = {};
    Object.keys(newStaff).forEach(key => {
        if (key === 'password' && isEditing) return; // Skip password validation on edit if blank
        const error = validateField(key, newStaff[key]);
        if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setMessage({ type: 'error', text: 'Please correct the errors in the form.' });
      return;
    }
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        setMessage({ type: 'error', text: 'Admin token missing. Please log in to perform this action.' });
        return;
    }
    
    const secureHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`, 
    };

    let finalStaffId = newStaff.staffId;
    // Auto-generate ID only for new registration where no ID has been entered
    if (!isEditing && !finalStaffId) {
      finalStaffId = generateStaffId();
    }
    
    const staffToSave = { 
      ...newStaff, 
      staffId: finalStaffId,
      username: finalStaffId,
      password: newStaff.password || (isEditing ? undefined : 'password123')
    };
    
    try {
      if (isEditing) {
        // PUT request for editing
        const response = await fetch(`http://localhost:5000/api/schoolPortalStaff/${editStaffId}`, {
          method: 'PUT',
          headers: secureHeaders,
          body: JSON.stringify(staffToSave),
        });
        if (response.ok) {
          const updatedStaff = await response.json();
          setStaffs(prevStaffs =>
            prevStaffs.map(staff =>
              staff._id === updatedStaff._id ? updatedStaff : staff
            )
          );
          setMessage({ type: 'success', text: `Staff ${updatedStaff.firstname} updated successfully!` });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to update staff.' });
        }
      } else {
        // POST request for new staff
        const response = await fetch('http://localhost:5000/api/schoolPortalStaff', {
          method: 'POST',
          headers: secureHeaders,
          body: JSON.stringify(staffToSave),
        });
        if (response.ok) {
          const newStaffEntry = await response.json();
          setStaffs(prevStaffs => [...prevStaffs, newStaffEntry]);
          
          // ⭐️ NEW: Set staff data and open success modal
          setNewlyRegisteredStaff(newStaffEntry);
          setIsRegSuccessModalOpen(true);
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to add new staff.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
    }
    
    // Clear form and reset state for new registration
    setNewStaff(initialStaffState);
    setSubmitButtonText('Add Staff');
    setIsEditing(false);
    setFormErrors({});
  };
  
  const editStaff = (staffIdToEdit) => {
    const staffToEdit = staffs.find(s => s.staffId === staffIdToEdit);
    if (staffToEdit) {
      setNewStaff({ 
        ...staffToEdit, 
        // Ensure multi-select fields are arrays
        assignedSubjects: staffToEdit.assignedSubjects || [],
        assignedClasses: staffToEdit.assignedClasses || [],
        password: '' // Clear password field for security
      });
      setSubmitButtonText('Update Staff');
      setIsEditing(true);
      setEditStaffId(staffToEdit._id);
      setFormErrors({});
      setMessage(null);
    }
  };
  
  const deleteStaff = async (staffIdToDelete) => {
    setStaffToDelete(staffIdToDelete);
    setIsModalOpen(true);
  };

  // 4. FIX: Secure API call for delete
  const confirmDelete = async () => {
    setIsModalOpen(false);
    const staffToDeleteData = staffs.find(s => s.staffId === staffToDelete);
    if (!staffToDeleteData) {
      setMessage({ type: 'error', text: 'Staff not found.' });
      return;
    }
    
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        setMessage({ type: 'error', text: 'Admin token missing. Please log in to perform this action.' });
        return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/schoolPortalStaff/${staffToDeleteData._id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${adminToken}`, 
        }
      });
      if (response.ok) {
        setStaffs(prevStaffs => prevStaffs.filter(staff => staff.staffId !== staffToDelete));
        setMessage({ type: 'success', text: 'Staff deleted successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to delete staff.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setStaffToDelete(null);
  };
  
  // 5. NEW: Function to close the success modal
  const closeRegSuccessModal = () => {
      setIsRegSuccessModalOpen(false);
      setNewlyRegisteredStaff(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearchAndForm = () => {
    setSearchTerm('');
    setNewStaff(initialStaffState);
    setSubmitButtonText('Add Staff');
    setIsEditing(false);
    setFormErrors({});
    setMessage(null);
  };
  
  const filteredStaffs = staffs.filter((staff) => {
  const term = searchTerm.toLowerCase();

  return (
    (staff.firstname || "").toLowerCase().includes(term) ||
    (staff.surname || "").toLowerCase().includes(term) ||
    (staff.staffId || "").toLowerCase().includes(term) ||
    (staff.role || "").toLowerCase().includes(term)
  );
});

  const uniqueSubjects = [...new Set(subjects.map(s => s.subjectName))].sort();
  const uniqueClasses = [...new Set(students.map(s => s.studentClass))].sort();

  if (loadingStaffs) {
      return <div className="content-section">Loading staff data...</div>;
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
      <h2>Staff Management</h2>
      <div className="sub-section">
        <h3>{isEditing ? 'Edit Staff' : 'Add New Staff'}</h3>
        {message && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', color: 'white', backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545' }}>
            {message.text}
          </div>
        )}
        <form id="staffForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="surname">Surname:</label>
            <input
              type="text"
              id="surname"
              placeholder="Surname"
              required
              value={newStaff.surname}
              onChange={handleChange}
              className={formErrors.surname ? 'input-error' : ''}
            />
            {formErrors.surname && <p className="error-text">{formErrors.surname}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="firstname">First Name:</label>
            <input
              type="text"
              id="firstname"
              placeholder="First Name"
              required
              value={newStaff.firstname}
              onChange={handleChange}
              className={formErrors.firstname ? 'input-error' : ''}
            />
            {formErrors.firstname && <p className="error-text">{formErrors.firstname}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="staffId">Staff ID:</label>
            <input
              type="text"
              id="staffId"
              placeholder={isEditing ? "Staff ID" : "Staff ID (Auto-generated/Manual)"}
              value={newStaff.staffId}
              onChange={handleChange}
              readOnly={isEditing} // Assume staff ID is set on creation and shouldn't be edited
              required
              className={formErrors.staffId ? 'input-error' : ''}
            />
            {formErrors.staffId && <p className="error-text">{formErrors.staffId}</p>}
            {!isEditing && (
              <p style={{ fontSize: '0.8em', color: '#555' }}>
                * Leave blank to auto-generate: {generateStaffId()}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              required
              value={newStaff.role}
              onChange={handleChange}
              className={formErrors.role ? 'input-error' : ''}
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Support">Support Staff</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
            {formErrors.role && <p className="error-text">{formErrors.role}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender:</label>
            <select
              id="gender"
              required
              value={newStaff.gender}
              onChange={handleChange}
              className={formErrors.gender ? 'input-error' : ''}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {formErrors.gender && <p className="error-text">{formErrors.gender}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="dateOfEmployment">Date of Employment:</label>
            <input
              type="date"
              id="dateOfEmployment"
              required
              value={newStaff.dateOfEmployment}
              onChange={handleChange}
              className={formErrors.dateOfEmployment ? 'input-error' : ''}
            />
            {formErrors.dateOfEmployment && <p className="error-text">{formErrors.dateOfEmployment}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <input
              type="text"
              id="department"
              placeholder="Department (e.g., Science, Admin)"
              required
              value={newStaff.department}
              onChange={handleChange}
              className={formErrors.department ? 'input-error' : ''}
            />
            {formErrors.department && <p className="error-text">{formErrors.department}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="qualifications">Qualifications:</label>
            <input
              type="text"
              id="qualifications"
              placeholder="Qualifications (e.g., B.Sc. Comp. Sci.)"
              required
              value={newStaff.qualifications}
              onChange={handleChange}
              className={formErrors.qualifications ? 'input-error' : ''}
            />
            {formErrors.qualifications && <p className="error-text">{formErrors.qualifications}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email:</label>
            <input
              type="email"
              id="contactEmail"
              placeholder="Email Address"
              required
              value={newStaff.contactEmail}
              onChange={handleChange}
              className={formErrors.contactEmail ? 'input-error' : ''}
            />
            {formErrors.contactEmail && <p className="error-text">{formErrors.contactEmail}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone:</label>
            <input
              type="tel"
              id="contactPhone"
              placeholder="Phone Number"
              required
              value={newStaff.contactPhone}
              onChange={handleChange}
              className={formErrors.contactPhone ? 'input-error' : ''}
            />
            {formErrors.contactPhone && <p className="error-text">{formErrors.contactPhone}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password: {isEditing && <span style={{ color: '#888', fontStyle: 'italic' }}>(Leave blank to keep current)</span>}</label>
            <input
              type="password"
              id="password"
              placeholder={isEditing ? "Leave blank" : "Password"}
              required={!isEditing}
              value={newStaff.password}
              onChange={handleChange}
              className={formErrors.password ? 'input-error' : ''}
            />
            {formErrors.password && <p className="error-text">{formErrors.password}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="assignedSubjects">Assigned Subjects (Hold Ctrl/Cmd to select multiple):</label>
            <select
                id="assignedSubjects"
                multiple
                value={newStaff.assignedSubjects}
                onChange={handleChange}
            >
                {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assignedClasses">Assigned Classes (Hold Ctrl/Cmd to select multiple):</label>
            <select
                id="assignedClasses"
                multiple
                value={newStaff.assignedClasses}
                onChange={handleChange}
            >
                {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label htmlFor="resumeDocument">Resume/CV (PDF/DOCX):</label>
            <input
              type="file"
              id="resumeDocument"
              onChange={handleChange}
              accept=".pdf,.doc,.docx"
              className={formErrors.resumeDocument ? 'input-error' : ''}
            />
            {newStaff.resumeDocument && <p style={{ fontSize: '0.8em', color: '#555' }}>Selected: {newStaff.resumeDocument}</p>}
            {formErrors.resumeDocument && <p className="error-text">{formErrors.resumeDocument}</p>}
          </div>
          
          <div className="form-actions">
            <button type="submit">{submitButtonText}</button>
            <button type="button" onClick={clearSearchAndForm} className="secondary-button">Clear Form</button>
          </div>
        </form>
      </div>
      <div className="sub-section">
        <h3>Staff List ({filteredStaffs.length} Found)</h3>
        <div className="filter-controls">
          <input
            type="text"
            id="staffSearchFilter"
            placeholder="Search by Name, ID, or Role"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button onClick={clearSearchAndForm} className="secondary-button">Clear Search & Form</button>
        </div>
        <div className="table-container">
          <table id="staffTable">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Dept.</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Subjects</th>
                <th>Classes</th>
                <th>Resume</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.length > 0 ? (
                filteredStaffs.map(staff => (
                <tr key={staff._id}>
                    <td>{staff.staffId}</td>
                    <td>{staff.surname} {staff.firstname}</td>
                    <td>{staff.role}</td>
                    <td>{staff.department}</td>
                    <td>{staff.gender}</td>
                    <td>{staff.contactPhone}</td>
                    <td>{staff.contactEmail}</td>
                    <td>{staff.assignedSubjects && staff.assignedSubjects.length > 0 ? staff.assignedSubjects.join(', ') : 'N/A'}</td>
                    <td>{staff.assignedClasses && staff.assignedClasses.length > 0 ? staff.assignedClasses.join(', ') : 'N/A'}</td>
                    <td>{staff.resumeDocument ? <a href="#" onClick={(e) => { e.preventDefault(); alert(`Simulating download of: ${staff.resumeDocument}`); }}>{staff.resumeDocument}</a> : 'N/A'}</td>
                    <td className="action-buttons">
                    <button
                        className="action-btn edit-btn"
                        onClick={() => editStaff(staff.staffId)}>
                        Edit
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => deleteStaff(staff.staffId)}>
                        Delete
                    </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr>
                <td colSpan="11">No staff found.</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Existing Deletion Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        message={`Are you sure you want to delete staff with ID: ${staffToDelete}?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {/* ⭐️ NEW Registration Success Modal */}
      {newlyRegisteredStaff && (
          <ConfirmModal
              isOpen={isRegSuccessModalOpen}
              message={`Success! Staff ${newlyRegisteredStaff.firstname} ${newlyRegisteredStaff.surname} has been registered with Staff ID: ${newlyRegisteredStaff.staffId}.`}
              onConfirm={closeRegSuccessModal}
              onCancel={closeRegSuccessModal} // Both actions close the acknowledgment modal
          />
      )}
    </div>
  );
}

export default StaffManagement;