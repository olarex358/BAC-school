import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ALLOWED_ROLES = ['Admin', 'Principal', 'Super Admin'];

function AttendanceAnalytics() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const stats = {};
    attendance.forEach(r => {
      stats[r.class] = stats[r.class] || { total: 0, present: 0 };
      stats[r.class].total++;
      if (r.status === 'Present') stats[r.class].present++;
    });
    setSummary(stats);
  }, [attendance]);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <div className="content-section">Access Denied</div>;
  }

  return (
    <>
      <Header user={user} />
      <div className="content-section">
        <h1>Attendance Analytics</h1>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Total Records</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(summary).map(cls => {
              const rate = ((summary[cls].present / summary[cls].total) * 100).toFixed(1);
              return (
                <tr key={cls}>
                  <td>{cls}</td>
                  <td>{summary[cls].total}</td>
                  <td>{rate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
}

export default AttendanceAnalytics;
