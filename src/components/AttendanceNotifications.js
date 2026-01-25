// src/components/AttendanceNotifications.js
import { Link } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function AttendanceNotifications() {
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [students] = useLocalStorage('schoolPortalStudents', []);

  const notifications = [];

  // Student alerts
  students.forEach(student => {
    const records = attendance.filter(r => r.studentId === student.admissionNo);
    if (records.length > 5) {
      const present = records.filter(r => r.status === 'Present').length;
      const rate = (present / records.length) * 100;

      if (rate < 75) {
        notifications.push({
          type: 'Student',
          text: `${student.firstName} ${student.lastName} attendance is ${rate.toFixed(1)}%`
        });
      }
    }
  });

  // Class alerts
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
      notifications.push({
        type: 'Class',
        text: `Class ${cls} attendance dropped to ${rate.toFixed(1)}%`
      });
    }
  });

  if (notifications.length === 0) {
    return (
      <div className="notification-card">
        <h3>Notifications</h3>
        <p>No new notifications 🎉</p>
      </div>
    );
  }

  return (
    <div className="notification-card">
      <h3>Notifications ({notifications.length})</h3>

      <ul className="notification-list">
        {notifications.slice(0, 5).map((n, i) => (
          <li key={i}>
            <strong>{n.type}:</strong> {n.text}
          </li>
        ))}
      </ul>

      <Link to="/attendance-alerts" className="card-link">
        View all attendance alerts
      </Link>
    </div>
  );
}

export default AttendanceNotifications;
