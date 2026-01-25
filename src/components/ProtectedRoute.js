import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedTypes = [] }) => {
  const { token, user } = useAuth();

  /* =========================
     1️⃣ Not logged in
  ========================= */
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  /* =========================
     2️⃣ Force account activation
  ========================= */
  if (user.needsActivation) {
    return <Navigate to="/activate-account" replace />;
  }

  /* =========================
     3️⃣ Normalize user role/type
  ========================= */
  let userType =
    user.type?.toLowerCase() ||
    user.role?.toLowerCase() ||
    "";

  // Normalize known variants
  if (userType === "super admin") userType = "admin";
  if (userType === "class teacher") userType = "staff";

  /* =========================
     4️⃣ Role access check
     (ADMIN OVERRIDE FIX)
  ========================= */
  if (allowedTypes.length > 0) {
    // ✅ Admin override: admin can access all admin routes
    if (userType === "admin" && allowedTypes.includes("admin")) {
      return children;
    }

    if (!allowedTypes.includes(userType)) {
      console.warn(
        "⛔ ProtectedRoute blocked access:",
        { userType, allowedTypes }
      );
      return <Navigate to="/" replace />;
    }
  }

  /* =========================
     5️⃣ Access granted
  ========================= */
  return children;
};

export default ProtectedRoute;
