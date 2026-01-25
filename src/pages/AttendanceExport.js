// src/pages/AttendanceExport.js
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ALLOWED_ROLES = ['Admin', 'Principal', 'Super Admin'];

function AttendanceExport() {
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

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <div className="content-section">Access Denied</div>;
  }

  const classes = [...new Set(students.map(s => s.studentClass))].sort();

  const exportCSV = () => {
    if (!selectedClass || !startDate || !endDate) return;

    const filtered = attendance.filter(r =>
      r.class === selectedClass &&
      r.date >= startDate &&
      r.date <= endDate
    );

    if (filtered.length === 0) {
      alert('No attendance records found.');
      return;
    }

    const headers = [
      'Date',
      'Class',
      'Admission No',
      'Student Name',
      'Status',
      'Marked By',
      'Teacher'
    ];

    const rows = filtered.map(r => {
      const student = students.find(s => s.admissionNo === r.studentId);
      return [
        r.date,
        r.class,
        r.studentId,
        student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        r.status,
        r.markedBy,
        r.classTeacherName || ''
      ];
    });

    let csvContent =
      headers.join(',') + '\n' +
      rows.map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_${selectedClass}_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  return (
    <>
      <Header user={user} />
      <div className="content-section">
        <h1>Attendance Export</h1>

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
            onClick={exportCSV}
            disabled={!selectedClass || !startDate || !endDate}
            className="form-submit-btn"
          >
            Export CSV
          </button>
        </div>

        <p className="mt-3">
          Exported file is Excel-ready and inspection-safe.
        </p>
      </div>
      <Footer />
    </>
  );
}

export default AttendanceExport;
