// src/pages/StaffTimetable.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


function StaffTimetable() {
  const navigate = useNavigate();
  const [loggedInStaff, setLoggedInStaff] = useState(null);

  const [allTimetableEntries, , loadingTimetable] = useLocalStorage('schoolPortalTimetables', [], 'http://localhost:5000/api/schoolPortalTimetables');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  const [staffs] = useLocalStorage('schoolPortalStaff', [], 'http://localhost:5000/api/schoolPortalStaff');

  const [staffSpecificTimetable, setStaffSpecificTimetable] = useState([]);
  const [daysOfWeek] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

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
    if (user && user.type === 'staff') {
      setLoggedInStaff(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInStaff && allTimetableEntries.length > 0) {
      const teacherAssignedClasses = loggedInStaff.assignedClasses || [];
      const teacherAssignedSubjects = loggedInStaff.assignedSubjects || [];

      const filteredForStaff = allTimetableEntries.filter(
        entry => {
          const isAssignedClass = teacherAssignedClasses.includes(entry.classSelect);
          const isAssignedSubject = teacherAssignedSubjects.includes(entry.subjectSelect);
          return isAssignedClass && isAssignedSubject && entry.teacherSelect === loggedInStaff.staffId;
        }
      ).sort((a, b) => {
        const dayOrder = daysOfWeek;
        const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayComparison !== 0) return dayComparison;
        
        return a.startTime.localeCompare(b.startTime);
      });
      setStaffSpecificTimetable(filteredForStaff);
    } else {
      setStaffSpecificTimetable([]);
    }
  }, [loggedInStaff, allTimetableEntries, daysOfWeek]);

  const getSubjectName = (subjectCode) => {
    const subject = subjects.find(s => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const getTeacherName = (staffId) => {
    const teacher = staffs.find(s => s.staffId === staffId);
    return teacher ? `${teacher.firstname} ${teacher.surname}` : 'Unknown Teacher';
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/home');
  };

  if (!loggedInStaff || loadingTimetable) {
    return <div className="content-section">Loading staff timetable...</div>;
  }

  const uniqueTimeSlots = [...new Set(staffSpecificTimetable.map(entry => `${entry.startTime} - ${entry.endTime}`))].sort();

  const timetableGrid = {};
  daysOfWeek.forEach(day => {
      timetableGrid[day] = {};
      uniqueTimeSlots.forEach(slot => {
          timetableGrid[day][slot] = null;
      });
  });

  staffSpecificTimetable.forEach(entry => {
      const slot = `${entry.startTime} - ${entry.endTime}`;
      if (timetableGrid[entry.day] && timetableGrid[entry.day][slot] === null) {
          timetableGrid[entry.day][slot] = entry;
      }
  });

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />
      <h1>My Teaching Timetable</h1>
      <p>Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here is your teaching timetable:</p>

      {staffSpecificTimetable.length > 0 ? (
        <div className="timetable-responsive-table">
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                {daysOfWeek.map(day => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueTimeSlots.map((slot, index) => (
                <tr key={slot} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td><strong>{slot}</strong></td>
                  {daysOfWeek.map(day => {
                    const entry = timetableGrid[day][slot];
                    return (
                      <td key={day} className={`timetable-cell timetable-type-${entry?.type.toLowerCase()}`}>
                        {entry ? (
                          <>
                            <p className="timetable-subject">{getSubjectName(entry.subjectSelect)}</p>
                            <p className="timetable-type">{entry.type}</p>
                            <small className="timetable-class">{entry.classSelect}</small>
                            <small className="timetable-location">({entry.location})</small>
                          </>
                        ) : (
                          <span className="empty-cell">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No timetable entries found for your assigned classes and subjects yet. Please contact administration.</p>
      )}

      <p style={{ marginTop: '20px' }}>
        Always refer to official school announcements for any timetable changes.
      </p>
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default StaffTimetable;
