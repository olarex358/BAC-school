import React from "react";
import { Link, useLocation } from "react-router-dom";

const getType = () => {
  try {
    const u = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    return String(u?.type || u?.userType || u?.role || "").toLowerCase();
  } catch {
    return "";
  }
};

export default function AttendanceNav() {
  const { pathname } = useLocation();
  const type = getType();

  const linkStyle = (to) => ({
    padding: "8px 12px",
    borderRadius: 10,
    textDecoration: "none",
    border: "1px solid #ddd",
    background: pathname === to ? "#111" : "#fff",
    color: pathname === to ? "#fff" : "#111",
    fontWeight: 800,
  });

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      {(type.includes("staff") || type.includes("teacher") || type.includes("admin")) && (
        <Link to="/mark-attendance" style={linkStyle("/mark-attendance")}>
          Mark Attendance
        </Link>
      )}

      {type.includes("student") && (
        <Link to="/student-attendance" style={linkStyle("/student-attendance")}>
          My Attendance
        </Link>
      )}

      {(type.includes("staff") || type.includes("teacher") || type.includes("admin")) && (
        <>
          <Link to="/attendance-reports" style={linkStyle("/attendance-reports")}>
            Reports
          </Link>
          <Link to="/attendance-analytics" style={linkStyle("/attendance-analytics")}>
            Analytics
          </Link>
          <Link to="/attendance-export" style={linkStyle("/attendance-export")}>
            Export
          </Link>
          <Link to="/attendance-alerts" style={linkStyle("/attendance-alerts")}>
            Alerts
          </Link>
        </>
      )}
    </div>
  );
}
