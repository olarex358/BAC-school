import { useState } from "react";
import ApplicationForm from "./ApplicationForm";
import "../styles/apply.css";


export default function Apply() {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);

  const verifyPin = () => {
    const pins = JSON.parse(localStorage.getItem("applicationPins")) || [];
    if (pins.includes(pin)) {
      setVerified(true);
    } else {
      alert("Invalid or used Application PIN");
    }
  };

  return verified ? (
    <ApplicationForm pin={pin} />
  ) : (
    <div className="pin-gate">
      <h2>Application Access</h2>
      <p>Enter your Application PIN</p>
      <input value={pin} onChange={e => setPin(e.target.value)} />
      <button onClick={verifyPin}>Proceed</button>
    </div>
  );
}
