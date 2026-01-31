// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  // ✅ Use same base as apiFetch
  const socketUrl = useMemo(() => {
    // If you deploy backend on Render, set REACT_APP_API_URL in frontend env
    // Example: https://school-portal-backend-i29s.onrender.com
    return process.env.REACT_APP_API_URL || "";
  }, []);

  useEffect(() => {
    // ✅ v0.1: sockets are optional. If no URL, skip silently.
    if (!socketUrl) return;

    // ✅ avoid connecting while offline
    if (!navigator.onLine) return;

    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      "";

    const s = io(socketUrl, {
      transports: ["websocket"],
      auth: token ? { token } : undefined, // backend can read socket.handshake.auth.token
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    return () => {
      try {
        s.disconnect();
      } catch {}
      setSocket(null);
    };
  }, [socketUrl]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
