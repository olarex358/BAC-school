import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import "./App.css";

/* ================= CORE / PUBLIC ================= */
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SetupWizard from "./pages/SetupWizard";
import ActivateAccount from "./pages/ActivateAccount";
import NewsPage from "./pages/NewsPage";
import NewsDetails from "./pages/NewsDetails";
import EventsPage from "./pages/EventsPage";

/* ================= DASHBOARDS ================= */
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";

/* ================= ADMIN ================= */
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
import AttendanceAnalytics from "./pages/AttendanceAnalytics";
import AttendanceExport from "./pages/AttendanceExport";
import AttendanceReports from "./pages/AttendanceReports";
import PromotionManagement from "./pages/PromotionManagement";
import PromotionRollback from "./pages/PromotionRollback";
import AuditTrail from "./pages/AuditTrail";
import AuditTrailPrint from "./pages/AuditTrailPrint";
import AdminLicense from "./pages/AdminLicense";

/* ================= STUDENT ================= */
import StudentProfile from "./pages/StudentProfile";
import StudentResults from "./pages/StudentResults";
import StudentAttendance from "./pages/StudentAttendance";
import StudentSubjects from "./pages/StudentSubjects";
import StudentFees from "./pages/StudentFees";
import StudentCalendar from "./pages/StudentCalendar";
import StudentMails from "./pages/StudentMails";
import StudentPasswordChange from "./pages/StudentPasswordChange";
import StudentTimetable from "./pages/StudentTimetable";
import StudentSyllabus from "./pages/StudentSyllabus";
import StudentCertification from "./pages/StudentCertification";
import StudentCertificationRegistration from "./pages/StudentCertificationRegistration";
import StudentTermResult from "./pages/StudentTermResult";
import UserDigitalLibrary from "./pages/UserDigitalLibrary";

/* ================= STAFF ================= */
import StaffProfile from "./pages/StaffProfile";
import StaffSubjects from "./pages/StaffSubjects";
import StaffCalendar from "./pages/StaffCalendar";
import StaffMails from "./pages/StaffMails";
import StaffPasswordChange from "./pages/StaffPasswordChange";
import StaffTimetable from "./pages/StaffTimetable";
import MarkAttendance from "./pages/MarkAttendance";

/* ================= ACCOUNTANT ================= */
import AccountantFeesManagement from "./pages/accountant/AccountantFeesManagement";
import AccountantPayments from "./pages/accountant/AccountantPayments";
import PaymentReceipt from "./pages/accountant/PaymentReceipt";
import AuditLog from "./pages/accountant/AuditLog";
import FeesSetup from "./pages/accountant/FeesSetup";
import FinanceChart from "./pages/accountant/FinanceChart";
import OnlinePaymentPlaceholder from "./pages/accountant/OnlinePaymentPlaceholder";

/* ================= SYSTEM ================= */
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import { apiFetch } from "./api";

function App() {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(null);

  /* ===== SETUP CHECK (RUN ONCE) ===== */
  useEffect(() => {
    let mounted = true;

    const checkSetup = async () => {
      try {
        const res = await apiFetch("/api/setup/status");
        const data = await res.json();
        if (!mounted) return;

        setIsInstalled(data.installed);

        if (!data.installed && !localStorage.getItem("authToken")) {
          navigate("/setup", { replace: true });
        }
      } catch {
        if (!mounted) return;
        setIsInstalled(true);
      }
    };

    checkSetup();
    return () => (mounted = false);
  }, []);

  if (isInstalled === null) {
    return <div style={{ padding: 60, textAlign: "center" }}>Initializing system…</div>;
  }

  return (
    <div className="App">
      <OfflineBanner />
      <Header />

      <main style={{ minHeight: "calc(100vh - 120px)", padding: 20 }}>
        <Routes>

          {/* ===== PUBLIC ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/activate-account" element={<ActivateAccount />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetails />} />
          <Route path="/events" element={<EventsPage />} />

          {/* ===== ADMIN ===== */}
          <Route path="/dashboard" element={<ProtectedRoute allowedTypes={["admin"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute allowedTypes={["admin"]}><ApplicationReview /></ProtectedRoute>} />
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
          <Route path="/attendance-alerts" element={<ProtectedRoute allowedTypes={["admin"]}><AttendanceAlerts /></ProtectedRoute>} />
          <Route path="/attendance-analytics" element={<ProtectedRoute allowedTypes={["admin"]}><AttendanceAnalytics /></ProtectedRoute>} />
          <Route path="/attendance-export" element={<ProtectedRoute allowedTypes={["admin"]}><AttendanceExport /></ProtectedRoute>} />
          <Route path="/attendance-reports" element={<ProtectedRoute allowedTypes={["admin"]}><AttendanceReports /></ProtectedRoute>} />
          <Route path="/promotion-management" element={<ProtectedRoute allowedTypes={["admin"]}><PromotionManagement /></ProtectedRoute>} />
          <Route path="/promotion-rollback" element={<ProtectedRoute allowedTypes={["admin"]}><PromotionRollback /></ProtectedRoute>} />
          <Route path="/audit-trail" element={<ProtectedRoute allowedTypes={["admin"]}><AuditTrail /></ProtectedRoute>} />
          <Route path="/audit-trail-print" element={<ProtectedRoute allowedTypes={["admin"]}><AuditTrailPrint /></ProtectedRoute>} />
          <Route path="/admin-license" element={<ProtectedRoute allowedTypes={["admin"]}><AdminLicense /></ProtectedRoute>} />

          {/* ===== STUDENT ===== */}
          <Route path="/student-dashboard" element={<ProtectedRoute allowedTypes={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student-profile" element={<ProtectedRoute allowedTypes={["student"]}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student-results" element={<ProtectedRoute allowedTypes={["student"]}><StudentResults /></ProtectedRoute>} />
          <Route path="/student-term-result" element={<ProtectedRoute allowedTypes={["student"]}><StudentTermResult /></ProtectedRoute>} />
          <Route path="/student-attendance" element={<ProtectedRoute allowedTypes={["student"]}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student-subjects" element={<ProtectedRoute allowedTypes={["student"]}><StudentSubjects /></ProtectedRoute>} />
          <Route path="/student-fees" element={<ProtectedRoute allowedTypes={["student"]}><StudentFees /></ProtectedRoute>} />
          <Route path="/student-calendar" element={<ProtectedRoute allowedTypes={["student"]}><StudentCalendar /></ProtectedRoute>} />
          <Route path="/student-mails" element={<ProtectedRoute allowedTypes={["student"]}><StudentMails /></ProtectedRoute>} />
          <Route path="/student-password-change" element={<ProtectedRoute allowedTypes={["student"]}><StudentPasswordChange /></ProtectedRoute>} />
          <Route path="/student-timetable" element={<ProtectedRoute allowedTypes={["student"]}><StudentTimetable /></ProtectedRoute>} />
          <Route path="/student-syllabus" element={<ProtectedRoute allowedTypes={["student"]}><StudentSyllabus /></ProtectedRoute>} />
          <Route path="/student-certification" element={<ProtectedRoute allowedTypes={["student"]}><StudentCertification /></ProtectedRoute>} />
          <Route path="/student-certification-registration" element={<ProtectedRoute allowedTypes={["student"]}><StudentCertificationRegistration /></ProtectedRoute>} />
          <Route path="/student-digital-library" element={<ProtectedRoute allowedTypes={["student"]}><UserDigitalLibrary /></ProtectedRoute>} />

          {/* ===== STAFF ===== */}
          <Route path="/staff-dashboard" element={<ProtectedRoute allowedTypes={["staff"]}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff-profile" element={<ProtectedRoute allowedTypes={["staff"]}><StaffProfile /></ProtectedRoute>} />
          <Route path="/staff-subjects" element={<ProtectedRoute allowedTypes={["staff"]}><StaffSubjects /></ProtectedRoute>} />
          <Route path="/staff-calendar" element={<ProtectedRoute allowedTypes={["staff"]}><StaffCalendar /></ProtectedRoute>} />
          <Route path="/staff-mails" element={<ProtectedRoute allowedTypes={["staff"]}><StaffMails /></ProtectedRoute>} />
          <Route path="/staff-password-change" element={<ProtectedRoute allowedTypes={["staff"]}><StaffPasswordChange /></ProtectedRoute>} />
          <Route path="/staff-timetable" element={<ProtectedRoute allowedTypes={["staff"]}><StaffTimetable /></ProtectedRoute>} />
          <Route path="/mark-attendance" element={<ProtectedRoute allowedTypes={["staff"]}><MarkAttendance /></ProtectedRoute>} />

          {/* ===== ACCOUNTANT ===== */}
          <Route path="/accountant-dashboard" element={<ProtectedRoute allowedTypes={["accountant"]}><AccountantDashboard /></ProtectedRoute>} />
          <Route path="/accountant/fees" element={<ProtectedRoute allowedTypes={["accountant"]}><AccountantFeesManagement /></ProtectedRoute>} />
          <Route path="/accountant/payments" element={<ProtectedRoute allowedTypes={["accountant"]}><AccountantPayments /></ProtectedRoute>} />
          <Route path="/accountant/receipt/:reference" element={<ProtectedRoute allowedTypes={["accountant"]}><PaymentReceipt /></ProtectedRoute>} />
          <Route path="/accountant/audit" element={<ProtectedRoute allowedTypes={["accountant"]}><AuditLog /></ProtectedRoute>} />
          <Route path="/accountant/fees-setup" element={<ProtectedRoute allowedTypes={["accountant"]}><FeesSetup /></ProtectedRoute>} />
          <Route path="/accountant/finance-chart" element={<ProtectedRoute allowedTypes={["accountant"]}><FinanceChart /></ProtectedRoute>} />
          <Route path="/accountant/online-payments" element={<ProtectedRoute allowedTypes={["accountant"]}><OnlinePaymentPlaceholder /></ProtectedRoute>} />

          {/* ===== 404 ===== */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", padding: 50 }}>
                <h2>404 – Page Not Found</h2>
                <button onClick={() => navigate(-1)}>Go Back</button>
              </div>
            }
          />

        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
