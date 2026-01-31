// src/pages/MarkAttendance.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import { apiFetch } from "../api";
import ConfirmModal from "../components/ConfirmModal";
import AttendanceNav from "../components/AttendanceNav";
import { getCurrentAcademicPeriod } from "../utils/academicPeriod";

const LOCK_DAYS = 2;
const LS_ATT = "schoolPortalAttendance";

function MarkAttendance() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);

  // students (READ-ONLY sync from backend)
  const [students] = useLocalStorage(
    "schoolPortalStudents",
    [],
    "/api/schoolPortalStudents"
  );

  // attendance is LOCAL-FIRST
  const [attendanceRecords, setAttendanceRecords] = useLocalStorage(
    LS_ATT,
    []
  );

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [attendanceState, setAttendanceState] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showAlert = (msg) => {
    setModalMessage(msg);
    setModalOpen(true);
  };

  /* =========================
     AUTH CHECK
  ========================= */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "staff") setTeacher(user);
    else navigate("/login");
  }, [navigate]);

  /* =========================
     STUDENTS IN CLASS
  ========================= */
  const studentsInClass = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => s.studentClass === selectedClass);
  }, [students, selectedClass]);

  /* =========================
     INIT ATTENDANCE STATE
  ========================= */
  useEffect(() => {
    if (!studentsInClass.length) {
      setAttendanceState({});
      return;
    }

    const init = {};
    studentsInClass.forEach((stu) => {
      init[stu.admissionNo] = "Present";
    });
    setAttendanceState(init);
  }, [studentsInClass]);

  /* =========================
     DATE LOCK
  ========================= */
  const isDateLocked = (dateStr) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - selected) / (1000 * 60 * 60 * 24));
    return diff > LOCK_DAYS;
  };

  /* =========================
     SUBMIT ATTENDANCE
  ========================= */
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedClass || !selectedDate) {
      return showAlert("Select class and date.");
    }

    if (isDateLocked(selectedDate)) {
      return showAlert(`You can only edit attendance within ${LOCK_DAYS} days.`);
    }

    const period = getCurrentAcademicPeriod();

    // ✅ canonical records (backend-aligned)
    const records = studentsInClass.map((stu) => ({
      date: selectedDate,
      class: selectedClass,
      admissionNo: stu.admissionNo,
      status: attendanceState[stu.admissionNo] || "Present",
      markedBy: teacher?.staffId || teacher?.username || "staff",
      session: period.session,
      term: period.term,
    }));

    // ✅ local-first save (no wipe)
    const mergedLocal = [
      ...attendanceRecords.filter(
        (r) =>
          !(
            r.date === selectedDate &&
            r.class === selectedClass &&
            records.some((x) => x.admissionNo === r.admissionNo)
          )
      ),
      ...records,
    ];

    setAttendanceRecords(mergedLocal);

    // ✅ background sync (online only)
    if (navigator.onLine) {
      try {
        for (const r of records) {
          await apiFetch("/api/schoolPortalAttendance", {
            method: "POST",
            body: JSON.stringify(r),
          });
        }
      } catch {
        // silent — local copy already saved
      }
    }

    showAlert(
      navigator.onLine
        ? "Attendance saved successfully."
        : "Saved offline. Will sync when online."
    );
  };

  if (!teacher) {
    return <div className="content-section">Access Denied</div>;
  }

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
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Select Class</option>
          {[...new Set(students.map((s) => s.studentClass).filter(Boolean))]
            .sort()
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

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
                  <td>
                    {stu.firstName} {stu.lastName}
                  </td>
                  <td>
                    <select
                      value={attendanceState[stu.admissionNo] || "Present"}
                      onChange={(e) =>
                        setAttendanceState((p) => ({
                          ...p,
                          [stu.admissionNo]: e.target.value,
                        }))
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
