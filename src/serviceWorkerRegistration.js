// src/serviceWorkerRegistration.js

export function register() {
  if (process.env.NODE_ENV !== "production") {
    console.log("SW disabled in development");
    return;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("SW registered (production)"))
        .catch((err) => console.error("SW registration failed:", err));
    });
  }
}
