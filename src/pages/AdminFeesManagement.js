// src/pages/AdminFeesManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function AdminFeesManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // Update hooks to get data from the backend
  const [feeRecords, setFeeRecords, loadingFees] = useLocalStorage('schoolPortalFeeRecords', [], 'http://localhost:5000/api/schoolPortalFeeRecords');
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');

  const [feeForm, setFeeForm] = useState({
    feeType: '',
    amount: '',
    dueDate: '',
    status: 'Unpaid',
    paymentChannel: '',
    notes: '',
    isGeneralFee: true,
    studentId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFeeRecordId, setEditFeeRecordId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueFeeTypes = ['Tuition Fee', 'Development Levy', 'Sport & Extra-curricular', 'Exam Fee', 'Other'];
  const paymentChannels = ['Bank Transfer', 'Cash', 'Online Payment Gateway'];

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
    if (!feeForm.feeType) errors.feeType = 'Fee type is required.';
    if (!feeForm.amount || parseFloat(feeForm.amount) <= 0) errors.amount = 'Amount must be a positive number.';
    if (!feeForm.dueDate) errors.dueDate = 'Due date is required.';
    if (!feeForm.status) errors.status = 'Status is required.';
    if (feeForm.status !== 'Unpaid' && !feeForm.paymentChannel) errors.paymentChannel = 'Payment channel is required if not unpaid.';
    if (!feeForm.isGeneralFee && !feeForm.studentId) errors.studentId = 'Please select a student for individual fees.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFeeForm(prev => ({
        ...prev,
        [id]: checked,
        studentId: checked ? '' : prev.studentId
      }));
    } else {
      setFeeForm(prev => ({ ...prev, [id]: value }));
    }
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
    const feeRecordToAddOrUpdate = {
      ...feeForm,
      amount: parseFloat(feeForm.amount),
      timestamp: new Date().toISOString()
    };
    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/schoolPortalFeeRecords/${editFeeRecordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feeRecordToAddOrUpdate),
        });
        if (response.ok) {
          const updatedRecord = await response.json();
          setFeeRecords(prevRecords =>
            prevRecords.map(rec =>
              rec._id === updatedRecord._id ? updatedRecord : rec
            )
          );
          setMessage({ type: 'success', text: 'Fee record updated successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to update fee record.' });
        }
      } else {
        const response = await fetch('http://localhost:5000/api/schoolPortalFeeRecords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feeRecordToAddOrUpdate),
        });
        if (response.ok) {
          const newRecord = await response.json();
          setFeeRecords(prevRecords => [...prevRecords, newRecord]);
          setMessage({ type: 'success', text: 'Fee record added successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to add new fee record.' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
    }
    
    setFeeForm({
      feeType: '',
      amount: '',
      dueDate: '',
      status: 'Unpaid',
      paymentChannel: '',
      notes: '',
      isGeneralFee: true,
      studentId: ''
    });
    setIsEditing(false);
    setEditFeeRecordId(null);
    setFormErrors({});
  };

  const editFeeRecord = (idToEdit) => {
    const record = feeRecords.find(rec => rec.id === idToEdit);
    if (record) {
      setFeeForm(record);
      setIsEditing(true);
      setEditFeeRecordId(record._id);
      setMessage(null);
      setFormErrors({});
    }
  };

  const deleteFeeRecord = async (idToDelete) => {
    if (window.confirm('Are you sure you want to delete this fee record?')) {
      const recordToDelete = feeRecords.find(rec => rec.id === idToDelete);
      if (!recordToDelete) {
        setMessage({ type: 'error', text: 'Record not found.' });
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/schoolPortalFeeRecords/${recordToDelete._id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setFeeRecords(prevRecords => prevRecords.filter(rec => rec.id !== idToDelete));
          setMessage({ type: 'success', text: 'Fee record deleted successfully!' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.message || 'Failed to delete fee record.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'An unexpected error occurred. Please check your network connection.' });
      }
    }
  };

  const clearForm = () => {
    setFeeForm({
      feeType: '',
      amount: '',
      dueDate: '',
      status: 'Unpaid',
      paymentChannel: '',
      notes: '',
      isGeneralFee: true,
      studentId: ''
    });
    setIsEditing(false);
    setEditFeeRecordId(null);
    setFormErrors({});
    setMessage(null);
  };

  const getStudentName = (admissionNo) => {
    const student = students.find(s => s.admissionNo === admissionNo);
    return student ? `${student.firstName} ${student.lastName} (${student.admissionNo})` : 'Unknown Student';
  };

  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesSearch = searchTerm ?
      (record.feeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.studentId && getStudentName(record.studentId).toLowerCase().includes(searchTerm.toLowerCase())))
      : true;
    return matchesSearch;
  });

  if (!loggedInAdmin) {
    return <div className="content-section">Access Denied. Please log in as an Admin.</div>;
  }

  if (loadingFees) {
    return <div className="content-section">Loading fee data...</div>;
  }

  return (
    <div className="content-section">
      <h1>Fee Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Fee Record' : 'Add New Fee Record'}</h2>
        {message && (
          <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '5px', color: 'white', backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px', flex: '1 1 100%' }}>
            <label style={{ marginRight: '15px' }}>Fee Scope:</label>
            <input
              type="checkbox"
              id="isGeneralFee"
              checked={feeForm.isGeneralFee}
              onChange={handleChange}
              style={{ width: 'auto', marginRight: '5px' }}
            />
            <label htmlFor="isGeneralFee" style={{ display: 'inline' }}>General Fee (for all students)</label>
          </div>
          {!feeForm.isGeneralFee && (
            <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
              <label htmlFor="studentId" style={{ display: 'block', marginBottom: '5px' }}>Select Student:</label>
              <select
                id="studentId"
                value={feeForm.studentId}
                onChange={handleChange}
                required={!feeForm.isGeneralFee}
                style={{ borderColor: formErrors.studentId ? 'red' : '' }}
              >
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s.admissionNo} value={s.admissionNo}>{getStudentName(s.admissionNo)}</option>
                ))}
              </select>
              {formErrors.studentId && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.studentId}</p>}
            </div>
          )}
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="feeType" style={{ display: 'block', marginBottom: '5px' }}>Fee Type:</label>
            <select
              id="feeType"
              value={feeForm.feeType}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.feeType ? 'red' : '' }}
            >
              <option value="">-- Select Fee Type --</option>
              {uniqueFeeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {formErrors.feeType && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.feeType}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px' }}>Amount (₦):</label>
            <input
              type="number"
              id="amount"
              value={feeForm.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="e.g., 150000.00"
              style={{ borderColor: formErrors.amount ? 'red' : '' }}
            />
            {formErrors.amount && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.amount}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="dueDate" style={{ display: 'block', marginBottom: '5px' }}>Due Date:</label>
            <input
              type="date"
              id="dueDate"
              value={feeForm.dueDate}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.dueDate ? 'red' : '' }}
            />
            {formErrors.dueDate && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.dueDate}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="status" style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
            <select
              id="status"
              value={feeForm.status}
              onChange={handleChange}
              required
              style={{ borderColor: formErrors.status ? 'red' : '' }}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
            {formErrors.status && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.status}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 calc(50% - 7.5px)' }}>
            <label htmlFor="paymentChannel" style={{ display: 'block', marginBottom: '5px' }}>Payment Channel (if paid/partially paid):</label>
            <select
              id="paymentChannel"
              value={feeForm.paymentChannel}
              onChange={handleChange}
              required={feeForm.status !== 'Unpaid'}
              style={{ borderColor: formErrors.paymentChannel ? 'red' : '' }}
            >
              <option value="">-- Select Channel --</option>
              {paymentChannels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
            {formErrors.paymentChannel && <p style={{ color: 'red', fontSize: '0.8em' }}>{formErrors.paymentChannel}</p>}
          </div>
          <div style={{ marginBottom: '10px', flex: '1 1 100%' }}>
            <label htmlFor="notes" style={{ display: 'block', marginBottom: '5px' }}>Notes (Optional):</label>
            <textarea
              id="notes"
              value={feeForm.notes}
              onChange={handleChange}
              placeholder="Add any relevant notes about the fee or payment."
              rows="3"
            ></textarea>
          </div>
          <button type="submit" style={{ flex: '1 1 calc(50% - 7.5px)' }}>{isEditing ? 'Update Fee Record' : 'Add Fee Record'}</button>
          <button type="button" onClick={clearForm} style={{ flex: '1 1 calc(50% - 7.5px)', backgroundColor: '#6c757d', borderColor: '#6c757d' }}>Clear Form</button>
        </form>
      </div>
      <div className="sub-section">
        <h2>All Fee Records</h2>
        <input
          type="text"
          placeholder="Search by Fee Type or Student ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
        />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Scope</th>
                <th>Student (ID)</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeRecords.length > 0 ? (
                filteredFeeRecords.map(record => (
                  <tr key={record._id}>
                    <td>{record.isGeneralFee ? 'General' : 'Individual'}</td>
                    <td>{record.isGeneralFee ? 'All Students' : getStudentName(record.studentId)}</td>
                    <td>{record.feeType}</td>
                    <td>₦{record.amount.toLocaleString()}</td>
                    <td>{record.dueDate}</td>
                    <td style={{ color: record.status === 'Paid' ? 'green' : record.status === 'Partially Paid' ? 'orange' : 'red' }}>{record.status}</td>
                    <td>{record.paymentChannel || 'N/A'}</td>
                    <td>{record.notes || 'N/A'}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => editFeeRecord(record.id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteFeeRecord(record.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No fee records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminFeesManagement;