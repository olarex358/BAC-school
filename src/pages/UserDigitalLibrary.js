import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import libraryIcon from "../icon/library.png";

function UserDigitalLibrary() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);

  // ✅ remove localhost
  const [digitalResources, , loadingResources] = useLocalStorage(
    "schoolPortalDigitalLibrary",
    [],
    "/api/schoolPortalDigitalLibrary"
  );

  const [students] = useLocalStorage(
    "schoolPortalStudents",
    [],
    "/api/schoolPortalStudents"
  );

  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && (user.type === "student" || user.type === "staff")) {
      setLoggedInUser(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const userResources = useMemo(() => {
    if (!loggedInUser) return [];

    const list = Array.isArray(digitalResources) ? digitalResources : [];

    const filtered = list
      .filter((resource) => {
        const visibility = resource.visibility || resource.audience || "all";
        const isCorrectAudience = visibility === "all" || visibility === loggedInUser.type;

        // for students, apply class filter if present
        if (loggedInUser.type === "student" && loggedInUser.studentClass) {
          const cls = resource.applicableClass || "all";
          const isCorrectClass = cls === "all" || cls === loggedInUser.studentClass;
          return isCorrectAudience && isCorrectClass;
        }

        return isCorrectAudience;
      })
      .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));

    return filtered;
  }, [loggedInUser, digitalResources]);

  const filteredAndSearchedResources = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return userResources.filter((res) => {
      const title = String(res.title || "").toLowerCase();
      const desc = String(res.description || "").toLowerCase();
      const file = String(res.filename || res.url || "").toLowerCase();
      return title.includes(t) || desc.includes(t) || file.includes(t);
    });
  }, [userResources, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    navigate("/home");
  };

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
      <p>
        Welcome,{" "}
        {loggedInUser.type === "student" ? loggedInUser.firstName : loggedInUser.firstname}! Here are the digital resources available to you:
      </p>

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
            {filteredAndSearchedResources.map((res) => (
              <div key={res._id || res.id} className="resource-card">
                <div className="resource-icon-container">
                  <img src={libraryIcon} alt="Resource Icon" className="resource-icon" />
                </div>
                <div className="resource-details">
                  <h4 className="resource-title">{res.title}</h4>
                  <p className="resource-description">{res.description}</p>

                  {res.url ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-link"
                    >
                      Open Resource
                    </a>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        showAlert("No file URL attached to this resource.");
                      }}
                      className="resource-link"
                    >
                      No link available
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data-message">
            No digital resources match your search or are currently available.
          </p>
        )}
      </div>

      <p className="mt-4">
        If you have questions about any of the resources, please contact the school administration.
      </p>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default UserDigitalLibrary;
