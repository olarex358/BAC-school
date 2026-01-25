const API_BASE = "/api";

const api = {
  get: (url) =>
    fetch(API_BASE + url).then(res => res.json()),

  post: (url, data) =>
    fetch(API_BASE + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  put: (url, data) =>
    fetch(API_BASE + url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  delete: (url) =>
    fetch(API_BASE + url, { method: "DELETE" }),
};

export default api;
