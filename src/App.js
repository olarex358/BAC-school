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
import AdminResultsApproval from "./pages/AdminResultsApproval";
import AdminLicense from "./pages/AdminLicense";

/* ================= APPLICATION ================= */
import Apply from "./pages/Apply";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationInfo from "./pages/ApplicationInfo";
import ApplicationReview from "./pages/ApplicationReview";

/* ================= ATTENDANCE (ADMIN) ================= */
import AttendanceAlerts from "./pages/AttendanceAlerts";
import AttendanceAnalytics from "./pages/AttendanceAnalytics";
import AttendanceExport from "./pages/AttendanceExport";
import AttendanceReports from "./pages/AttendanceReports";

/* ================= AUDIT / PROMOTION ================= */
import PromotionManagement from "./pages/PromotionManagement";
import PromotionRollback from "./pages/PromotionRollback";
import AuditTrail from "./pages/AuditTrail";
import AuditTrailPrint from "./pages/AuditTrailPrint";

/* ================= STAFF ================= */
import StaffProfile from "./pages/StaffProfile";
import StaffSubjects from "./pages/StaffSubjects";
import StaffCalendar from "./pages/StaffCalendar";
import StaffMails from "./pages/StaffMails";
import StaffPasswordChange from "./pages/StaffPasswordChange";
import StaffTimetable from "./pages/StaffTimetable";
import MarkAttendance from "./pages/MarkAttendance";

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

/* ================= USER / SHARED ================= */
import UserDigitalLibrary from "./pages/UserDigitalLibrary";

/* ================= ACCOUNTANT ================= */
import AccountantFeesManagement from "./pages/accountant/AccountantFeesManagement";
import AccountantPayments from "./pages/accountant/AccountantPayments";
import AuditLog from "./pages/accountant/AuditLog";
import FeesSetup from "./pages/accountant/FeesSetup";
import FinanceChart from "./pages/accountant/FinanceChart";
import OnlinePaymentPlaceholder from "./pages/accountant/OnlinePaymentPlaceholder";
import PaymentReceipt from "./pages/accountant/PaymentReceipt";

/* ================= LAYOUT / COMPONENTS ================= */
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ConnectionStatus from "./components/ConnectionStatus";
import "./styles/responsive.css";


function App() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app">
      <Header />

      <ConnectionStatus isOnline={isOnline} />

      <main className="main-content">
        <Routes>
          {/* ================= PUBLIC ================= */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/activate-account" element={<ActivateAccount />} />

          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetails />} />
          <Route path="/events" element={<EventsPage />} />

          {/* ================= APPLICATION ================= */}
          <Route path="/apply" element={<Apply />} />
          <Route path="/application-form" element={<ApplicationForm />} />
          <Route path="/application-info" element={<ApplicationInfo />} />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <ApplicationReview />
              </ProtectedRoute>
            }
          />

          {/* ================= DASHBOARDS ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff-dashboard"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accountant-dashboard"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <AccountantDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/student-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <StudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results-management"
            element={
              <ProtectedRoute allowedTypes={["admin", "staff"]}>
                <ResultsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-results-approval"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminResultsApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-reports"
            element={
              <ProtectedRoute allowedTypes={["admin", "staff"]}>
                <ViewReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AcademicManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-permissions-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <UserPermissionsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-messaging"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminMessaging />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-fees-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminFeesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-calendar-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminCalendarManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-syllabus-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminSyllabusManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-timetable-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminTimetableManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-digital-library"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminDigitalLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-certification-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminCertificationManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-home-content"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminHomeContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-alerts"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AttendanceAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-analytics"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AttendanceAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-export"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AttendanceExport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-reports"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AttendanceReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-management"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <PromotionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-rollback"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <PromotionRollback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-trail"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AuditTrail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-trail-print"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AuditTrailPrint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-license"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminLicense />
              </ProtectedRoute>
            }
          />

          {/* ================= STAFF ROUTES ================= */}
          <Route
            path="/staff-profile"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-subjects"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-calendar"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-mails"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffMails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-password-change"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffPasswordChange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-timetable"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <StaffTimetable />
              </ProtectedRoute>
            }
          />

          {/* ✅ ADDED: Staff Digital Library */}
          <Route
            path="/staff-digital-library"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <UserDigitalLibrary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mark-attendance"
            element={
              <ProtectedRoute allowedTypes={["staff"]}>
                <MarkAttendance />
              </ProtectedRoute>
            }
          />

          {/* ================= STUDENT ROUTES ================= */}
          <Route
            path="/student-profile"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-results"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-attendance"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-subjects"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentSubjects />
              </ProtectedRoute>
            }
          />

          {/* ✅ ADDED: Fix wrong link (/student-subject) */}
          <Route path="/student-subject" element={<Navigate to="/student-subjects" replace />} />

          <Route
            path="/student-fees"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-calendar"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-mails"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentMails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-password-change"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentPasswordChange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-timetable"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-syllabus"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentSyllabus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-certification"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentCertification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-certification-registration"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentCertificationRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-term-result"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <StudentTermResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-digital-library"
            element={
              <ProtectedRoute allowedTypes={["student"]}>
                <UserDigitalLibrary />
              </ProtectedRoute>
            }
          />

          {/* ================= ACCOUNTANT ROUTES ================= */}
          <Route
            path="/accountant/fees-management"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <AccountantFeesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/payments"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <AccountantPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/audit-log"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/fees-setup"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <FeesSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/finance-chart"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <FinanceChart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/online-payment"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <OnlinePaymentPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/payment-receipt"
            element={
              <ProtectedRoute allowedTypes={["accountant"]}>
                <PaymentReceipt />
              </ProtectedRoute>
            }
          />

          {/* ================= FALLBACK ================= */}
          <Route
            path="*"
            element={
              <div style={{ padding: 24 }}>
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
