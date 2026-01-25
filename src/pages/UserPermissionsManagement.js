// src/pages/UserPermissionsManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage'; // Still useful for local data handling
import ConfirmModal from '../components/ConfirmModal';


function UserPermissionsManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // 1. Data State (Using useLocalStorage for local state, fetching via useEffect)
  const [users, setUsers] = useLocalStorage('schoolPortalUsers', []);

  // NEW: State for API loading and fetching errors.
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const initialUserState = {
    username: '',
    password: '',
    role: ''
  };

  const [newUser, setNewUser] = useState(initialUserState);
  const [submitButtonText, setSubmitButtonText] = useState('Add User');
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null); // To store the MongoDB _id
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 2. MODAL STATE AND HELPERS (For alerts and confirmations)
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

  // 3. CRITICAL FIX: Secure Fetch for Initial Data (GET)
  const fetchUsers = async () => {
    const adminToken = localStorage.getItem('adminToken');
    setLoadingUsers(true);
    setFetchError(null);

    if (!adminToken) {
        setFetchError('No Admin Token found. Please log in to view users.');
        setLoadingUsers(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/schoolPortalUsers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch users (Status: ${response.status}).`);
        }

        const data = await response.json();
        setUsers(data);

    } catch (err) {
        setFetchError(err.message || 'An unexpected error occurred during user fetch.');
        console.error('Fetch error:', err);
    } finally {
        setLoadingUsers(false);
    }
  };


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'admin') {
      setLoggedInAdmin(user);
    } else {
      navigate('/login');
      return;
    }

    fetchUsers();

  }, []);


  const validateForm = () => {
    let errors = {};
    if (!newUser.username.trim()) errors.username = 'Username is required.';
    if (!isEditing && !newUser.password.trim()) errors.password = 'Password is required for new users.';
    if (!newUser.role) errors.role = 'Role is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setNewUser(prevUser => ({
      ...prevUser,
      [id]: value
    }));
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [id]: ''
    }));
  };

  // 4. CRITICAL FIX: Secure API call for submit (POST/PUT) - Now uses showAlert
  const handleSubmit = async (e) => {
    e.preventDefault();
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

    const payload = { ...newUser };
    if (isEditing && !payload.password) {
        // Remove password from payload if editing and it's blank
        delete payload.password;
    }


    try {
        if (isEditing) {
            const response = await fetch(`http://localhost:5000/api/schoolPortalUsers/${editUserId}`, {
                method: 'PUT',
                headers: secureHeaders,
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                // Refresh data after successful update
                await fetchUsers();
                showAlert(`User **${newUser.username}** permissions updated successfully!`); // Success Alert
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to update user.');
            }
        } else {
            const response = await fetch('http://localhost:5000/api/schoolPortalUsers', {
                method: 'POST',
                headers: secureHeaders,
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                // Refresh data after successful creation
                await fetchUsers();
                showAlert(`New Admin User **${newUser.username}** added successfully!`); // Success Alert
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to add new user. Check if the username is already in use.');
            }
        }
    } catch (err) {
        showAlert('An unexpected error occurred. Please check your network connection.');
    }

    // Reset form state
    setNewUser(initialUserState);
    setSubmitButtonText('Add User');
    setIsEditing(false);
    setEditUserId(null);
    setFormErrors({});
  };

  const editUser = (usernameToEdit) => {
    const userToEdit = users.find(u => u.username === usernameToEdit);
    if (userToEdit) {
      setNewUser({
          username: userToEdit.username,
          password: '', // Password is reset when editing for security
          role: userToEdit.role,
      });
      setSubmitButtonText('Update Permissions');
      setIsEditing(true);
      setEditUserId(userToEdit._id);
      setFormErrors({});
      // Optional: scroll to form
      document.querySelector('.sub-section').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 5. CRITICAL FIX: Secure API call for delete - Now uses showConfirm
  const deleteUser = (usernameToDelete) => {
    showConfirm(
      `Are you sure you want to delete admin user: **${usernameToDelete}**? This action cannot be undone.`,
      async () => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            showAlert('Authentication failed: Admin token missing. Please log in.');
            return;
        }

        const userToDelete = users.find(u => u.username === usernameToDelete);
        if (!userToDelete) {
            showAlert('User not found.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/schoolPortalUsers/${userToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`, // CRITICAL FIX
                }
            });
            if (response.status === 204 || response.ok) {
                // Filter locally on success
                setUsers(prevUsers => prevUsers.filter(user => user.username !== usernameToDelete));
                showAlert(`User **${usernameToDelete}** deleted successfully!`); // Success Alert
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || 'Failed to delete user.');
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
    setNewUser(initialUserState);
    setSubmitButtonText('Add User');
    setIsEditing(false);
    setEditUserId(null);
    setFormErrors({});
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loggedInAdmin || loadingUsers) {
    return <div className="content-section">Loading user data...</div>;
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
      {/* RENDER THE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => { modalAction(); setIsModalOpen(false); }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>User & Permissions Management</h1>
      
      <div className="sub-section">
        <h2>{isEditing ? 'Update User Permissions' : 'Add New Admin User'}</h2>
        
        <form id="userPermissionsForm" onSubmit={handleSubmit} className="user-form">
          
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Unique Username"
              value={newUser.username}
              onChange={handleChange}
              readOnly={isEditing}
              disabled={isEditing}
              className={`form-input ${formErrors.username ? 'form-input-error' : ''} ${isEditing ? 'form-input-disabled' : ''}`}
            />
            {formErrors.username && <p className="error-message">{formErrors.username}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">{isEditing ? 'New Password (Leave blank to keep current)' : 'Password'}:</label>
            <input
              type="password"
              id="password"
              placeholder={isEditing ? '********' : 'Password'}
              value={newUser.password}
              onChange={handleChange}
              className={`form-input ${formErrors.password ? 'form-input-error' : ''}`}
            />
            {formErrors.password && <p className="error-message">{formErrors.password}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="role" className="form-label">Role:</label>
            <select
              id="role"
              value={newUser.role}
              onChange={handleChange}
              className={`form-input ${formErrors.role ? 'form-input-error' : ''}`}
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Student Manager">Student Manager</option>
              <option value="Staff Manager">Staff Manager</option>
              <option value="Results Manager">Results Manager</option>
              <option value="Academic Manager">Academic Manager</option>
              <option value="Fee Manager">Fee Manager</option>
              <option value="View Reports">View Reports Only</option>
              {/* Add other roles like HR, Bursar, etc. as needed */}
            </select>
            {formErrors.role && <p className="error-message">{formErrors.role}</p>}
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
        <h2>Existing Admin Users</h2>
        <div className="filter-controls">
          <input
            type="text"
            id="userSearchFilter"
            placeholder="Search by Username or Role"
            value={searchTerm}
            onChange={handleSearchChange}
            className="filter-input"
          />
          <button onClick={clearSearchAndForm} className="filter-clear-btn">
            Clear Filter / Reset Form
          </button>
        </div>
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td className="table-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => editUser(user.username)}>
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteUser(user.username)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">No admin users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserPermissionsManagement;