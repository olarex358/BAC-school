// src/pages/StudentProfile.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import "../styles/uncreated-pages.css";

const norm = (v) => String(v || "").trim();

function StudentProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [studentProfile, setStudentProfile] = useState(null);

  const [students, , loadingStudents] = useLocalStorage(
    "schoolPortalStudents",
    [],
    "http://localhost:5000/api/schoolPortalStudents"
  );

  const [results] = useLocalStorage(
    "schoolPortalResults",
    [],
    "http://localhost:5000/api/schoolPortalResults"
  );

  const [attendance] = useLocalStorage(
    "schoolPortalAttendance",
    [],
    "http://localhost:5000/api/schoolPortalAttendance"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalAlert, setIsModalAlert] = useState(false);

  useEffect(() => {
    const legacyUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const activeUser = user || legacyUser;

    // ✅ only redirect if NO auth at all
    if (!activeUser) {
      navigate("/login");
      return;
    }

    // ✅ normalize type check
    const type = String(activeUser.type || activeUser.userType || activeUser.role || "")
      .toLowerCase();
    if (!type.includes("student")) {
      navigate("/login");
      return;
    }

    // ✅ try to match student record with multiple keys
    const admissionNo =
      norm(activeUser.admissionNo) ||
      norm(activeUser.username) ||
      norm(activeUser.admission_number);

    let found =
      admissionNo &&
      students.find((s) => norm(s.admissionNo) === admissionNo);

    // ✅ If not found in students list, DO NOT redirect.
    // Fallback to activeUser so profile still opens.
    if (!found) {
      found = {
        firstName: activeUser.firstName || activeUser.firstname || "Student",
        lastName: activeUser.lastName || activeUser.surname || "",
        admissionNo: admissionNo || activeUser.admissionNo || "N/A",
        studentClass: activeUser.studentClass || activeUser.classLevel || "N/A",
        dob: activeUser.dob || activeUser.dateOfBirth || "",
        parentName: activeUser.parentName || activeUser.guardianName || "",
        parentPhone: activeUser.parentPhone || activeUser.guardianPhone || "",
        address: activeUser.address || "",
        enrollmentDate: activeUser.enrollmentDate || "",
        medicalNotes: activeUser.medicalNotes || "",
      };
    }

    setStudentProfile(found);
  }, [students, user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    navigate("/login");
  };

  const myResults = useMemo(() => {
    if (!studentProfile) return [];
    return results.filter(
      (r) =>
        r.studentAdmissionNo === studentProfile.admissionNo &&
        r.status === "Approved"
    );
  }, [results, studentProfile]);

  const myAttendance = useMemo(() => {
    if (!studentProfile) return [];
    return attendance.filter((a) => a.studentId === studentProfile.admissionNo);
  }, [attendance, studentProfile]);

  if (!studentProfile || loadingStudents) {
    return <div className="content-section">Loading profile...</div>;
  }

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />

      <h1>My Profile</h1>

      <div className="profile-tabs">
        <button
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={activeTab === "results" ? "active" : ""}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
        <button
          className={activeTab === "attendance" ? "active" : ""}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
      </div>

      {activeTab === "profile" && (
        <div className="profile-card">
          <div className="profile-details">
            <p>
              <strong>Full Name:</strong> {studentProfile.firstName}{" "}
              {studentProfile.lastName}
            </p>
            <p>
              <strong>Admission No:</strong> {studentProfile.admissionNo}
            </p>
            <p>
              <strong>Class:</strong> {studentProfile.studentClass}
            </p>
            <p>
              <strong>Date of Birth:</strong> {studentProfile.dob}
            </p>
            <p>
              <strong>Parent Name:</strong> {studentProfile.parentName}
            </p>
            <p>
              <strong>Parent Phone:</strong> {studentProfile.parentPhone}
            </p>
            <p>
              <strong>Address:</strong> {studentProfile.address}
            </p>
            <p>
              <strong>Enrollment Date:</strong> {studentProfile.enrollmentDate}
            </p>
            <p>
              <strong>Medical Notes:</strong>{" "}
              {studentProfile.medicalNotes || "N/A"}
            </p>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="table-container">
          <h3>My Results</h3>
          {myResults.length > 0 ? (
            <p>Approved results found: {myResults.length}</p>
          ) : (
            <p>No approved results available.</p>
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="table-container">
          <h3>My Attendance</h3>
          {myAttendance.length > 0 ? (
            <p>Attendance records found: {myAttendance.length}</p>
          ) : (
            <p>No attendance records found.</p>
          )}
        </div>
      )}

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StudentProfile;
