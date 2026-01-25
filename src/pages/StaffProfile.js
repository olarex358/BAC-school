// src/pages/StaffProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function StaffProfile() {
  const [staffInfo, setStaffInfo] = useState(null);
  const navigate = useNavigate();

  const [staffs] = useLocalStorage('schoolPortalStaff', [], 'http://localhost:5000/api/schoolPortalStaff');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUser.type === 'staff') {
      const detailedStaffInfo = staffs.find(s => s.staffId === loggedInUser.staffId);
      if (detailedStaffInfo) {
        setStaffInfo(detailedStaffInfo);
      } else {
        console.error("Logged-in staff not found in database.");
        localStorage.removeItem('loggedInUser');
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, staffs]);

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!staffInfo) {
    return <div className="content-section">Loading profile...</div>;
  }
  
  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="profile-details">
          <div className="profile-item">
            <strong>Full Name:</strong> <span>{staffInfo.firstname} {staffInfo.surname}</span>
          </div>
          <div className="profile-item">
            <strong>Staff ID:</strong> <span>{staffInfo.staffId}</span>
          </div>
          <div className="profile-item">
            <strong>Role:</strong> <span>{staffInfo.role}</span>
          </div>
          <div className="profile-item">
            <strong>Department:</strong> <span>{staffInfo.department}</span>
          </div>
          <div className="profile-item">
            <strong>Email:</strong> <span>{staffInfo.contactEmail}</span>
          </div>
          <div className="profile-item">
            <strong>Phone:</strong> <span>{staffInfo.contactPhone}</span>
          </div>
          <div className="profile-item">
            <strong>Qualifications:</strong> <span>{staffInfo.qualifications}</span>
          </div>
          <div className="profile-item">
            <strong>Assigned Classes:</strong> <span>{staffInfo.assignedClasses && staffInfo.assignedClasses.length > 0 ? staffInfo.assignedClasses.join(', ') : 'N/A'}</span>
          </div>
          <div className="profile-item">
            <strong>Assigned Subjects:</strong> <span>{staffInfo.assignedSubjects && staffInfo.assignedSubjects.length > 0 ? staffInfo.assignedSubjects.map(getSubjectName).join(', ') : 'N/A'}</span>
          </div>
        </div>
      </div>
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default StaffProfile;
