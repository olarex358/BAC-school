import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

/* =======================
   CORE / PUBLIC
======================= */
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SetupWizard from "./pages/SetupWizard";
import ActivateAccount from "./pages/ActivateAccount";
import NewsPage from "./pages/NewsPage";
import NewsDetails from "./pages/NewsDetails";

/* =======================
   DASHBOARDS
======================= */
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";

/* =======================
   ADMIN PAGES
======================= */
import StudentManagement from "./pages/StudentManagement";
import StaffManagement from "./pages/StaffManagement";
import ResultsManagement from "./pages/ResultsManagement";
import ViewReports from "./pages/ViewReports";
import AcademicManagement from "./pages/AcademicManagement";
import UserPermissionsManagement from "./pages/UserPermissionsManagement";
import AdminMessaging from "./pages/AdminMessaging";
import AdminFeesManagement from "./pages/AdminFeesManagement";
import AdminCalendarManagement from "./pages/AdminCalendarManagement";
import AdminSyllabusManagement from "./pages/AdminSyllabusManagement";
import AdminTimetableManagement from "./pages/AdminTimetableManagement";
import AdminDigitalLibrary from "./pages/AdminDigitalLibrary";
import AdminCertificationManagement from "./pages/AdminCertificationManagement";
import AdminHomeContent from "./pages/AdminHomeContent";
import ApplicationReview from "./pages/ApplicationReview";
import AdminResultsApproval from "./pages/AdminResultsApproval";
import AttendanceAlerts from "./pages/AttendanceAlerts";
import AdminLicense from "./pages/AdminLicense";

/* =======================
   STUDENT PAGES
======================= */
import StudentProfile from "./pages/StudentProfile";
import StudentResults from "./pages/StudentResults";
import StudentAttendance from "./pages/StudentAttendance";
import StudentSubjects from "./pages/StudentSubjects";
import StudentFees from "./pages/StudentFees";
import StudentCalendar from "./pages/StudentCalendar";
import StudentMails from "./pages/StudentMails";
import StudentPasswordChange from "./pages/StudentPasswordChange";
import StudentTimetable from "./pages/StudentTimetable";

/* =======================
   STAFF PAGES
======================= */
import StaffProfile from "./pages/StaffProfile";
import StaffSubjects from "./pages/StaffSubjects";
import StaffCalendar from "./pages/StaffCalendar";
import StaffMails from "./pages/StaffMails";
import StaffPasswordChange from "./pages/StaffPasswordChange";
import StaffTimetable from "./pages/StaffTimetable";

/* =======================
   ACCOUNTANT
======================= */
import AccountantPayments from "./pages/accountant/AccountantPayments";
import PaymentReceipt from "./pages/accountant/PaymentReceipt";

/* =======================
   LAYOUT
======================= */
import Header from "./components/Header";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import ProtectedRoute from "./components/ProtectedRoute";
/* =======================
   CONFIG
======================= */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://school-portal-backend-i29s.onrender.com";

/* =======================
   PROTECTED ROUTE
======================= */

function App() {
  const [isInstalled, setIsInstalled] = useState(null);

  /* =======================
     CHECK SETUP STATUS (SAFE)
  ======================= */
  useEffect(() => {
    fetch(`${API_BASE}/api/setup/status`)
      .then((res) => res.json())
      .then((data) => setIsInstalled(data.installed === true))
      .catch(() => setIsInstalled(true));
  }, []);

  if (isInstalled === null) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <h3>Initializing system…</h3>
      </div>
    );
  }

  return (
    <div className="App">
      <OfflineBanner />
      <Header />

      <main style={{ minHeight: "calc(100vh - 120px)", padding: "20px" }}>
        <Routes>

          {/* HOME */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />

          {/* SETUP */}
          <Route
            path="/setup"
            element={
              isInstalled ? <Navigate to="/login" replace /> : <SetupWizard />
            }
          />

          {/* AUTH (UNPROTECTED) */}
          <Route
            path="/login"
            element={
              !isInstalled ? <Navigate to="/setup" replace /> : <LoginPage />
            }
          />
          <Route path="/activate-account" element={<ActivateAccount />} />

          {/* PUBLIC */}
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetails />} />

          {/* ADMIN */}
          <Route path="/dashboard" element={<ProtectedRoute allowedTypes={["admin"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/student-management" element={<ProtectedRoute allowedTypes={["admin"]}><StudentManagement /></ProtectedRoute>} />
          <Route path="/staff-management" element={<ProtectedRoute allowedTypes={["admin"]}><StaffManagement /></ProtectedRoute>} />
          <Route path="/results-management" element={<ProtectedRoute allowedTypes={["admin","staff"]}><ResultsManagement /></ProtectedRoute>} />
          <Route path="/admin-results-approval" element={<ProtectedRoute allowedTypes={["admin"]}><AdminResultsApproval /></ProtectedRoute>} />
          <Route path="/view-reports" element={<ProtectedRoute allowedTypes={["admin","staff"]}><ViewReports /></ProtectedRoute>} />
          <Route path="/academic-management" element={<ProtectedRoute allowedTypes={["admin"]}><AcademicManagement /></ProtectedRoute>} />
          <Route path="/user-permissions-management" element={<ProtectedRoute allowedTypes={["admin"]}><UserPermissionsManagement /></ProtectedRoute>} />
          <Route path="/admin-messaging" element={<ProtectedRoute allowedTypes={["admin"]}><AdminMessaging /></ProtectedRoute>} />
          <Route path="/admin-fees-management" element={<ProtectedRoute allowedTypes={["admin"]}><AdminFeesManagement /></ProtectedRoute>} />
          <Route path="/admin-calendar-management" element={<ProtectedRoute allowedTypes={["admin"]}><AdminCalendarManagement /></ProtectedRoute>} />
          <Route path="/admin-syllabus-management" element={<ProtectedRoute allowedTypes={["admin"]}><AdminSyllabusManagement /></ProtectedRoute>} />
          <Route path="/admin-timetable-management" element={<ProtectedRoute allowedTypes={["admin"]}><AdminTimetableManagement /></ProtectedRoute>} />
          <Route path="/admin-digital-library" element={<ProtectedRoute allowedTypes={["admin"]}><AdminDigitalLibrary /></ProtectedRoute>} />
          <Route path="/admin-certification-management" element={<ProtectedRoute allowedTypes={["admin"]}><AdminCertificationManagement /></ProtectedRoute>} />
          <Route path="/admin-home-content" element={<ProtectedRoute allowedTypes={["admin"]}><AdminHomeContent /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute allowedTypes={["admin"]}><ApplicationReview /></ProtectedRoute>} />
          <Route path="/attendance-alerts" element={<ProtectedRoute allowedTypes={["admin"]}><AttendanceAlerts /></ProtectedRoute>} />
          <Route path="/admin-license" element={<ProtectedRoute allowedTypes={["admin"]}><AdminLicense /></ProtectedRoute>} />

          {/* STUDENT */}
          <Route path="/student-dashboard" element={<ProtectedRoute allowedTypes={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student-profile" element={<ProtectedRoute allowedTypes={["student"]}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student-results" element={<ProtectedRoute allowedTypes={["student"]}><StudentResults /></ProtectedRoute>} />
          <Route path="/student-attendance" element={<ProtectedRoute allowedTypes={["student"]}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student-subjects" element={<ProtectedRoute allowedTypes={["student"]}><StudentSubjects /></ProtectedRoute>} />
          <Route path="/student-fees" element={<ProtectedRoute allowedTypes={["student"]}><StudentFees /></ProtectedRoute>} />
          <Route path="/student-calendar" element={<ProtectedRoute allowedTypes={["student"]}><StudentCalendar /></ProtectedRoute>} />
          <Route path="/student-mails" element={<ProtectedRoute allowedTypes={["student"]}><StudentMails /></ProtectedRoute>} />
          <Route path="/student-password-change" element={<ProtectedRoute allowedTypes={["student"]}><StudentPasswordChange /></ProtectedRoute>} />
          <Route path="/student-timetable" element={<ProtectedRoute allowedTypes={["student"]}><StudentTimetable /></ProtectedRoute>} />

          {/* STAFF */}
          <Route path="/staff-dashboard" element={<ProtectedRoute allowedTypes={["staff"]}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff-profile" element={<ProtectedRoute allowedTypes={["staff"]}><StaffProfile /></ProtectedRoute>} />
          <Route path="/staff-subjects" element={<ProtectedRoute allowedTypes={["staff"]}><StaffSubjects /></ProtectedRoute>} />
          <Route path="/staff-calendar" element={<ProtectedRoute allowedTypes={["staff"]}><StaffCalendar /></ProtectedRoute>} />
          <Route path="/staff-mails" element={<ProtectedRoute allowedTypes={["staff"]}><StaffMails /></ProtectedRoute>} />
          <Route path="/staff-password-change" element={<ProtectedRoute allowedTypes={["staff"]}><StaffPasswordChange /></ProtectedRoute>} />
          <Route path="/staff-timetable" element={<ProtectedRoute allowedTypes={["staff"]}><StaffTimetable /></ProtectedRoute>} />

          {/* ACCOUNTANT */}
          <Route path="/accountant-dashboard" element={<ProtectedRoute allowedTypes={["accountant"]}><AccountantDashboard /></ProtectedRoute>} />
          <Route path="/accountant-payments" element={<ProtectedRoute allowedTypes={["accountant"]}><AccountantPayments /></ProtectedRoute>} />
          <Route path="/accountant/receipt/:reference" element={<ProtectedRoute allowedTypes={["accountant"]}><PaymentReceipt /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
