// src/pages/UserDigitalLibrary.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


// Import a generic library icon for the card
import libraryIcon from '../icon/library.png';

function UserDigitalLibrary() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  const [digitalResources, , loadingResources] = useLocalStorage('schoolPortalDigitalLibrary', [], 'http://localhost:5000/api/schoolPortalDigitalLibrary');
  const [students] = useLocalStorage('schoolPortalStudents', [], 'http://localhost:5000/api/schoolPortalStudents');
  
  const [userResources, setUserResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (user && (user.type === 'student' || user.type === 'staff')) {
      setLoggedInUser(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInUser && digitalResources.length > 0) {
      const filteredForUser = digitalResources.filter(resource => {
        const isCorrectAudience = resource.audience === 'all' || resource.audience === loggedInUser.type;
        
        if (loggedInUser.type === 'student' && loggedInUser.studentClass) {
          const isCorrectClass = resource.applicableClass === 'all' || resource.applicableClass === loggedInUser.studentClass;
          return isCorrectAudience && isCorrectClass;
        }

        return isCorrectAudience;
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setUserResources(filteredForUser);
    } else {
      setUserResources([]);
    }
  }, [loggedInUser, digitalResources]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  const filteredAndSearchedResources = userResources.filter(res =>
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!loggedInUser || loadingResources) {
    return <div className="content-section">Loading digital library...</div>;
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
      <h1>Digital Library</h1>
      <p>Welcome, {loggedInUser.type === 'student' ? loggedInUser.firstName : loggedInUser.firstname}! Here are the digital resources available to you:</p>

      <div className="sub-section">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {filteredAndSearchedResources.length > 0 ? (
          <div className="resource-grid">
            {filteredAndSearchedResources.map(res => (
              <div key={res._id} className="resource-card">
                <div className="resource-icon-container">
                    <img src={libraryIcon} alt="Resource Icon" className="resource-icon" />
                </div>
                <div className="resource-details">
                    <h4 className="resource-title">{res.title}</h4>
                    <p className="resource-description">{res.description}</p>
                    <a href="#" onClick={(e) => { e.preventDefault(); showAlert(`Simulating download of ${res.filename}`); }} className="resource-link">
                        Download: {res.filename}
                    </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">No digital resources match your search or are currently available.</p>
        )}
      </div>

      <p className="mt-4">
        If you have questions about any of the resources, please contact the school administration.
      </p>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
}

export default UserDigitalLibrary;
