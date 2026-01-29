const API_BASE =
  process.env.REACT_APP_API_URL || "https://school-portal-backend-i29s.onrender.com";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("authToken");

  const isPublic =
    path === "/api/login" ||
    path.startsWith("/api/setup") ||
    path === "/api/activate-account"; // activation is public in backend

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!isPublic && token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
