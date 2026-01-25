import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ALLOWED_ROLES = ['Admin', 'Principal', 'Super Admin'];

function AttendanceAlerts() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [students] = useLocalStorage('schoolPortalStudents', []);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const alertsList = [];

    // Student absenteeism
    students.forEach(student => {
      const records = attendance.filter(
        r => r.studentId === student.admissionNo
      );

      if (records.length > 5) {
        const present = records.filter(r => r.status === 'Present').length;
        const rate = (present / records.length) * 100;

        if (rate < 75) {
          alertsList.push({
            type: 'Student',
            message: `${student.firstName} ${student.lastName} attendance is ${rate.toFixed(1)}%`
          });
        }
      }
    });

    // Class attendance drop
    const classMap = {};
    attendance.forEach(r => {
      classMap[r.class] = classMap[r.class] || [];
      classMap[r.class].push(r);
    });

    Object.keys(classMap).forEach(cls => {
      const records = classMap[cls];
      const present = records.filter(r => r.status === 'Present').length;
      const rate = (present / records.length) * 100;

      if (rate < 70) {
        alertsList.push({
          type: 'Class',
          message: `Class ${cls} attendance dropped to ${rate.toFixed(1)}%`
        });
      }
    });

    setAlerts(alertsList);
  }, [attendance, students]);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <div className="content-section">Access Denied</div>;
  }

  return (
    <>
      <div className="content-section">
        <h1>Attendance Alerts</h1>

        {alerts.length === 0 ? (
          <p>No alerts detected 🎉</p>
        ) : (
          <ul>
            {alerts.map((a, i) => (
              <li key={i}>
                <strong>{a.type} Alert:</strong> {a.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default AttendanceAlerts;
