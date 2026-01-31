// src/pages/StaffTimetable.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const norm = (v) => String(v || "").trim();
const normLower = (v) => norm(v).toLowerCase();

// Try to parse period like: "1 (8:00-8:40)" or "1 (8:00–8:40)"
const parsePeriodToTimes = (period) => {
  const p = norm(period);
  if (!p) return { startTime: "", endTime: "", label: "" };

  const m = p.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (m) return { startTime: m[1], endTime: m[2], label: p };

  return { startTime: p, endTime: "", label: p };
};

const resolveSubjectCode = (subjectValue, subjects) => {
  const val = norm(subjectValue);
  if (!val) return "";

  const direct = (subjects || []).find((s) => norm(s.subjectCode) === val);
  if (direct) return direct.subjectCode;

  const byName = (subjects || []).find(
    (s) => normLower(s.subjectName) === normLower(val)
  );
  return byName ? byName.subjectCode : val;
};

const resolveTeacherId = (teacherValue, staffs) => {
  const val = norm(teacherValue);
  if (!val) return "";

  const direct = (staffs || []).find((s) => norm(s.staffId) === val);
  if (direct) return direct.staffId;

  const byName = (staffs || []).find((s) => {
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
      subjectSelect:
        entry.subjectSelect || resolveSubjectCode(entry.subject, subjects) || "",
      teacherSelect:
        entry.teacherSelect || resolveTeacherId(entry.teacher, staffs) || "",
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      location: entry.location || entry.room || "",
      type: entry.type || "Class",
    };
  }

  // AdminTimetableManagement shape
  const { startTime, endTime, label } = parsePeriodToTimes(entry?.period);

  return {
    _id:
      entry?._id ||
      entry?.id ||
      `${entry?.className}-${entry?.day}-${entry?.period}-${entry?.subject}`,
    day: entry?.day || "Monday",
    classSelect: entry?.className || "",
    subjectSelect: resolveSubjectCode(entry?.subject, subjects),
    teacherSelect: resolveTeacherId(entry?.teacher, staffs),
    startTime,
    endTime,
    location: entry?.room || "",
    type: "Class",
    rawPeriod: label,
  };
};

function StaffTimetable() {
  const navigate = useNavigate();
  const [loggedInStaff, setLoggedInStaff] = useState(null);

  // ✅ remove localhost and use relative /api paths
  const [allTimetableEntries, , loadingTimetable] = useLocalStorage(
    "schoolPortalTimetables",
    [],
    "/api/schoolPortalTimetables"
  );

  const [subjects] = useLocalStorage(
    "schoolPortalSubjects",
    [],
    "/api/schoolPortalSubjects"
  );

  const [staffs] = useLocalStorage(
    "schoolPortalStaff",
    [],
    "/api/schoolPortalStaff"
  );

  const [staffSpecificTimetable, setStaffSpecificTimetable] = useState([]);

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
    if (user && user.type === "staff") {
      setLoggedInStaff(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const normalizedEntries = useMemo(() => {
    const list = Array.isArray(allTimetableEntries) ? allTimetableEntries : [];
    return list.map((e) => normalizeEntry(e, subjects || [], staffs || []));
  }, [allTimetableEntries, subjects, staffs]);

  useEffect(() => {
    if (loggedInStaff && normalizedEntries.length > 0) {
      const teacherAssignedClasses = loggedInStaff.assignedClasses || [];
      const teacherAssignedSubjects = loggedInStaff.assignedSubjects || [];
      const myId = loggedInStaff.staffId;

      const myName = `${norm(loggedInStaff.firstname)} ${norm(
        loggedInStaff.surname
      )}`.trim();

      const filteredForStaff = normalizedEntries
        .filter((entry) => {
          const isAssignedClass =
            teacherAssignedClasses.length === 0 ||
            teacherAssignedClasses.includes(entry.classSelect);

          const isAssignedSubject =
            teacherAssignedSubjects.length === 0 ||
            teacherAssignedSubjects.includes(entry.subjectSelect);

          const teacherMatches =
            norm(entry.teacherSelect) === norm(myId) ||
            normLower(entry.teacherSelect) === normLower(myName);

          return isAssignedClass && isAssignedSubject && teacherMatches;
        })
        .sort((a, b) => {
          const dayComparison =
            daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
          if (dayComparison !== 0) return dayComparison;
          return String(a.startTime || "").localeCompare(String(b.startTime || ""));
        });

      setStaffSpecificTimetable(filteredForStaff);
    } else {
      setStaffSpecificTimetable([]);
    }
  }, [loggedInStaff, normalizedEntries]);

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

  if (!loggedInStaff || loadingTimetable) {
    return <div className="content-section">Loading staff timetable...</div>;
  }

  const uniqueTimeSlots = [
    ...new Set(
      staffSpecificTimetable.map((entry) => {
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

  staffSpecificTimetable.forEach((entry) => {
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

      <h1>My Teaching Timetable</h1>
      <p>
        Welcome, {loggedInStaff.firstname} {loggedInStaff.surname}! Here is your
        teaching timetable:
      </p>

      {staffSpecificTimetable.length > 0 ? (
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
                            <p className="timetable-type">{entry.type || "Class"}</p>
                            <small className="timetable-class">{entry.classSelect}</small>
                            <small className="timetable-location">
                              ({entry.location || entry.room || "-"})
                            </small>
                            <div style={{ fontSize: 12, opacity: 0.85 }}>
                              <small>{getTeacherName(entry.teacherSelect)}</small>
                            </div>
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
        <p>
          No timetable entries found for your assigned classes and subjects yet.
          Please contact administration.
        </p>
      )}

      <p style={{ marginTop: "20px" }}>
        Always refer to official school announcements for any timetable changes.
      </p>

      <button onClick={handleLogout} style={{ marginTop: "20px" }}>
        Logout
      </button>

      <button
        onClick={() =>
          showAlert("Timetable updates automatically when admin updates it.")
        }
        style={{ marginTop: 10 }}
      >
        Info
      </button>
    </div>
  );
}

export default StaffTimetable;
