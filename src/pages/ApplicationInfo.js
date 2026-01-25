import { useState } from "react";
import ApplicationForm from "./ApplicationForm";
import "./ApplicationInfo.css";

export default function ApplicationInfo() {
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState("idle"); // idle | valid | invalid
  const [checking, setChecking] = useState(false);
const DEMO_MODE = true;

  const validatePin = async () => {
    setChecking(true);

    // 🔒 TEMP PIN CHECK (replace with IndexedDB later)
    setTimeout(() => {
      if (pin.trim().length >= 6) {
        setPinStatus("valid");
      } else {
        setPinStatus("invalid");
      }
      setChecking(false);
    }, 700);
  };

  return (
    <div className="info-page">
      <h2>Admission Application</h2>

      {/* ===== APPLICATION INFORMATION ===== */}
      <section className="info-section">
        <p><strong>Application Fee:</strong> ₦7,500 (Non-Refundable)</p>
        <p><strong>Academic Session:</strong> 2025 / 2026</p>

        <h3>Application Steps</h3>
        <ol>
          <li>Enter a valid Application PIN</li>
          <li>Complete the admission form</li>
          <li>Upload all required documents</li>
          <li>Submit and await review</li>
        </ol>

        <h3>Required Documents</h3>
        <ul>
          <li>Passport Photograph</li>
          <li>Birth Certificate</li>
          <li>Last School Result</li>
          <li>Medical Report</li>
        </ul>

        <h3>Important Notes</h3>
        <ul>
          <li>One PIN can only be used once</li>
          <li>False information leads to disqualification</li>
          <li>Submitted forms cannot be edited</li>
        </ul>
      </section>

      {/* ===== PIN VALIDATION ===== */}
      {pinStatus !== "valid" && (
        <section className="pin-section">
          <h3>Application PIN</h3>

          <div className="pin-row">
            <input
              type="text"
              placeholder="Enter Application PIN"
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                setPinStatus("idle");
              }}
            />
            <button onClick={validatePin} disabled={checking}>
              {checking ? "Checking..." : "Validate PIN"}
            </button>
          </div>

          {pinStatus === "invalid" && (
            <p className="error-text">Invalid or already used PIN</p>
          )}

          <p className="pin-note">
            Online PIN purchase will be available soon.
          </p>
        </section>
      )}

      {/* ===== APPLICATION FORM ===== */}
{(pinStatus === "valid" || DEMO_MODE) && (
  <ApplicationForm key={pin || "demo"} pin={pin || "DEMO-PIN"} />
)}

    </div>
  );
}
