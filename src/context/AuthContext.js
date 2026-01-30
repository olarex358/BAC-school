import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

/* ✅ Normalize user type across the whole app */
const normalizeType = (user) => {
  const raw =
    user?.type ||
    user?.userType ||
    user?.accountType ||
    user?.role ||
    "";

  const t = String(raw).trim().toLowerCase();

  if (t.includes("student")) return "student";
  if (t.includes("staff") || t.includes("teacher")) return "staff";
  if (t.includes("accountant")) return "accountant";
  if (t.includes("admin") || t.includes("super")) return "admin";

  // fallback (still return something stable)
  return t || "student";
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthed = !!token;

  /* ✅ keep storage in sync (including legacy pages) */
  useEffect(() => {
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");

    if (user) {
      const fixedUser = { ...user, type: normalizeType(user) };

      // new system
      localStorage.setItem("authUser", JSON.stringify(fixedUser));

      // legacy system (many pages still depend on this)
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          ...fixedUser,
          type: fixedUser.type,
        })
      );
    } else {
      localStorage.removeItem("authUser");
      localStorage.removeItem("loggedInUser");
    }
  }, [token, user]);

  /* ✅ IMPORTANT: ensure type is always set on login */
  const login = (newToken, newUser) => {
    console.log("🔐 AuthContext login()", newUser);
    const fixedUser = { ...newUser, type: normalizeType(newUser) };

    setToken(newToken);
    setUser(fixedUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    // hard cleanup
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("loggedInUser");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthed,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
