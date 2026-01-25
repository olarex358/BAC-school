import "../styles/admission-letter.css";

export default function AdmissionLetter({ app }) {
  if (!app?.admissionNumber) return null;

  return (
    <div className="admission-letter printable">
      {/* Watermark */}
      <div className="watermark">
        <img src="/logo.png" alt="School Logo" />
      </div>

      {/* Header */}
      <header className="letter-header">
        <img src="/logo.png" alt="School Logo" className="logo" />
        <div>
          <h2>Busari-alao College</h2>
          <p>Admission Office</p>
        </div>
      </header>

      <hr />

      <p className="date">
        Date: {new Date().toLocaleDateString()}
      </p>

      <h3 className="title">OFFER OF PROVISIONAL ADMISSION</h3>

      <p>
        Dear <strong>{app.surname} {app.firstName} {app.otherName || ""}</strong>,
      </p>

      <p>
        We are pleased to inform you that you have been offered provisional
        admission into <strong>Busari-alao College</strong>.
      </p>

      <p>
        <strong>Admission Number:</strong> {app.admissionNumber}<br />
        <strong>Class Admitted To:</strong> {app.lastClass || "JSS 1"}
      </p>

      <p>
        This offer is subject to verification of documents and compliance
        with school rules and regulations.
      </p>

      <p>
        Please report to the school with this letter and required documents
        on resumption.
      </p>

      <p className="signature">
        ___________________________<br />
        Principal
      </p>
    </div>
  );
}
