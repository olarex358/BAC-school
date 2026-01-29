// src/components/OfflineBanner.js
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        backgroundColor: "#b30000",
        color: "#fff",
        padding: "8px",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "14px",
      }}
    >
      ⚠ You are offline. Changes will sync automatically when online.
    </div>
  );
}
