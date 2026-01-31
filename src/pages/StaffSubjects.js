import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";

function StaffSubjects() {
  const [loggedInStaff, setLoggedInStaff] = useState(null);

  // ✅ FIX: remove localhost
  const [allSubjects, , loadingSubjects] = useLocalStorage(
    "schoolPortalSubjects",
    [],
    "/api/schoolPortalSubjects"
  );

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "staff") {
      setLoggedInStaff(user);
    } else {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (!loggedInStaff || loadingSubjects) {
    return <div className="content-section">Loading staff subjects...</div>;
  }

  return (
    <div className="content-section">
      <h1>My Subjects (Staff View)</h1>
      <p>
        Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here are the
        subjects currently offered:
      </p>

      {(allSubjects || []).length > 0 ? (
        <div className="table-container">
          <table id="staffSubjectsTable">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
              </tr>
            </thead>
            <tbody>
              {allSubjects.map((subject) => (
                <tr key={subject._id || subject.id}>
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

      <p style={{ marginTop: "20px" }}>
        For subject-specific curriculum or assignments, please refer to your departmental
        resources.
      </p>

      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}

export default StaffSubjects;
