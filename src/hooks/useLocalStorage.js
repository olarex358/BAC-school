import { useState, useEffect, useRef } from "react";

/**
 * useLocalStorage(key, initialValue, apiUrl?)
 * - Works offline using localStorage
 * - If apiUrl is provided and online:
 *   - Fetches from server on load
 *   - Pushes updates to server when you setValue()
 */
function useLocalStorage(key, initialValue, apiUrl = null) {
  const isFirstLoad = useRef(true);

  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readValue);

  // ✅ fetch latest from server (when online)
  useEffect(() => {
    const fetchFromServer = async () => {
      if (!apiUrl) return;
      if (!navigator.onLine) return;

      try {
        const res = await fetch(apiUrl);
        if (!res.ok) return;

        const data = await res.json();
        if (Array.isArray(data) || typeof data === "object") {
          window.localStorage.setItem(key, JSON.stringify(data));
          setStoredValue(data);
        }
      } catch (err) {
        // keep silent: offline-first
        console.warn(`Server fetch failed for "${key}"`, err);
      }
    };

    fetchFromServer();
  }, [apiUrl, key]);

  // ✅ setValue: always update local, then try to sync online
  const setValue = async (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // sync to server if possible
      if (apiUrl && navigator.onLine) {
        // If value is array => replace on server (simple approach)
        // If server expects something else, we can customize later
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valueToStore),
        }).catch(() => {});
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // ✅ Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  // ✅ one-time protection: don’t overwrite server on first mount
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, []);

  return [storedValue, setValue];
}

export default useLocalStorage;
