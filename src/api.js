const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://school-portal-backend-i29s.onrender.com";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const isAuthRequest =
    path.includes("/auth/login") ||
    path.includes("/activate-account") ||
    path.includes("/setup");

  return fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(!isAuthRequest && token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
}
