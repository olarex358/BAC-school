import { useState, useEffect } from "react";
import offlineApi from "../services/offlineApi";
import "../styles/application.css";

const STORE = "schoolPortalApplications";

export default function ApplicationForm({ pin, demo = false }) {

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
  setSubmitted(false);

  const submittedPins =
    JSON.parse(localStorage.getItem("submittedPins")) || [];

  if (submittedPins.includes(pin)) {
    setSubmitted(true);
  }
}, [pin]);

  const [data, setData] = useState({
    surname: "", firstName: "", otherName: "",
    dob: "", sex: "", state: "", lga: "", address: "",
    lastPrimary: "", lastSecondary: "", lastClass: "",
    postHeld: "", activities: "",
    parentName: "", occupation: "", officeAddress: "",
    phone: "", email: "",
    genotype: "", bloodGroup: "",
    passport: "", birthCert: "", result: "", medical: ""
  });

  const handle = e =>
    setData({ ...data, [e.target.name]: e.target.value });

  const fileToBase64 = (file, field) => {
    const r = new FileReader();
    r.onload = () => setData(d => ({ ...d, [field]: r.result }));
    r.readAsDataURL(file);
  };

  const submit = async e => {
    e.preventDefault();

    await offlineApi.post(STORE, {
  pin,
  ...data,
  status: "Pending",
  submittedAt: Date.now()
});

    const submittedPins =
      JSON.parse(localStorage.getItem("submittedPins")) || [];

    localStorage.setItem(
      "submittedPins",
      JSON.stringify([...submittedPins, pin])
    );

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="submission-lock">
        <h3>Application Submitted Successfully ✅</h3>
        <p>
          Your application has been received and is under review.
          Please wait for further communication from the school.
        </p>
      </div>
    );
  }

  return (
    <form className="application-form" onSubmit={submit}>
      {/* FORM CONTENT REMAINS THE SAME */}
      <button type="submit" className="form-submit-btn">
        Submit Application
      </button>
    </form>
  );
}
