// src/pages/StaffCalendar.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";

// icon
import calendarIcon from "../icon/calender.png";

function StaffCalendar() {
  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const navigate = useNavigate();

  // ✅ SAFE: read local first, then sync READ from backend when online
  const [allCalendarEvents, , loadingEvents] = useLocalStorage(
    "schoolPortalCalendarEvents",
    [],
    "/api/schoolPortalCalendarEvents"
  );

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
    if (user && user.type === "staff") {
      setLoggedInStaff(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/home");
  };

  const staffRelevantEvents = useMemo(() => {
    return (allCalendarEvents || [])
      .filter((event) => event.audience === "all" || event.audience === "staff")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allCalendarEvents]);

  if (!loggedInStaff || loadingEvents) {
    return <div className="content-section">Loading calendar...</div>;
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

      <h1>School Calendar (Staff View)</h1>
      <p>
        Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here are the
        important school dates and events:
      </p>

      {staffRelevantEvents.length > 0 ? (
        <div className="calendar-grid">
          {staffRelevantEvents.map((event) => (
            <div key={event._id || event.id} className="event-card">
              <div className="event-icon-container">
                <img
                  src={calendarIcon}
                  alt="Calendar Icon"
                  className="event-icon"
                />
              </div>
              <div className="event-details">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-date">
                  <strong>Date:</strong> {event.date}
                </p>
                <p className="event-description">{event.description || event.note || ""}</p>
                <p className="event-audience">
                  Audience:{" "}
                  {String(event.audience || "all").charAt(0).toUpperCase() +
                    String(event.audience || "all").slice(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data-message">No calendar events posted for staff yet.</p>
      )}

      <p className="mt-4">
        For more information on school events, please contact the administration office.
      </p>

      <button
        onClick={() => showAlert("Calendar updates automatically when admin posts events.")}
        className="logout-button"
        style={{ marginRight: 10 }}
      >
        Info
      </button>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StaffCalendar;
