// src/pages/MarkAttendance.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';

const LOCK_DAYS = 2;

function MarkAttendance() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  const [students] = useLocalStorage(
    'schoolPortalStudents',
    [],
    'http://localhost:5000/api/schoolPortalStudents'
  );

  const [attendanceRecords, setAttendanceRecords] = useLocalStorage(
    'schoolPortalAttendance',
    [],
    'http://localhost:5000/api/schoolPortalAttendance'
  );

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user || user.type !== 'staff' || !user.role.includes('Teacher')) {
      navigate('/login');
      return;
    }
    setTeacher(user);
  }, [navigate]);

  const assignedClasses = teacher?.assignedClasses || [];

  const isLocked = (date) => {
    const today = new Date();
    const attDate = new Date(date);
    const diffDays = (today - attDate) / (1000 * 60 * 60 * 24);
    return diffDays > LOCK_DAYS;
  };

  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setStudentsInClass([]);
      setAttendanceState({});
      return;
    }

    if (!assignedClasses.includes(selectedClass)) {
      showAlert('You are not assigned to this class.');
      setSelectedClass('');
      return;
    }

    if (isLocked(selectedDate)) {
      showAlert(`Attendance for this date is locked.`);
      setSelectedDate('');
      return;
    }

    const classStudents = students.filter(
      s => s.studentClass === selectedClass
    );

    const existing = attendanceRecords.filter(
      r => r.class === selectedClass && r.date === selectedDate
    );

    const initial = {};
    classStudents.forEach(stu => {
      const record = existing.find(r => r.studentId === stu.admissionNo);
      initial[stu.admissionNo] = record ? record.status : 'Present';
    });

    setStudentsInClass(classStudents);
    setAttendanceState(initial);
  }, [selectedClass, selectedDate, students, attendanceRecords, assignedClasses]);

  const handleChange = (id, status) => {
    setAttendanceState(prev => ({ ...prev, [id]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked(selectedDate)) {
      showAlert('Attendance is locked and cannot be modified.');
      return;
    }

    const records = studentsInClass.map(stu => ({
      id: `${selectedDate}-${selectedClass}-${stu.admissionNo}`,
      date: selectedDate,
      class: selectedClass,
      studentId: stu.admissionNo,
      status: attendanceState[stu.admissionNo],
      markedBy: teacher.staffId,
      classTeacherId: teacher.staffId,
      classTeacherName: `${teacher.firstname} ${teacher.surname}`,
      timestamp: new Date().toISOString()
    }));

    try {
      const old = attendanceRecords.filter(
        r => r.class === selectedClass && r.date === selectedDate
      );

      await Promise.all(
        old.map(r =>
          fetch(`http://localhost:5000/api/schoolPortalAttendance/${r._id}`, {
            method: 'DELETE'
          })
        )
      );

      await Promise.all(
        records.map(r =>
          fetch('http://localhost:5000/api/schoolPortalAttendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r)
          })
        )
      );

      const refreshed = await fetch(
        'http://localhost:5000/api/schoolPortalAttendance'
      );
      setAttendanceRecords(await refreshed.json());

      showAlert('Attendance saved successfully.');
    } catch {
      showAlert('Network error.');
    }
  };

  if (!teacher) return <div className="content-section">Access Denied</div>;

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={modalOpen}
        message={modalMessage}
        isAlert
        onConfirm={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
      />

      <h1>Mark Attendance</h1>

      <form onSubmit={handleSubmit}>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">-- Select Class --</option>
          {assignedClasses.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />

        {studentsInClass.length > 0 && (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Admission No</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentsInClass.map((stu, i) => (
                <tr key={stu.admissionNo}>
                  <td>{i + 1}</td>
                  <td>{stu.firstName} {stu.lastName}</td>
                  <td>{stu.admissionNo}</td>
                  <td>
                    <select
                      value={attendanceState[stu.admissionNo]}
                      onChange={e => handleChange(stu.admissionNo, e.target.value)}
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button type="submit">Save Attendance</button>
      </form>
    </div>
  );
}

export default MarkAttendance;
