// src/api.js
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://school-portal-backend-i29s.onrender.com";

/**
 * apiFetch()
 * - Attaches Authorization: Bearer <authToken>
 * - Matches backend middleware: req.headers.authorization?.split(" ")[1]
 * - Uses Render base URL by default
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("authToken"); // ✅ FIXED KEY

  // Endpoints that do NOT require auth header
  const isPublic =
    path === "/api/login" ||
    path.startsWith("/api/setup") ||
    path.startsWith("/api/activate-account");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach token for protected routes only
  if (!isPublic && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Support full URLs too (safety)
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
