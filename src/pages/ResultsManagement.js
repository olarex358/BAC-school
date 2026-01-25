// src/pages/ResultsManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = 'http://localhost:5000/api';

function ResultsManagement() {
  const navigate = useNavigate();
  const { user, token } = useAuth(); 

  // Primary Data State
  const [approvedResults, setApprovedResults] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  
  // Supporting Data States
  const [students, setStudents] = useState([]); 
  const [subjects, setSubjects] = useState([]); 
  const [staffs, setStaffs] = useState([]); 

  // UI/Status States
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingSupportingData, setLoadingSupportingData] = useState(true);
  const [fetchError, setFetchError] = useState(null); 
  const [message, setMessage] = useState(null);

  const initialResultState = {
    classSelect: '',
    studentAdmissionNo: '', 
    subjectSelect: '', 
    termSelect: '',
    academicYear: new Date().getFullYear().toString(),
    // Core scores are initialized as empty strings to allow individual entry
    firstCaScore: '', // Max 20
    secondCaScore: '', // Max 20
    assignmentScore: '', // Max 10
    examScore: '', // Max 50
    totalScore: 0,
    grade: '',
    status: 'Pending',
    submittedBy: user?.username || '',
    submittedByType: user?.type || '',
  };

  const [newResult, setNewResult] = useState(initialResultState);
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editResultMongoId, setEditResultMongoId] = useState(null); 
  const [editResultIsPending, setEditResultIsPending] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Helper Functions ---
  
  /**
   * Calculates Total Score (out of 100) and Grade based on standard school metrics.
   * Treats empty score strings as 0 for calculation.
   */
  const calculateTotalAndGrade = useCallback((result) => {
    // Treat empty strings as 0 to allow individual score entry
    const ca1 = Number(result.firstCaScore || 0);
    const ca2 = Number(result.secondCaScore || 0);
    const assignment = Number(result.assignmentScore || 0);
    const exam = Number(result.examScore || 0);

    const total = ca1 + ca2 + assignment + exam;
    let grade = '';

    if (total >= 75) grade = 'A';
    else if (total >= 65) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';
    else grade = 'F';

    return { totalScore: total, grade: grade };
  }, []);

  const getStudentName = (admissionNo) => {
    const student = students.find(s => s.admissionNo === admissionNo);
    return student ? `${student.lastName}, ${student.firstName}` : admissionNo;
  };

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };
  
  /**
   * Permission Check: Only Super Admin OR the assigned teacher for the subject can submit.
   */
  const userCanSubmitForSubject = useCallback((subjectCode) => {
    if (!subjectCode) return false;

    // 1. Super Admin bypasses all checks
    if (user?.role === 'Super Admin') {
        return true;
    }

    // 2. Staff/Teacher Check
    if (user?.type === 'staff' && user?.staffId) {
        const loggedInStaff = staffs.find(s => s.staffId === user.staffId);

        if (loggedInStaff && loggedInStaff.assignedSubjects && Array.isArray(loggedInStaff.assignedSubjects)) {
            // Check if the selected subject is one of their assigned subjects
            return loggedInStaff.assignedSubjects.includes(subjectCode);
        }
    }
    
    return false;
  }, [user, staffs]);


  // --- Data Fetching Logic ---
  const fetchResults = useCallback(async () => {
    if (!token) {
      setFetchError('Authentication token missing. Please log in.');
      setLoadingResults(false);
      return;
    }
    setLoadingResults(true);
    setFetchError(null);
    try {
      // 1. Fetch Approved Results
      const approvedRes = await axios.get(`${API_BASE_URL}/schoolPortalResults`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApprovedResults(approvedRes.data);

      // 2. Fetch Pending Results
      const pendingRes = await axios.get(`${API_BASE_URL}/schoolPortalPendingResults`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPendingResults(pendingRes.data);
      
    } catch (err) {
      console.error('Results Fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch results data.';
      setFetchError(errorMessage);
    } finally {
      setLoadingResults(false);
    }
  }, [token]);

  const fetchSupportingData = useCallback(async (dataName, setState) => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/${dataName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setState(response.data);
    } catch (err) {
      console.error(`Error fetching ${dataName}:`, err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchResults();
      
      const fetchAllSupportingData = async () => {
          await Promise.all([
              fetchSupportingData('schoolPortalStudents', setStudents),
              fetchSupportingData('schoolPortalSubjects', setSubjects),
              fetchSupportingData('schoolPortalStaff', setStaffs)
          ]);
          setLoadingSupportingData(false);
      };
      
      fetchAllSupportingData();
    }
  }, [token, fetchResults, fetchSupportingData]);


  // --- Form Handling ---
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Allow empty string for scores (important for individual entry) but strip non-numeric
    const isScoreField = ['firstCaScore', 'secondCaScore', 'assignmentScore', 'examScore'].includes(name);
    const cleanValue = isScoreField ? value.replace(/[^0-9]/g, '') : value;
    
    const updatedResult = { ...newResult, [name]: cleanValue };
    
    // Auto-calculate total and grade on score change
    if (isScoreField) {
        const { totalScore, grade } = calculateTotalAndGrade(updatedResult);
        updatedResult.totalScore = totalScore;
        updatedResult.grade = grade;
    }
    
    // Auto-set class on student selection
    if (name === 'studentAdmissionNo' && cleanValue) {
        const student = students.find(s => s.admissionNo === cleanValue);
        if (student) updatedResult.classSelect = student.studentClass;
    }

    setNewResult(updatedResult);
    setFormErrors(prev => ({ ...prev, [name]: null }));
    setMessage(null);
  };
  
  const validateForm = () => {
    const errors = {};
    if (!newResult.studentAdmissionNo) errors.studentAdmissionNo = 'Student is required.';
    if (!newResult.subjectSelect) errors.subjectSelect = 'Subject is required.';
    if (!newResult.termSelect) errors.termSelect = 'Term is required.';
    if (!newResult.academicYear) errors.academicYear = 'Academic Year is required.';
    
    // Basic score validation (Allow empty, but if present, check max)
    const checkMaxScore = (score, max) => {
        const numScore = Number(score || 0);
        if (numScore > max) return `Score cannot exceed ${max}.`;
        return null;
    }

    if (checkMaxScore(newResult.firstCaScore, 20)) errors.firstCaScore = `1st CA ${checkMaxScore(newResult.firstCaScore, 20)}`;
    if (checkMaxScore(newResult.secondCaScore, 20)) errors.secondCaScore = `2nd CA ${checkMaxScore(newResult.secondCaScore, 20)}`;
    if (checkMaxScore(newResult.assignmentScore, 10)) errors.assignmentScore = `Assignment ${checkMaxScore(newResult.assignmentScore, 10)}`;
    if (checkMaxScore(newResult.examScore, 50)) errors.examScore = `Exam ${checkMaxScore(newResult.examScore, 50)}`;

    // Check if total score exceeds 100
    if (newResult.totalScore > 100) {
        errors.totalScore = `Total score (${newResult.totalScore}) cannot exceed 100.`;
    }
    
    // Critical Permission Check
    if (!userCanSubmitForSubject(newResult.subjectSelect)) {
        errors.subjectSelect = 'You do not have permission to submit results for this subject. Only Super Admin or the assigned teacher is allowed.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setMessage(null);
    const resultData = { 
        ...newResult,
        // Convert empty strings to 0 for database consistency on submission
        firstCaScore: Number(newResult.firstCaScore || 0),
        secondCaScore: Number(newResult.secondCaScore || 0),
        assignmentScore: Number(newResult.assignmentScore || 0),
        examScore: Number(newResult.examScore || 0),
    };
    
    // Re-calculate total/grade one last time for safety
    const { totalScore, grade } = calculateTotalAndGrade(resultData);
    resultData.totalScore = totalScore;
    resultData.grade = grade;
    
    const endpoint = isEditing && !editResultIsPending 
                     ? `${API_BASE_URL}/schoolPortalResults/${editResultMongoId}` 
                     : isEditing && editResultIsPending
                     ? `${API_BASE_URL}/schoolPortalPendingResults/${editResultMongoId}` 
                     : `${API_BASE_URL}/schoolPortalPendingResults`; 

    const method = isEditing ? 'put' : 'post';
    
    try {
        await axios({
            method: method,
            url: endpoint,
            data: resultData,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        setMessage(`Result for ${getStudentName(resultData.studentAdmissionNo)} (${getSubjectName(resultData.subjectSelect)}) ${isEditing ? 'updated' : 'submitted'} successfully!`);
        
        // Reset form state
        setNewResult(initialResultState);
        setIsEditing(false);
        setEditResultMongoId(null);
        setEditResultIsPending(false);
        setFormErrors({});
        fetchResults(); 

    } catch (err) {
        console.error('Submission error:', err.response || err);
        const errorMsg = err.response?.data?.message || err.message || 'An error occurred during submission.';
        setMessage({ type: 'error', text: errorMsg });
    }
  };

  // --- Edit Logic ---
  const editResult = (mongoId, isPendingEntry) => {
    const resultsArray = isPendingEntry ? pendingResults : approvedResults;
    const resultToEdit = resultsArray.find(r => r._id === mongoId);
    
    if (resultToEdit) {
      setEditResultMongoId(resultToEdit._id); 
      setEditResultIsPending(isPendingEntry);
      
      // Load all scores as strings for display, using toString() to ensure state is consistent
      setNewResult({
        classSelect: resultToEdit.classSelect || '',
        studentAdmissionNo: resultToEdit.studentAdmissionNo || '',
        subjectSelect: resultToEdit.subjectSelect || '',
        termSelect: resultToEdit.termSelect || '',
        academicYear: resultToEdit.academicYear || new Date().getFullYear().toString(),
        firstCaScore: (resultToEdit.firstCaScore || 0).toString(),
        secondCaScore: (resultToEdit.secondCaScore || 0).toString(),
        assignmentScore: (resultToEdit.assignmentScore || 0).toString(),
        examScore: (resultToEdit.examScore || 0).toString(),
        totalScore: resultToEdit.totalScore || 0,
        grade: resultToEdit.grade || '',
        status: resultToEdit.status || 'Pending',
        submittedBy: resultToEdit.submittedBy || user?.username || '',
        submittedByType: resultToEdit.submittedByType || user?.type || '',
      });
      setIsEditing(true);
      window.scrollTo(0, 0); 
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewResult(initialResultState);
    setEditResultMongoId(null);
    setEditResultIsPending(false);
    setFormErrors({});
  };

  // --- Approval/Delete Logic (Admin/Manager Roles) ---
  const handleApproval = async (resultId, action) => {
    if (!token) return;
    
    const resultToUpdate = pendingResults.find(r => r._id === resultId);
    if (!resultToUpdate) {
        setMessage({ type: 'error', text: 'Result not found in pending list.' });
        return;
    }

    setMessage(null);
    
    try {
        if (action === 'Approve') {
            await axios.post(`${API_BASE_URL}/schoolPortalResults/approve/${resultId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: `Result for ${getStudentName(resultToUpdate.studentAdmissionNo)} Approved successfully!` });
            
        } else if (action === 'Reject') {
            await axios.delete(`${API_BASE_URL}/schoolPortalPendingResults/${resultId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: `Result for ${getStudentName(resultToUpdate.studentAdmissionNo)} Rejected and removed.` });

        }
        
        fetchResults(); 
    } catch (err) {
        console.error(`${action} error:`, err.response || err);
        const errorMsg = err.response?.data?.message || err.message || `An error occurred during ${action.toLowerCase()}.`;
        setMessage({ type: 'error', text: errorMsg });
    }
  };

  const deleteResult = async (mongoId) => {
    if (!window.confirm("Are you sure you want to permanently delete this APPROVED result?")) return;
    
    setMessage(null);
    try {
      await axios.delete(`${API_BASE_URL}/schoolPortalResults/${mongoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: `Approved result deleted successfully!` });
      fetchResults(); 
    } catch (err) {
      console.error('Delete error:', err.response || err);
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred during deletion.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };
  
  // --- Filtering and Rendering ---
  
  const allResults = [...pendingResults, ...approvedResults];

  const filteredResults = allResults.filter(result => {
    const search = searchTerm.toLowerCase();
    return (
      getStudentName(result.studentAdmissionNo).toLowerCase().includes(search) ||
      result.studentAdmissionNo.toLowerCase().includes(search) ||
      getSubjectName(result.subjectSelect).toLowerCase().includes(search) ||
      result.classSelect.toLowerCase().includes(search) ||
      result.termSelect.toLowerCase().includes(search)
    );
  });
  
  const studentOptions = students.map(s => ({
    admissionNo: s.admissionNo,
    name: `${s.lastName}, ${s.firstName}`,
    class: s.studentClass
  }));
  const subjectOptions = subjects;

  const userCanApprove = user?.role === 'Super Admin' || user?.role === 'Portal Manager'; 
  const userIsAdmin = user?.type === 'admin' || user?.type === 'staff'; 

  if (!token) {
  return <div>Access Denied. Please login to access Results Management.</div>;
}
  
  // Get subjects the user is permitted to enter results for.
  const permittedSubjectOptions = subjectOptions.filter(subject => userCanSubmitForSubject(subject.subjectCode));


  return (
    <div className="results-management-page">
      <h2>Results Management</h2>
      {fetchError && (
        <div className="error-message">
          <p>Error fetching data: {fetchError}</p>
          <button onClick={fetchResults}>Try Reloading Results Data</button>
        </div>
      )}
      {message && (
        <div className={`notification ${message.type === 'error' ? 'error' : 'success'}`}>
          {typeof message === 'string' ? message : message.text}
        </div>
      )}

      {/* Result Submission Form */}
      <div className="result-form-container">
        <h3>{isEditing ? 'Edit Result Entry' : 'Submit New Result'}</h3>
        {loadingSupportingData ? (
            <p>Loading students, subjects, and staff...</p>
        ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Row 1 */}
                <div>
                  <label>Student (Admission No.):</label>
                  <select
                    name="studentAdmissionNo"
                    value={newResult.studentAdmissionNo}
                    onChange={handleChange}
                    required
                    disabled={isEditing && !editResultIsPending} 
                  >
                    <option value="">Select Student</option>
                    {studentOptions.map(student => (
                      <option key={student.admissionNo} value={student.admissionNo}>
                        {student.name} ({student.admissionNo}) - {student.class}
                      </option>
                    ))}
                  </select>
                  {formErrors.studentAdmissionNo && <p className="error">{formErrors.studentAdmissionNo}</p>}
                </div>
                <div>
                  <label>Class (Auto-filled):</label>
                  <input
                    type="text"
                    name="classSelect"
                    value={newResult.classSelect}
                    readOnly
                    placeholder="Auto-filled after student selection"
                  />
                </div>
                <div>
                  <label>Subject:</label>
                  <select
                    name="subjectSelect"
                    value={newResult.subjectSelect}
                    onChange={handleChange}
                    required
                    disabled={isEditing && !editResultIsPending} 
                  >
                    <option value="">Select Subject</option>
                    {/* Filter subjects based on user permission */}
                    {permittedSubjectOptions.map(subject => (
                      <option key={subject.subjectCode} value={subject.subjectCode}>
                        {subject.subjectName} ({subject.subjectCode})
                      </option>
                    ))}
                  </select>
                  {formErrors.subjectSelect && <p className="error">{formErrors.subjectSelect}</p>}
                </div>

                {/* Row 2 */}
                <div>
                  <label>Term:</label>
                  <select
                    name="termSelect"
                    value={newResult.termSelect}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Term</option>
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                  {formErrors.termSelect && <p className="error">{formErrors.termSelect}</p>}
                </div>
                <div>
                  <label>Academic Year:</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={newResult.academicYear}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 2024"
                  />
                  {formErrors.academicYear && <p className="error">{formErrors.academicYear}</p>}
                </div>
                <div>
                  <label>Total Score:</label>
                  <input
                    type="number"
                    name="totalScore"
                    value={newResult.totalScore}
                    readOnly
                    className={newResult.totalScore > 100 ? 'error-field' : ''}
                  />
                  {formErrors.totalScore && <p className="error">{formErrors.totalScore}</p>}
                </div>

                {/* Row 3 - Scores (Individual score entry allowed) */}
                <div>
                  <label>1st CA Score (Max 20):</label>
                  <input
                    type="number"
                    name="firstCaScore"
                    value={newResult.firstCaScore}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    placeholder="Max 20"
                  />
                  {formErrors.firstCaScore && <p className="error">{formErrors.firstCaScore}</p>}
                </div>
                <div>
                  <label>2nd CA Score (Max 20):</label>
                  <input
                    type="number"
                    name="secondCaScore"
                    value={newResult.secondCaScore}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    placeholder="Max 20"
                  />
                  {formErrors.secondCaScore && <p className="error">{formErrors.secondCaScore}</p>}
                </div>
                <div>
                  <label>Assignment Score (Max 10):</label>
                  <input
                    type="number"
                    name="assignmentScore"
                    value={newResult.assignmentScore}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    placeholder="Max 10"
                  />
                  {formErrors.assignmentScore && <p className="error">{formErrors.assignmentScore}</p>}
                </div>
                <div>
                  <label>Exam Score (Max 50):</label>
                  <input
                    type="number"
                    name="examScore"
                    value={newResult.examScore}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    placeholder="Max 50"
                  />
                  {formErrors.examScore && <p className="error">{formErrors.examScore}</p>}
                </div>
                
                {/* Row 4 - Read Only Info */}
                <div>
                  <label>Calculated Grade:</label>
                  <input
                    type="text"
                    name="grade"
                    value={newResult.grade}
                    readOnly
                  />
                </div>
                <div>
                  <label>Status:</label>
                  <input
                    type="text"
                    name="status"
                    value={newResult.status}
                    readOnly
                    style={{ color: newResult.status === 'Approved' ? 'green' : 'orange' }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {isEditing ? 'Update Result' : 'Submit Result (Pending)'}
                </button>
                {isEditing && (
                  <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
        )}
      </div>

      {/* Results List Table */}
      <div className="results-list-container">
        <h3>All Results (Pending & Approved: {filteredResults.length})</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Student, Admission No., Subject, or Class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setSearchTerm('')}>Clear Search</button>
        </div>

        <div className="table-container">
            {loadingResults ? (
                <p>Loading results data...</p>
            ) : (
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Class</th>
                            <th>Subject</th>
                            <th>Term</th>
                            <th>Year</th>
                            <th>CA1</th>
                            <th>CA2</th>
                            <th>Assg.</th>
                            <th>Exam</th>
                            <th>Total</th>
                            <th>Grade</th>
                            <th>Status</th>
                            <th>Submitted By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResults.length > 0 ? (
                            // 🐞 FIX: The closing parenthesis for map() was missing.
                            filteredResults.map(result => {
                                const isPendingEntry = result.status === 'Pending';
                                
                                // 1. User has permission to edit this specific pending result (True for all eligible users)
                                const userHasEditPermission = isPendingEntry && userCanSubmitForSubject(result.subjectSelect);

                                // 2. User has approval permission (True only for Super Admin/Portal Manager)
                                const canApproveOrReject = isPendingEntry && userCanApprove; 

                                // 3. User has edit permission but NOT approval permission (True only for assigned teachers)
                                const canEditOnly = userHasEditPermission && !canApproveOrReject;

                                // 4. User can delete an approved result (True only for Super Admin/Portal Manager on approved entries)
                                const canDeleteApproved = result.status === 'Approved' && userCanApprove;

                                return (
                                <tr key={result._id} style={{ backgroundColor: isPendingEntry ? '#fff3e0' : 'white' }}>
                                    <td>{getStudentName(result.studentAdmissionNo)}</td>
                                    <td>{result.classSelect}</td>
                                    <td>{getSubjectName(result.subjectSelect)}</td>
                                    <td>{result.termSelect}</td>
                                    <td>{result.academicYear}</td>
                                    <td>{result.firstCaScore}</td>
                                    <td>{result.secondCaScore}</td>
                                    <td>{result.assignmentScore}</td>
                                    <td>{result.examScore}</td>
                                    <td><strong>{result.totalScore}</strong></td>
                                    <td><strong>{result.grade}</strong></td>
                                    <td>
                                    <span style={{ color: result.status === 'Approved' ? 'green' : result.status === 'Rejected' ? 'red' : 'orange', fontWeight: 'bold' }}>
                                        {result.status}
                                    </span>
                                    </td>
                                    <td>{result.submittedBy} ({result.submittedByType})</td>
                                    <td className="action-buttons">
                                    {canApproveOrReject ? (
                                        // Case 1: Approvers see all options for Pending Results
                                        <>
                                        <button 
                                            className="action-btn approve-btn" 
                                            onClick={() => handleApproval(result._id, 'Approve')}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => handleApproval(result._id, 'Reject')}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => editResult(result._id, true)}
                                        >
                                            Edit
                                        </button>
                                        </>
                                    ) : canEditOnly ? (
                                        // Case 2: Assigned Teachers (non-approvers) see only Edit for Pending Results
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => editResult(result._id, true)}
                                        >
                                            Edit
                                        </button>
                                    ) : canDeleteApproved ? (
                                         // Case 3: Approvers see Delete for Approved Results
                                         <button
                                            className="action-btn delete-btn"
                                            onClick={() => deleteResult(result._id)}
                                        >
                                            Delete
                                        </button>
                                    ) : (
                                        // Case 4: Everyone else sees No Actions
                                        <span>No Actions</span>
                                    )}
                                    </td>
                                </tr>
                                );
                            }) // <--- Syntax is now correct here!
                        ) : (
                            <tr>
                            <td colSpan="14">No results found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}

export default ResultsManagement;