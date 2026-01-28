import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const normalize = (v) => String(v || "").trim().toLowerCase();

const normalizeType = (user) => {
  let t = normalize(user?.type) || normalize(user?.role);

  // Normalize common variants
  if (t === "super admin") t = "admin";
  if (t === "admin") t = "admin";
  if (t === "class teacher") t = "staff";
  if (t === "teacher") t = "staff";
  if (t === "student") t = "student";
  if (t === "accountant") t = "accountant";

  return t;
};

const hasPermissions = (user, requiredPermissions = []) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  const perms = new Set(
    (Array.isArray(user?.extraPermissions) ? user.extraPermissions : [])
      .map(normalize)
      .filter(Boolean)
  );

  // Admin override: if you want admin to bypass permissions, keep this true.
  // If you want strict permission-based admin, remove this block.
  const type = normalizeType(user);
  if (type === "admin") return true;

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

  // 1) Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 2) Activation gate (handles both patterns safely)
  const needsActivation =
    user?.needsActivation === true ||
    user?.isActivated === false ||
    user?.activated === false;

  if (needsActivation) {
    return <Navigate to="/activate-account" replace />;
  }

  // 3) Type check
  const userType = normalizeType(user);

  if (allowedTypes.length > 0) {
    const allowed = allowedTypes.map(normalize);
    if (!allowed.includes(userType)) {
      console.warn("⛔ ProtectedRoute blocked by type:", { userType, allowedTypes });
      return <Navigate to="/" replace />;
    }
  }

  // 4) Role check (optional)
  if (allowedRoles.length > 0) {
    const role = String(user?.role || "").trim();
    if (!allowedRoles.includes(role)) {
      console.warn("⛔ ProtectedRoute blocked by role:", { role, allowedRoles });
      return <Navigate to="/" replace />;
    }
  }

  // 5) Permission check (new)
  if (!hasPermissions(user, requiredPermissions)) {
    console.warn("⛔ ProtectedRoute blocked by permissions:", {
      requiredPermissions,
      userPermissions: user?.extraPermissions,
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
