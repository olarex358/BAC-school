// src/pages/AttendanceReports.js
import React, { useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ALLOWED_ROLES = ['Admin', 'Principal', 'Super Admin'];

function AttendanceReports() {
  const user = JSON.parse(localStorage.getItem('loggedInUser'));

  const [attendance] = useLocalStorage(
    'schoolPortalAttendance',
    [],
    'http://localhost:5000/api/schoolPortalAttendance'
  );

  const [students] = useLocalStorage(
    'schoolPortalStudents',
    [],
    'http://localhost:5000/api/schoolPortalStudents'
  );

  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState([]);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <div className="content-section">Access Denied</div>;
  }

  const classes = [...new Set(students.map(s => s.studentClass))].sort();

  const generateReport = () => {
    if (!selectedClass || !startDate || !endDate) return;

    const filteredAttendance = attendance.filter(r =>
      r.class === selectedClass &&
      r.date >= startDate &&
      r.date <= endDate
    );

    const reportMap = {};

    filteredAttendance.forEach(r => {
      if (!reportMap[r.studentId]) {
        reportMap[r.studentId] = {
          studentId: r.studentId,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        };
      }

      reportMap[r.studentId].total++;

      if (r.status === 'Present') reportMap[r.studentId].present++;
      if (r.status === 'Absent') reportMap[r.studentId].absent++;
      if (r.status === 'Late') reportMap[r.studentId].late++;
    });

    const finalReport = Object.values(reportMap).map(r => {
      const student = students.find(s => s.admissionNo === r.studentId);
      const percentage =
        r.total > 0 ? ((r.present / r.total) * 100).toFixed(1) : 0;

      return {
        name: student
          ? `${student.firstName} ${student.lastName}`
          : 'Unknown',
        admissionNo: r.studentId,
        present: r.present,
        absent: r.absent,
        late: r.late,
        total: r.total,
        percentage
      };
    });

    setReport(finalReport);
  };

  return (
    <>
      <Header user={user} />
      <div className="content-section">
        <h1>Attendance Reports</h1>

        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={generateReport}
            disabled={!selectedClass || !startDate || !endDate}
            className="form-submit-btn"
          >
            Generate Report
          </button>
        </div>

        {report.length > 0 && (
          <div className="table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Admission No</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Total</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => (
                  <tr key={r.admissionNo}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.admissionNo}</td>
                    <td>{r.present}</td>
                    <td>{r.absent}</td>
                    <td>{r.late}</td>
                    <td>{r.total}</td>
                    <td>
                      <strong>{r.percentage}%</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {report.length === 0 && (
          <p className="mt-3">
            Select class and date range to generate report.
          </p>
        )}
      </div>
      <Footer />
    </>
  );
}

export default AttendanceReports;
