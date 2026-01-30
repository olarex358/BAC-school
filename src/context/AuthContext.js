import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

/* normalize user type once */
const normalizeType = (user) => {
  const raw =
    user?.type ||
    user?.userType ||
    user?.accountType ||
    user?.role ||
    "";

  const t = String(raw).toLowerCase();

  if (t.includes("student")) return "student";
  if (t.includes("staff") || t.includes("teacher")) return "staff";
  if (t.includes("accountant")) return "accountant";
  if (t.includes("admin")) return "admin";

  return t;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("authToken")
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("authUser");
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthed = !!token;

  /* 🔁 keep storage in sync */
  useEffect(() => {
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");

    if (user) {
      localStorage.setItem("authUser", JSON.stringify(user));

      /* ✅ LEGACY SUPPORT (critical fix) */
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          ...user,
          type: normalizeType(user),
        })
      );
    } else {
      localStorage.removeItem("authUser");
      localStorage.removeItem("loggedInUser");
    }
  }, [token, user]);

  const login = (newToken, newUser) => {
    console.log("🔐 AuthContext login()", newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
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
