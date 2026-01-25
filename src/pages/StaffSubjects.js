// src/pages/StaffSubjects.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

// Staffs typically don't have a profile icon for their subjects, but you can add one if desired.
// import subjectIcon from '../icon/subject.png';

function StaffSubjects() {
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  // Load all subjects to display
  const [allSubjects, , loadingSubjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    // Ensure user is logged in and is staff
    if (user && user.type === 'staff') {
      setLoggedInStaff(user);
    } else {
      navigate('/home'); // Redirect if not logged in as staff
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  if (!loggedInStaff || loadingSubjects) {
    return <div className="content-section">Loading staff subjects...</div>;
  }

  return (
    <div className="content-section">
      <h1>My Subjects (Staff View)</h1>
      <p>Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here are the subjects currently offered:</p>

      {allSubjects.length > 0 ? (
        <div className="table-container"> {/* Using table-container for styling from admin.css */}
          <table id="staffSubjectsTable">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                {/* For teachers, you might add columns for 'Assigned Classes' or 'Number of Students' */}
              </tr>
            </thead>
            <tbody>
              {allSubjects.map(subject => (
                <tr key={subject._id}>
                  <td>{subject.subjectName}</td>
                  <td>{subject.subjectCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No subjects have been registered in the system yet.</p>
      )}

      <p style={{ marginTop: '20px' }}>
        For subject-specific curriculum or assignments, please refer to your departmental resources.
      </p>

      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default StaffSubjects;