import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import { apiFetch } from "../api";

function StudentCertificationRegistration() {
  const navigate = useNavigate();
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  // ✅ remove localhost
  const [subjects] = useLocalStorage(
    "schoolPortalSubjects",
    [],
    "/api/schoolPortalSubjects"
  );

  const [certRegistrations, setCertRegistrations, loadingRegs] = useLocalStorage(
    "schoolPortalCertificationRegistrations",
    [],
    "/api/schoolPortalCertificationRegistrations"
  );

  const [registrationForm, setRegistrationForm] = useState({
    subjectCode: "",
    examDate: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showAlert = (msg) => {
    setModalMessage(msg);
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

  const validateForm = () => {
    const errors = {};
    if (!registrationForm.subjectCode) errors.subjectCode = "Please select a subject.";
    if (!registrationForm.examDate) errors.examDate = "Please select an exam date.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setRegistrationForm((prev) => ({ ...prev, [id]: value }));
    setFormErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert("Please correct the errors in the form.");
      return;
    }

    const newRegistration = {
      id: `${loggedInStudent.admissionNo}-${registrationForm.subjectCode}`,
      studentAdmissionNo: loggedInStudent.admissionNo,
      ...registrationForm,
      status: "Registered",
      timestamp: new Date().toISOString(),
    };

    if ((certRegistrations || []).some((reg) => reg.id === newRegistration.id)) {
      showAlert("You are already registered for this certification exam.");
      return;
    }

    try {
      // ✅ use apiFetch so JWT is attached
      const response = await apiFetch("/api/schoolPortalCertificationRegistrations", {
        method: "POST",
        body: JSON.stringify(newRegistration),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setCertRegistrations((prev) => [...(prev || []), data]);
        showAlert("Successfully registered for the certification exam!");
      } else {
        showAlert(data.message || "Failed to register for the exam.");
      }
    } catch {
      showAlert("Network error. Please check your connection.");
    }

    setRegistrationForm({ subjectCode: "", examDate: "" });
    setFormErrors({});
  };

  const getSubjectName = (subjectCode) => {
    const subject = (subjects || []).find((s) => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const studentRegistrations = (certRegistrations || []).filter(
    (reg) => reg.studentAdmissionNo === loggedInStudent?.admissionNo
  );

  if (!loggedInStudent || loadingRegs) {
    return <div className="content-section">Loading...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
        isAlert
      />

      <h1>Certification Exam Registration</h1>
      <p>
        Welcome, {loggedInStudent.firstName} {loggedInStudent.lastName}! You can
        register for an upcoming certification exam here.
      </p>

      <div className="sub-section">
        <h2>Register for an Exam</h2>
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="subjectCode" className="form-label">
              Subject:
            </label>
            <select
              id="subjectCode"
              value={registrationForm.subjectCode}
              onChange={handleChange}
              className={`form-input ${formErrors.subjectCode ? "form-input-error" : ""}`}
            >
              <option value="">-- Select Subject --</option>
              {(subjects || []).map((subject) => (
                <option key={subject._id} value={subject.subjectCode}>
                  {getSubjectName(subject.subjectCode)}
                </option>
              ))}
            </select>
            {formErrors.subjectCode && <p className="error-message">{formErrors.subjectCode}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="examDate" className="form-label">
              Exam Date:
            </label>
            <input
              type="date"
              id="examDate"
              value={registrationForm.examDate}
              onChange={handleChange}
              className={`form-input ${formErrors.examDate ? "form-input-error" : ""}`}
            />
            {formErrors.examDate && <p className="error-message">{formErrors.examDate}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="form-submit-btn">
              Register
            </button>
          </div>
        </form>
      </div>

      <div className="sub-section">
        <h2>My Registrations</h2>
        <div className="table-container">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Exam Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentRegistrations.length > 0 ? (
                studentRegistrations.map((reg, index) => (
                  <tr key={reg._id || reg.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                    <td>{getSubjectName(reg.subjectCode)}</td>
                    <td>{reg.examDate}</td>
                    <td>{reg.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data-message">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StudentCertificationRegistration;
