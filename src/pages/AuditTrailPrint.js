import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

function AuditTrailPrint() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const [results] = useLocalStorage('schoolPortalResults', []);
  const [attendance] = useLocalStorage('schoolPortalAttendance', []);
  const [promotions] = useLocalStorage('schoolPortalPromotions', []);

  if (!user) {
    return <div>Access Denied</div>;
  }

  return (
    <>
      <Header user={user} />
      <div className="content-section printable">
        <h1>Audit Report</h1>

        <h2>Results Audit</h2>
        <pre>{JSON.stringify(results, null, 2)}</pre>

        <h2>Attendance Audit</h2>
        <pre>{JSON.stringify(attendance, null, 2)}</pre>

        <h2>Promotion Audit</h2>
        <pre>{JSON.stringify(promotions, null, 2)}</pre>

        <button onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      <Footer />
    </>
  );
}

export default AuditTrailPrint;
