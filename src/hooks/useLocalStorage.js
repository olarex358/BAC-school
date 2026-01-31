import { useState, useEffect } from "react";
import { apiFetch } from "../api";

/**
 * v0.1 SAFE useLocalStorage
 *
 * - LocalStorage is the source of truth for UI
 * - Server is READ-ONLY sync (never overwrite blindly)
 * - All WRITES must go through apiFetch / offlineApi explicitly
 */
function useLocalStorage(key, initialValue, apiUrl = null) {
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readValue);
  const [loading, setLoading] = useState(!!apiUrl);

  /* =========================
     READ from server (safe)
  ========================= */
  useEffect(() => {
    if (!apiUrl) return;
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchFromServer = async () => {
      try {
        const res = await apiFetch(apiUrl);
        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();

        // Only accept valid data
        if (
          (Array.isArray(data) && data.length > 0) ||
          (typeof data === "object" && data !== null)
        ) {
          if (!cancelled) {
            window.localStorage.setItem(key, JSON.stringify(data));
            setStoredValue(data);
          }
        }
      } catch {
        // ❌ NEVER wipe local data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFromServer();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, key]);

  /* =========================
     LOCAL WRITE ONLY
  ========================= */
  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // silent
    }
  };

  /* =========================
     Cross-tab sync
  ========================= */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [storedValue, setValue, loading];
}

export default useLocalStorage;
