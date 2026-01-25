// src/pages/StudentResults.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';


function StudentResults() {
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const navigate = useNavigate();

  // Load all results and subjects to display student-specific results
  const [allApprovedResults, , loadingApprovedResults] = useLocalStorage('schoolPortalResults', [], 'http://localhost:5000/api/schoolPortalResults');
  const [allSubjects, , loadingSubjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');

  const [studentSpecificResults, setStudentSpecificResults] = useState([]);

  // NEW STATE FOR GRADING LOGIC:
  const [totalScore, setTotalScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [gpa, setGpa] = useState(0);

  // Effect to check if user is a student
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'student') {
      setLoggedInStudent(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Filter results to show only for the current logged-in student and ensure they are approved
  useEffect(() => {
    if (loggedInStudent && allApprovedResults.length > 0) {
      const filteredResults = allApprovedResults.filter(
        result => result.studentNameSelect === loggedInStudent.admissionNo && result.status === 'Approved'
      );
      setStudentSpecificResults(filteredResults);
    } else {
      setStudentSpecificResults([]);
    }
  }, [loggedInStudent, allApprovedResults]);

  // Helper function to get grade and GPA points from a score
  const getGradeAndPoints = (score) => {
    if (score >= 70) return { grade: 'A', points: 5.0 };
    if (score >= 60) return { grade: 'B', points: 4.0 };
    if (score >= 50) return { grade: 'C', points: 3.0 };
    if (score >= 40) return { grade: 'D', points: 2.0 };
    return { grade: 'F', points: 0.0 };
  };

  // NEW HELPER FUNCTION to calculate total score and grade from component scores
  const calculateTotalAndGrade = (firstCa, secondCa, assignment, exam) => {
    const total = parseFloat(firstCa) + parseFloat(secondCa) + parseFloat(assignment) + parseFloat(exam);
    let grade = '';
    if (total >= 70) grade = 'A';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';
    else grade = 'F';
    return { total, grade };
  };

  // NEW EFFECT FOR CALCULATIONS:
  useEffect(() => {
    if (studentSpecificResults.length > 0) {
      const allFinalScores = studentSpecificResults.map(result => calculateTotalAndGrade(result.firstCaScore, result.secondCaScore, result.assignmentScore, result.examScore).total);
      
      const total = allFinalScores.reduce((sum, score) => sum + score, 0);
      setTotalScore(total);

      const average = total / allFinalScores.length;
      setAverageScore(average.toFixed(2));

      const totalPoints = studentSpecificResults.reduce((sum, result) => {
        const { total } = calculateTotalAndGrade(result.firstCaScore, result.secondCaScore, result.assignmentScore, result.examScore);
        const { points } = getGradeAndPoints(total);
        return sum + points;
      }, 0);
      
      const calculatedGpa = totalPoints / studentSpecificResults.length;
      setGpa(calculatedGpa.toFixed(2));
      
    } else {
      setTotalScore(0);
      setAverageScore(0);
      setGpa(0);
    }
  }, [studentSpecificResults]);

  // Helper function to get subject name from code
  const getSubjectName = (subjectCode) => {
    const subject = allSubjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!loggedInStudent || loadingApprovedResults || loadingSubjects) {
    return <div className="content-section">Loading results...</div>;
  }

  const gpaClass = gpa >= 4.0 ? 'gpa-green' : gpa >= 3.0 ? 'gpa-orange' : 'gpa-red';

  return (
    <div className="content-section">
      <h1>My Results</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}!</p>
      
      <div className="results-summary-card">
        <div className="summary-item">
            <h3 className="summary-title">Total Score:</h3>
            <p className="summary-value">{totalScore}</p>
        </div>
        <div className="summary-item">
            <h3 className="summary-title">Average Score:</h3>
            <p className="summary-value">{averageScore}%</p>
        </div>
        <div className="summary-item">
            <h3 className="summary-title">GPA:</h3>
            <p className={`summary-value ${gpaClass}`}>{gpa}</p>
        </div>
      </div>
      
      <h3>Your Academic Performance:</h3>
      {studentSpecificResults.length > 0 ? (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Term</th>
                <th>1st CA (10%)</th>
                <th>2nd CA (10%)</th>
                <th>Assignment (20%)</th>
                <th>Exam (60%)</th>
                <th>Total (100%)</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {studentSpecificResults.map((result, index) => {
                const { total, grade } = calculateTotalAndGrade(result.firstCaScore, result.secondCaScore, result.assignmentScore, result.examScore);
                return (
                <tr key={result._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td>{getSubjectName(result.subjectSelect)}</td>
                  <td>{result.termSelect}</td>
                  <td>{result.firstCaScore}</td>
                  <td>{result.secondCaScore}</td>
                  <td>{result.assignmentScore}</td>
                  <td>{result.examScore}</td>
                  <td className="total-score"><strong>{total}</strong></td>
                  <td className={`grade-cell grade-${grade.toLowerCase()}`}><strong>{grade}</strong></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data-message">No results have been entered for you yet.</p>
      )}
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StudentResults;
