import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const normalize = (v) => String(v || "").trim().toLowerCase();

/* ✅ Normalize user type safely */
const normalizeType = (user) => {
  let t =
    normalize(user?.type) ||
    normalize(user?.userType) ||
    normalize(user?.accountType) ||
    normalize(user?.role);

  if (t === "super admin") t = "admin";
  if (t === "teacher") t = "staff";
  if (t === "class teacher") t = "staff";
  if (t === "results manager") t = "staff";
  if (t === "view reports") t = "staff";

  if (["admin", "staff", "student", "accountant"].includes(t)) return t;

  return t;
};

/* ✅ NEW: send users back to THEIR dashboard */
const dashboardFor = (type) => {
  if (type === "admin") return "/dashboard";
  if (type === "staff") return "/staff-dashboard";
  if (type === "student") return "/student-dashboard";
  if (type === "accountant") return "/accountant-dashboard";
  return "/login";
};

const hasPermissions = (user, requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;

  const perms = new Set(
    (Array.isArray(user?.extraPermissions) ? user.extraPermissions : [])
      .map(normalize)
      .filter(Boolean)
  );

  if (normalizeType(user) === "admin") return true;

  return requiredPermissions.every((p) => perms.has(normalize(p)));
};

const ProtectedRoute = ({
  children,
  allowedTypes = [],
  allowedRoles = [],
  requiredPermissions = [],
}) => {
  const { token, user } = useAuth();
  const location = useLocation();

  /* 1️⃣ Not logged in */
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /* 2️⃣ Activation gate */
  const needsActivation =
    user?.needsActivation === true ||
    user?.isActivated === false ||
    user?.activated === false;

  if (needsActivation) {
    return <Navigate to="/activate-account" replace />;
  }

  const userType = normalizeType(user);
  const home = dashboardFor(userType);

  /* 3️⃣ Type check */
  if (allowedTypes.length > 0) {
    const allowed = allowedTypes.map(normalize);
    if (!allowed.includes(userType)) {
      console.warn("⛔ Blocked by type", { userType, allowedTypes });
      return <Navigate to={home} replace />;
    }
  }

  /* 4️⃣ Role check */
  if (allowedRoles.length > 0) {
    const role = String(user?.role || "").trim();
    if (!allowedRoles.includes(role)) {
      console.warn("⛔ Blocked by role", { role, allowedRoles });
      return <Navigate to={home} replace />;
    }
  }

  /* 5️⃣ Permission check */
  if (!hasPermissions(user, requiredPermissions)) {
    console.warn("⛔ Blocked by permissions", {
      requiredPermissions,
      userPermissions: user?.extraPermissions,
    });
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
