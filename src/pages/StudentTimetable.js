// src/pages/StudentTimetable.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const norm = (v) => String(v || "").trim();
const normLower = (v) => norm(v).toLowerCase();

const parsePeriodToTimes = (period) => {
  const p = norm(period);
  if (!p) return { startTime: "", endTime: "" };

  const m = p.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (m) return { startTime: m[1], endTime: m[2] };

  return { startTime: p, endTime: "" };
};

const resolveSubjectCode = (subjectValue, subjects) => {
  const val = norm(subjectValue);
  if (!val) return "";
  const direct = subjects.find((s) => norm(s.subjectCode) === val);
  if (direct) return direct.subjectCode;
  const byName = subjects.find((s) => normLower(s.subjectName) === normLower(val));
  return byName ? byName.subjectCode : val;
};

const resolveTeacherId = (teacherValue, staffs) => {
  const val = norm(teacherValue);
  if (!val) return "";
  const direct = staffs.find((s) => norm(s.staffId) === val);
  if (direct) return direct.staffId;

  const byName = staffs.find((s) => {
    const full = `${norm(s.firstname)} ${norm(s.surname)}`.trim();
    return normLower(full) === normLower(val);
  });
  return byName ? byName.staffId : val;
};

const normalizeEntry = (entry, subjects, staffs) => {
  const hasOldShape =
    entry?.classSelect || entry?.subjectSelect || entry?.startTime || entry?.endTime;

  if (hasOldShape) {
    return {
      ...entry,
      day: entry.day || "Monday",
      classSelect: entry.classSelect || entry.className || "",
      subjectSelect: entry.subjectSelect || resolveSubjectCode(entry.subject, subjects) || "",
      teacherSelect: entry.teacherSelect || resolveTeacherId(entry.teacher, staffs) || "",
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      location: entry.location || entry.room || "",
      type: entry.type || "Class",
    };
  }

  const { startTime, endTime } = parsePeriodToTimes(entry?.period);

  return {
    _id: entry?._id || entry?.id || `${entry?.className}-${entry?.day}-${entry?.period}-${entry?.subject}`,
    day: entry?.day || "Monday",
    classSelect: entry?.className || "",
    subjectSelect: resolveSubjectCode(entry?.subject, subjects),
    teacherSelect: resolveTeacherId(entry?.teacher, staffs),
    startTime,
    endTime,
    location: entry?.room || "",
    type: "Class",
  };
};

function StudentTimetable() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  const [allTimetableEntries, , loadingTimetable] = useLocalStorage(
    "schoolPortalTimetables",
    [],
    "http://localhost:5000/api/schoolPortalTimetables"
  );
  const [subjects] = useLocalStorage(
    "schoolPortalSubjects",
    [],
    "http://localhost:5000/api/schoolPortalSubjects"
  );
  const [staffs] = useLocalStorage(
    "schoolPortalStaff",
    [],
    "http://localhost:5000/api/schoolPortalStaff"
  );

  const [studentSpecificTimetable, setStudentSpecificTimetable] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.type === "student") {
      setLoggedInStudent(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const normalizedEntries = useMemo(() => {
    const list = Array.isArray(allTimetableEntries) ? allTimetableEntries : [];
    return list.map((e) => normalizeEntry(e, subjects || [], staffs || []));
  }, [allTimetableEntries, subjects, staffs]);

  useEffect(() => {
    if (loggedInStudent && normalizedEntries.length > 0) {
      const filteredForStudent = normalizedEntries
        .filter((entry) => entry.classSelect === loggedInStudent.studentClass)
        .sort((a, b) => {
          const dayComparison = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
          if (dayComparison !== 0) return dayComparison;
          return String(a.startTime || "").localeCompare(String(b.startTime || ""));
        });

      setStudentSpecificTimetable(filteredForStudent);
    } else {
      setStudentSpecificTimetable([]);
    }
  }, [loggedInStudent, normalizedEntries]);

  const getSubjectName = (subjectCode) => {
    const subject = (subjects || []).find((s) => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const getTeacherName = (staffIdOrName) => {
    const teacher = (staffs || []).find((s) => s.staffId === staffIdOrName);
    if (teacher) return `${teacher.firstname} ${teacher.surname}`;
    return staffIdOrName || "Unknown Teacher";
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/home");
  };

  if (!loggedInStudent || loadingTimetable) {
    return <div className="content-section">Loading timetable...</div>;
  }

  const uniqueTimeSlots = [
    ...new Set(
      studentSpecificTimetable.map((entry) => {
        const end = entry.endTime ? ` - ${entry.endTime}` : "";
        return `${entry.startTime}${end}`.trim();
      })
    ),
  ].sort();

  const timetableGrid = {};
  daysOfWeek.forEach((day) => {
    timetableGrid[day] = {};
    uniqueTimeSlots.forEach((slot) => {
      timetableGrid[day][slot] = null;
    });
  });

  studentSpecificTimetable.forEach((entry) => {
    const end = entry.endTime ? ` - ${entry.endTime}` : "";
    const slot = `${entry.startTime}${end}`.trim();
    if (timetableGrid[entry.day] && timetableGrid[entry.day][slot] === null) {
      timetableGrid[entry.day][slot] = entry;
    }
  });

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />

      <h1>My Timetable</h1>
      <p>
        Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! Here is your class timetable:
      </p>

      {studentSpecificTimetable.length > 0 ? (
        <div className="timetable-responsive-table">
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                {daysOfWeek.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {uniqueTimeSlots.map((slot, index) => (
                <tr key={slot} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                  <td>
                    <strong>{slot}</strong>
                  </td>

                  {daysOfWeek.map((day) => {
                    const entry = timetableGrid[day][slot];
                    const safeType = (entry?.type || "Class").toLowerCase();

                    return (
                      <td key={day} className={`timetable-cell timetable-type-${safeType}`}>
                        {entry ? (
                          <>
                            <p className="timetable-subject">
                              {getSubjectName(entry.subjectSelect)}
                            </p>
                            <small className="timetable-teacher">
                              {getTeacherName(entry.teacherSelect)}
                            </small>
                            <small className="timetable-location">
                              ({entry.location || entry.room || "-"})
                            </small>
                          </>
                        ) : (
                          <span className="empty-cell">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No timetable entries found for your class yet. Please contact administration.</p>
      )}

      <p style={{ marginTop: "20px" }}>
        Always refer to official school announcements for any timetable changes.
      </p>
      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );
}

export default StudentTimetable;
