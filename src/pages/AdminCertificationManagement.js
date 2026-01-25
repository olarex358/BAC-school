// src/pages/AdminCertificationManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function AdminCertificationManagement() {
  const navigate = useNavigate();
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  // Data from localStorage
  const [certificationResults, setCertificationResults] = useLocalStorage('schoolPortalCertificationResults', [], 'http://localhost:5000/api/schoolPortalCertificationResults');
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');

  // Form states
  const [resultForm, setResultForm] = useState({
    studentAdmissionNo: '',
    subjectCode: '',
    date: '',
    objScore: '',
    theoryScore: '',
    pracScore: '',
    totalScore: 0,
    grade: '',
    qualified: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editResultId, setEditResultId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for table sorting
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

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

  // Protect the route
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'admin') {
      setLoggedInAdmin(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Helper functions
  const getStudentName = (admissionNo) => {
    const student = students.find(s => s.admissionNo === admissionNo);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };
  
  // Custom grading and qualification logic
  const calculateGradeAndQualification = (total) => {
    let grade = '';
    let qualified = false;
    const scaledScore = (total / 100) * 9;

    if (scaledScore >= 8.0) {
      grade = 'Zenith';
      qualified = true;
    } else if (scaledScore >= 6.0) {
      grade = 'Legends';
      qualified = true;
    } else if (scaledScore >= 4.0) {
      grade = 'Economy';
      qualified = true;
    } else {
      grade = 'Not Qualified';
      qualified = false;
    }
    return { grade, qualified };
  };

  const validateForm = () => {
    let errors = {};
    if (!resultForm.studentAdmissionNo) errors.studentAdmissionNo = 'Student is required.';
    if (!resultForm.subjectCode) errors.subjectCode = 'Subject is required.';
    if (!resultForm.date) errors.date = 'Date is required.';
    
    const objScore = parseFloat(resultForm.objScore);
    const theoryScore = parseFloat(resultForm.theoryScore);
    const pracScore = parseFloat(resultForm.pracScore);

    if (isNaN(objScore) || objScore < 0 || objScore > 100) errors.objScore = 'Score must be between 0 and 100.';
    if (isNaN(theoryScore) || theoryScore < 0 || theoryScore > 100) errors.theoryScore = 'Score must be between 0 and 100.';
    if (isNaN(pracScore) || pracScore < 0 || pracScore > 100) errors.pracScore = 'Score must be between 0 and 100.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setResultForm(prev => ({ ...prev, [id]: value }));
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
    
    const totalScore = parseFloat(resultForm.objScore) + parseFloat(resultForm.theoryScore) + parseFloat(resultForm.pracScore);
    const { grade, qualified } = calculateGradeAndQualification(totalScore);

    const resultToAddOrUpdate = {
      ...resultForm,
      totalScore: totalScore,
      grade: grade,
      qualified: qualified,
      timestamp: new Date().toISOString(),
    };
    
    try {
      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/schoolPortalCertificationResults/${editResultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultToAddOrUpdate),
        });
        if (response.ok) {
          const updatedResult = await response.json();
          setCertificationResults(prev =>
            prev.map(res => (res._id === updatedResult._id ? updatedResult : res))
          );
          showAlert('Certification result updated successfully!');
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to update certification result.');
        }
      } else {
        const response = await fetch('http://localhost:5000/api/schoolPortalCertificationResults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultToAddOrUpdate),
        });
        if (response.ok) {
          const newResult = await response.json();
          setCertificationResults(prev => [...prev, newResult]);
          showAlert('New certification result added successfully!');
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'Failed to add new certification result.');
        }
      }
    } catch (err) {
      showAlert('An unexpected error occurred. Please check your network connection.');
    }

    setResultForm({
      studentAdmissionNo: '',
      subjectCode: '',
      date: '',
      objScore: '',
      theoryScore: '',
      pracScore: '',
      totalScore: 0,
      grade: '',
      qualified: false,
    });
    setIsEditing(false);
    setEditResultId(null);
    setFormErrors({});
  };

  const editResult = (idToEdit) => {
    const result = certificationResults.find(res => res._id === idToEdit);
    if (result) {
      setResultForm(result);
      setIsEditing(true);
      setEditResultId(idToEdit);
      setMessage(null);
      setFormErrors({});
    }
  };

  const deleteResult = (idToDelete) => {
    showConfirm(
      'Are you sure you want to delete this result?',
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/schoolPortalCertificationResults/${idToDelete}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setCertificationResults(prev => prev.filter(res => res._id !== idToDelete));
            showAlert('Certification result deleted successfully!');
          } else {
            const errorData = await response.json();
            showAlert(errorData.message || 'Failed to delete certification result.');
          }
        } catch (err) {
          showAlert('An unexpected error occurred. Please check your network connection.');
        }
      }
    );
  };

  const clearForm = () => {
    setResultForm({
      studentAdmissionNo: '',
      subjectCode: '',
      date: '',
      objScore: '',
      theoryScore: '',
      pracScore: '',
      totalScore: 0,
      grade: '',
      qualified: false,
    });
    setIsEditing(false);
    setEditResultId(null);
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

  const sortedResults = [...certificationResults]
    .filter(res =>
      getStudentName(res.studentAdmissionNo).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectName(res.subjectCode).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let keyA = a[sortConfig.key];
      let keyB = b[sortConfig.key];
      
      // Special handling for nested values (student name) and dates
      if (sortConfig.key === 'studentAdmissionNo') {
        keyA = getStudentName(keyA);
        keyB = getStudentName(keyB);
      } else if (sortConfig.key === 'date') {
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

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => { modalAction(); setIsModalOpen(false); }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>Certification Management</h1>
      <div className="sub-section">
        <h2>{isEditing ? 'Edit Certification Result' : 'Add New Certification Result'}</h2>
        {message && (
          <div className={`form-message form-message-${message.type}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="cert-form">
          <div className="form-group">
            <label htmlFor="studentAdmissionNo" className="form-label">Student:</label>
            <select
              id="studentAdmissionNo"
              value={resultForm.studentAdmissionNo}
              onChange={handleChange}
              disabled={isEditing}
              className={`form-input ${formErrors.studentAdmissionNo ? 'form-input-error' : ''}`}
            >
              <option value="">-- Select Student --</option>
              {students.map(student => (
                <option key={student._id} value={student.admissionNo}>
                  {getStudentName(student.admissionNo)}
                </option>
              ))}
            </select>
            {formErrors.studentAdmissionNo && <p className="error-message">{formErrors.studentAdmissionNo}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="subjectCode" className="form-label">Subject:</label>
            <select
              id="subjectCode"
              value={resultForm.subjectCode}
              onChange={handleChange}
              disabled={isEditing}
              className={`form-input ${formErrors.subjectCode ? 'form-input-error' : ''}`}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject.subjectCode}>{getSubjectName(subject.subjectCode)}</option>
              ))}
            </select>
            {formErrors.subjectCode && <p className="error-message">{formErrors.subjectCode}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">Date:</label>
            <input
              type="date"
              id="date"
              value={resultForm.date}
              onChange={handleChange}
              className={`form-input ${formErrors.date ? 'form-input-error' : ''}`}
            />
            {formErrors.date && <p className="error-message">{formErrors.date}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="objScore" className="form-label">Obj Score:</label>
            <input
              type="number"
              id="objScore"
              value={resultForm.objScore}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="Objective Score"
              className={`form-input ${formErrors.objScore ? 'form-input-error' : ''}`}
            />
            {formErrors.objScore && <p className="error-message">{formErrors.objScore}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="theoryScore" className="form-label">Theory Score:</label>
            <input
              type="number"
              id="theoryScore"
              value={resultForm.theoryScore}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="Theory Score"
              className={`form-input ${formErrors.theoryScore ? 'form-input-error' : ''}`}
            />
            {formErrors.theoryScore && <p className="error-message">{formErrors.theoryScore}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="pracScore" className="form-label">Practical Score:</label>
            <input
              type="number"
              id="pracScore"
              value={resultForm.pracScore}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="Practical Score"
              className={`form-input ${formErrors.pracScore ? 'form-input-error' : ''}`}
            />
            {formErrors.pracScore && <p className="error-message">{formErrors.pracScore}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="form-submit-btn">
              {isEditing ? 'Update Result' : 'Add Result'}
            </button>
            <button type="button" onClick={clearForm} className="form-clear-btn">
              Clear Form
            </button>
          </div>
        </form>
      </div>

      <div className="sub-section">
        <h2>All Certification Results</h2>
        <input
          type="text"
          placeholder="Search by student or subject"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />
        <div className="table-container">
          <table className="cert-table">
            <thead>
              <tr>
                <th onClick={() => sortTable('studentAdmissionNo')}>Student Name (ID) {sortConfig.key === 'studentAdmissionNo' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th onClick={() => sortTable('subjectCode')}>Subject {sortConfig.key === 'subjectCode' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th onClick={() => sortTable('date')}>Date {sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}</th>
                <th>Obj</th>
                <th>Theory</th>
                <th>Prac</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Qualified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.length > 0 ? (
                sortedResults.map((res, index) => (
                  <tr key={res._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>{getStudentName(res.studentAdmissionNo)}</td>
                    <td>{getSubjectName(res.subjectCode)}</td>
                    <td>{res.date}</td>
                    <td>{res.objScore}</td>
                    <td>{res.theoryScore}</td>
                    <td>{res.pracScore}</td>
                    <td><strong>{res.totalScore}</strong></td>
                    <td className={`grade-status grade-${res.grade.toLowerCase().replace(' ', '-')}`}><strong>{res.grade}</strong></td>
                    <td className={`qualified-status qualified-${res.qualified}`}>{res.qualified ? 'Yes' : 'No'}</td>
                    <td className="table-actions">
                      <button className="action-btn edit-btn" onClick={() => editResult(res._id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => deleteResult(res._id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">No certification results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminCertificationManagement;
