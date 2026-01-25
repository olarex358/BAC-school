// src/components/StudentFormModal.js
import React, { useState, useEffect } from 'react';

// --- Inline Styles for Modal ---
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  minWidth: '400px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
};

const formGroupStyle = {
    marginBottom: '15px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
};

const errorTextStyle = {
    color: '#dc3545',
    marginBottom: '15px',
    fontWeight: '500'
};

const buttonContainerStyle = {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
};

// --- Custom Validation Functions ---

// Simple email format check
const isValidEmail = (email) => {
  // Regex: allows local-part@domain.tld, basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Simple check for phone number (digits, spaces, hyphens, parentheses)
const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone.trim());
};


function StudentFormModal({ isOpen, onClose, onSubmit, initialData, isEdit }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    class: '',
    email: '',
    phone: '',
    // Initialize with data if available (for edit mode)
    ...initialData,
  });
  
  // New state to manage form validation errors
  const [validationError, setValidationError] = useState('');

  // Ensure form is updated when initialData changes (for Edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        name: initialData.name || '',
        class: initialData.class || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
      });
    } else {
      // Clear form for Add mode
      setFormData({ id: '', name: '', class: '', email: '', phone: '' });
    }
    // Clear any previous error when modal data changes
    setValidationError(''); 
  }, [initialData]);

  // Render nothing if the modal is not open
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // FIX 1: Ensure value is treated as an empty string if it's null/undefined
    const stringValue = value || ''; 
    
    // FIX 2: Removed trimStart() here. We rely on .trim() in handleSubmit 
    // to prevent the uncontrolled to controlled warning.
    setFormData(prev => ({ ...prev, [name]: stringValue })); 
    
    // Clear error message when the user starts typing
    if (validationError) setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a final, trimmed version of the data for validation and submission
    const finalData = {
        ...formData,
        // Ensure all values are strings before calling trim
        name: (formData.name || '').trim(), 
        class: (formData.class || '').trim(),
        email: (formData.email || '').trim(),
        phone: (formData.phone || '').trim() 
    };

    // --- 1. Required Field Validation ---
    const missingFields = [];
    if (!finalData.name) missingFields.push('Name');
    if (!finalData.class) missingFields.push('Class');
    if (!finalData.email) missingFields.push('Email');

    if (missingFields.length > 0) {
      setValidationError(`Please fill in the required field(s): ${missingFields.join(', ')}.`);
      return; // Stop submission
    }

    // --- 2. Format Validation ---
    if (!isValidEmail(finalData.email)) {
      setValidationError('Please enter a valid email address.');
      return; // Stop submission
    }

    if (!isValidPhone(finalData.phone)) {
        setValidationError('Phone number format is invalid. Use only digits, spaces, and hyphens/parentheses.');
        return; // Stop submission
    }
    
    // Clear validation error if all checks pass
    setValidationError('');
    // Call the onSubmit handler passed from the parent with the clean, trimmed data
    onSubmit(finalData);
  };
  
  // Custom message box logic to replace 'alert' for confirmation/error on delete
  const showCustomAlert = (message) => {
    // In a real application, you would use a dedicated UI component here.
    // For now, we'll log to console and rely on the UI refresh.
    console.log(`[Modal Alert] ${message}`);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>{isEdit ? `Edit Student: ${initialData?.name}` : 'Add New Student'}</h3>
        <form onSubmit={handleSubmit}>
          
          {/* Display validation error message if it exists */}
          {validationError && (
            <p style={errorTextStyle}>{validationError}</p>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="name">Name</label>
            <input 
              style={inputStyle} 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required
            />
          </div>
          
          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="class">Class</label>
            <input 
              style={inputStyle} 
              type="text" 
              name="class" 
              value={formData.class} 
              onChange={handleChange} 
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input 
              style={inputStyle} 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="phone">Phone</label>
            <input 
              style={inputStyle} 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>

          <div style={buttonContainerStyle}>
            <button type="button" onClick={onClose} style={{ ...inputStyle, width: 'auto', backgroundColor: '#6c757d', color: 'white' }}>Cancel</button>
            <button type="submit" style={{ ...inputStyle, width: 'auto', backgroundColor: '#007bff', color: 'white', marginLeft: '10px' }}>
              {isEdit ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentFormModal;
