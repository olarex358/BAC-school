// src/pages/MarkAttendance.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import AttendanceNav from "../components/AttendanceNav";

const LOCK_DAYS = 2;
const LS_ATT = "schoolPortalAttendance";

const readLS = (key, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

function MarkAttendance() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  const [students] = useLocalStorage(
    "schoolPortalStudents",
    [],
    "http://localhost:5000/api/schoolPortalStudents"
  );

  const [attendanceRecords, setAttendanceRecords] = useState(() =>
    readLS(LS_ATT, [])
  );

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "staff") setTeacher(user);
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/schoolPortalAttendance");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAttendanceRecords(data);
          writeLS(LS_ATT, data);
        }
      } catch {
        // keep offline cache
      }
    };
    loadAttendance();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudentsInClass([]);
      setAttendanceState({});
      return;
    }

    const filtered = students.filter((s) => s.studentClass === selectedClass);
    setStudentsInClass(filtered);

    const init = {};
    filtered.forEach((stu) => (init[stu.admissionNo] = "Present"));
    setAttendanceState(init);
  }, [selectedClass, students]);

  const isDateLocked = (dateStr) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - selected) / (1000 * 60 * 60 * 24));
    return diff > LOCK_DAYS;
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedDate) return showAlert("Select class and date.");
    if (isDateLocked(selectedDate))
      return showAlert(`You can only edit attendance within ${LOCK_DAYS} days.`);

    // ✅ canonical records (keep studentId too for backward compatibility)
    const records = studentsInClass.map((stu) => ({
      id: `${selectedDate}-${selectedClass}-${stu.admissionNo}`,
      date: selectedDate,
      class: selectedClass,
      admissionNo: stu.admissionNo, // ✅ canonical
      studentId: stu.admissionNo,   // ✅ legacy support
      status: attendanceState[stu.admissionNo] || "Present",
      markedBy: teacher?.staffId || teacher?.username || "staff",
      timestamp: new Date().toISOString(),
    }));

    try {
      // delete old same-day records first
      const old = attendanceRecords.filter(
        (r) => (r.class || r.classSelect) === selectedClass && r.date === selectedDate
      );

      await Promise.all(
        old
          .filter((r) => r._id)
          .map((r) =>
            fetch(`http://localhost:5000/api/schoolPortalAttendance/${r._id}`, {
              method: "DELETE",
            })
          )
      );

      // post new
      await Promise.all(
        records.map((r) =>
          fetch("http://localhost:5000/api/schoolPortalAttendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          })
        )
      );

      // refresh from server
      const refreshed = await fetch("http://localhost:5000/api/schoolPortalAttendance");
      const data = await refreshed.json();

      if (Array.isArray(data)) {
        setAttendanceRecords(data);
        writeLS(LS_ATT, data);
      }

      showAlert("Attendance saved successfully.");
    } catch {
      // ✅ still save locally so refresh keeps it
      const merged = [...records, ...attendanceRecords].slice(0, 10000);
      setAttendanceRecords(merged);
      writeLS(LS_ATT, merged);
      showAlert("Saved offline (online sync later).");
    }
  };

  if (!teacher) return <div className="content-section">Access Denied</div>;

  return (
    <div className="content-section">
      <AttendanceNav />

      <ConfirmModal
        isOpen={modalOpen}
        message={modalMessage}
        isAlert
        onConfirm={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
      />

      <h1>Mark Attendance</h1>

      <form onSubmit={handleSubmitAttendance}>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {[...new Set(students.map((s) => s.studentClass).filter(Boolean))].sort().map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />

        {studentsInClass.length > 0 && (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Admission No</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentsInClass.map((stu, index) => (
                <tr key={stu.admissionNo}>
                  <td>{index + 1}</td>
                  <td>{stu.admissionNo}</td>
                  <td>{stu.firstName} {stu.lastName}</td>
                  <td>
                    <select
                      value={attendanceState[stu.admissionNo] || "Present"}
                      onChange={(e) =>
                        setAttendanceState((p) => ({ ...p, [stu.admissionNo]: e.target.value }))
                      }
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
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
