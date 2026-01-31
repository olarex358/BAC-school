import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

const norm = (v) => String(v || "").trim();

function StaffProfile() {
  const [staffInfo, setStaffInfo] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ remove localhost, use relative /api paths
  const [staffs] = useLocalStorage("schoolPortalStaff", [], "/api/schoolPortalStaff");

  const [subjects] = useLocalStorage(
    "schoolPortalSubjects",
    [],
    "/api/schoolPortalSubjects"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalAlert, setIsModalAlert] = useState(false);

  useEffect(() => {
    const legacyUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const activeUser = user || legacyUser;

    if (!activeUser) {
      navigate("/login");
      return;
    }

    const type = String(activeUser.type || activeUser.userType || activeUser.role || "")
      .toLowerCase();

    if (!type.includes("staff") && !type.includes("teacher")) {
      navigate("/login");
      return;
    }

    const staffId =
      norm(activeUser.staffId) || norm(activeUser.staffID) || norm(activeUser.username);

    let found = staffId && (staffs || []).find((s) => norm(s.staffId) === staffId);

    // ✅ If not found in staffs list, DO NOT redirect.
    if (!found) {
      found = {
        firstname: activeUser.firstname || activeUser.firstName || "Staff",
        surname: activeUser.surname || activeUser.lastName || "",
        staffId: staffId || activeUser.staffId || "N/A",
        role: activeUser.role || "Staff",
        department: activeUser.department || "N/A",
        contactEmail: activeUser.contactEmail || activeUser.email || "N/A",
        contactPhone: activeUser.contactPhone || activeUser.phone || "N/A",
        qualifications: activeUser.qualifications || "N/A",
        assignedClasses: activeUser.assignedClasses || [],
        assignedSubjects: activeUser.assignedSubjects || [],
      };
    }

    setStaffInfo(found);
  }, [navigate, staffs, user]);

  const getSubjectName = (subjectCode) => {
    const subject = (subjects || []).find((s) => s.subjectCode === subjectCode);
    return subject ? subject.subjectName : subjectCode;
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (!staffInfo) {
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
      <div className="profile-card">
        <div className="profile-details">
          <div className="profile-item">
            <strong>Full Name:</strong>{" "}
            <span>
              {staffInfo.firstname} {staffInfo.surname}
            </span>
          </div>
          <div className="profile-item">
            <strong>Staff ID:</strong> <span>{staffInfo.staffId}</span>
          </div>
          <div className="profile-item">
            <strong>Role:</strong> <span>{staffInfo.role}</span>
          </div>
          <div className="profile-item">
            <strong>Department:</strong> <span>{staffInfo.department}</span>
          </div>
          <div className="profile-item">
            <strong>Email:</strong> <span>{staffInfo.contactEmail}</span>
          </div>
          <div className="profile-item">
            <strong>Phone:</strong> <span>{staffInfo.contactPhone}</span>
          </div>
          <div className="profile-item">
            <strong>Qualifications:</strong> <span>{staffInfo.qualifications}</span>
          </div>
          <div className="profile-item">
            <strong>Assigned Classes:</strong>{" "}
            <span>
              {staffInfo.assignedClasses?.length
                ? staffInfo.assignedClasses.join(", ")
                : "N/A"}
            </span>
          </div>
          <div className="profile-item">
            <strong>Assigned Subjects:</strong>{" "}
            <span>
              {staffInfo.assignedSubjects?.length
                ? staffInfo.assignedSubjects.map(getSubjectName).join(", ")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default StaffProfile;
