// src/pages/StudentCertification.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import certificationIcon from '../icon/certification.png';

function StudentCertification() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  // Data from localStorage
  const [certificationResults, , loadingCertResults] = useLocalStorage('schoolPortalCertificationResults', [], 'http://localhost:5000/api/schoolPortalCertificationResults');
  const [allSubjects, , loadingSubjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  const [studentSpecificResults, setStudentSpecificResults] = useState([]);

  // Protect the route and filter results
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && user.type === 'student') {
      setLoggedInStudent(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInStudent && certificationResults.length > 0) {
      const filteredResults = certificationResults.filter(
        res => res.studentAdmissionNo === loggedInStudent.admissionNo
      );
      setStudentSpecificResults(filteredResults);
    } else {
      setStudentSpecificResults([]);
    }
  }, [loggedInStudent, certificationResults]);

  // Helper function to get grade and qualification status
  const calculateGradeAndQualification = (total) => {
    let grade = '';
    let qualified = false;

    // Scale is: 9,8 = Zenith, 7,6 = Legends, 5,4 = Economy, <4 = Not qualified
    const scaledScore = (total / 100) * 9; // Assuming total is out of 100

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

  const getSubjectName = (subjectCode) => {
    const subject = allSubjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!loggedInStudent || loadingCertResults || loadingSubjects) {
    return <div className="content-section">Loading certification details...</div>;
  }

  return (
    <div className="content-section">
      <h1>My Certification Results</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here are your certification results:</p>

      {studentSpecificResults.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Obj</th>
                <th>Theory</th>
                <th>Prac</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Qualified</th>
              </tr>
            </thead>
            <tbody>
              {studentSpecificResults.map(res => {
                const { grade, qualified } = calculateGradeAndQualification(res.totalScore);
                return (
                  <tr key={res._id}>
                    <td>{getSubjectName(res.subjectCode)}</td>
                    <td>{res.date}</td>
                    <td>{res.objScore}</td>
                    <td>{res.theoryScore}</td>
                    <td>{res.pracScore}</td>
                    <td><strong>{res.totalScore}</strong></td>
                    <td style={{color: qualified ? 'green' : 'red'}}><strong>{grade}</strong></td>
                    <td style={{color: qualified ? 'green' : 'red'}}>{qualified ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center' }}>
          <img src={certificationIcon} alt="Certification Icon" width="80px" height="80px" style={{ marginRight: '20px' }} />
          <div>
            <h3>No Certifications Issued Yet</h3>
            <p>Please contact the administration for more information.</p>
          </div>
        </div>
      )}
      
      <p style={{ marginTop: '20px' }}>
        For official transcripts and verification of your certification, please contact the school administration office.
      </p>
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default StudentCertification;