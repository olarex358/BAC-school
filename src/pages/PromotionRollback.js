import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

function PromotionRollback() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));
  const [students, setStudents] = useLocalStorage('schoolPortalStudents', []);
  const [promotions, setPromotions] = useLocalStorage('schoolPortalPromotions', []);

  if (!user || user.role !== 'Super Admin') {
    return <div className="content-section">Access Denied</div>;
  }

  const rollback = (promo) => {
    setStudents(prev =>
      prev.map(s =>
        s.admissionNo === promo.studentId
          ? { ...s, studentClass: promo.fromClass }
          : s
      )
    );

    setPromotions(prev =>
      prev.map(p =>
        p === promo ? { ...p, rolledBack: true } : p
      )
    );
  };

  return (
    <>
      <Header user={user} />
      <div className="content-section">
        <h1>Promotion Rollback</h1>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p, i) => (
              <tr key={i}>
                <td>{p.studentId}</td>
                <td>{p.fromClass}</td>
                <td>{p.toClass}</td>
                <td>{p.rolledBack ? 'Rolled Back' : 'Applied'}</td>
                <td>
                  {!p.rolledBack && (
                    <button onClick={() => rollback(p)}>Rollback</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
}

export default PromotionRollback;
