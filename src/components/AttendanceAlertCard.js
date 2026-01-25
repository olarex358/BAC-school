import { Link } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';

function AttendanceAlertCard() {
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [students] = useLocalStorage('schoolPortalStudents', []);

  let alertCount = 0;

  // Student alerts
  students.forEach(student => {
    const records = attendance.filter(r => r.studentId === student.admissionNo);
    if (records.length > 5) {
      const present = records.filter(r => r.status === 'Present').length;
      const rate = (present / records.length) * 100;
      if (rate < 75) alertCount++;
    }
  });

  // Class alerts
  const classMap = {};
  attendance.forEach(r => {
    classMap[r.class] = classMap[r.class] || [];
    classMap[r.class].push(r);
  });

  Object.values(classMap).forEach(records => {
    const present = records.filter(r => r.status === 'Present').length;
    const rate = (present / records.length) * 100;
    if (rate < 70) alertCount++;
  });

  return (
    <div className="dashboard-card alert-card">
      <h3>Attendance Alerts</h3>
      <p className="alert-count">{alertCount}</p>

      <Link to="/attendance-alerts" className="card-link">
        View Alerts
      </Link>
    </div>
  );
}

export default AttendanceAlertCard;
