import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ALLOWED = ['Admin', 'Principal', 'Super Admin'];

function AuditTrail() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const [results] = useLocalStorage('schoolPortalResults', []);
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [promotions] = useLocalStorage('schoolPortalPromotions', []);

  if (!user || !ALLOWED.includes(user.role)) {
    return <div className="content-section">Access Denied</div>;
  }

  return (
    <>
      <Header user={user} />
      <div className="content-section">
        <h1>Audit Trail</h1>

        <h3>Results</h3>
        <pre>{JSON.stringify(results, null, 2)}</pre>

        <h3>Attendance</h3>
        <pre>{JSON.stringify(attendance, null, 2)}</pre>

        <h3>Promotions</h3>
        <pre>{JSON.stringify(promotions, null, 2)}</pre>
      </div>
      <Footer />
    </>
  );
}

export default AuditTrail;
