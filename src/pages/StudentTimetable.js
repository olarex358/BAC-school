// src/pages/StudentTimetable.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';


// Reusing calendar icon for timetable
import timetableIcon from '../icon/calender.png';

function StudentTimetable() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  const [allTimetableEntries, , loadingTimetable] = useLocalStorage('schoolPortalTimetables', [], 'http://localhost:5000/api/schoolPortalTimetables');
  const [subjects] = useLocalStorage('schoolPortalSubjects', [], 'http://localhost:5000/api/schoolPortalSubjects');
  const [staffs] = useLocalStorage('schoolPortalStaff', [], 'http://localhost:5000/api/schoolPortalStaff');

  const [studentSpecificTimetable, setStudentSpecificTimetable] = useState([]);
  const [daysOfWeek] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]); // Removed weekend days for typical school schedule

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
    if (user && user.type === 'student') {
      setLoggedInStudent(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedInStudent && allTimetableEntries.length > 0) {
      const filteredForStudent = allTimetableEntries.filter(
        entry => entry.classSelect === loggedInStudent.studentClass
      ).sort((a, b) => {
        const dayOrder = daysOfWeek;
        const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayComparison !== 0) return dayComparison;
        
        return a.startTime.localeCompare(b.startTime);
      });
      setStudentSpecificTimetable(filteredForStudent);
    } else {
      setStudentSpecificTimetable([]);
    }
  }, [loggedInStudent, allTimetableEntries, daysOfWeek]);

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
  
  if (!loggedInStudent || loadingTimetable) {
    return <div className="content-section">Loading timetable...</div>;
  }

  const uniqueTimeSlots = [...new Set(studentSpecificTimetable.map(entry => `${entry.startTime} - ${entry.endTime}`))].sort();

  const timetableGrid = {};
  daysOfWeek.forEach(day => {
      timetableGrid[day] = {};
      uniqueTimeSlots.forEach(slot => {
          timetableGrid[day][slot] = null;
      });
  });

  studentSpecificTimetable.forEach(entry => {
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
      <h1>My Timetable</h1>
      <p>Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here is your class timetable:</p>
      
      {studentSpecificTimetable.length > 0 ? (
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
                            <small className="timetable-teacher">{getTeacherName(entry.teacherSelect)}</small>
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
        <p>No timetable entries found for your class yet. Please contact administration.</p>
      )}

      <p style={{ marginTop: '20px' }}>
        Always refer to official school announcements for any timetable changes.
      </p>
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
    </div>
  );
}

export default StudentTimetable;
