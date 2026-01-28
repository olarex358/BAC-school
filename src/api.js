// src/api.js
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://school-portal-backend-i29s.onrender.com";

/**
 * apiFetch()
 * - Attaches Authorization: Bearer <authToken>
 * - Uses Render base URL by default
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("authToken");

  // ONLY these are truly public (no token):
  const isPublic =
    path === "/api/login" ||
    path.startsWith("/api/setup"); // setup + setup/status

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // ✅ Attach token for everything else (including /api/activate-account)
  if (!isPublic && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
