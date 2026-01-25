import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// Get root element
const container = document.getElementById("root");

if (!container) {
  console.error("❌ Root container not found");
} else {
  const root = ReactDOM.createRoot(container);

  root.render(
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
}
