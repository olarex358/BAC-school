import { useEffect, useState } from "react";
import offlineApi from "../services/offlineApi";
import AdmissionLetter from "../components/AdmissionLetter";
import "../styles/application-review.css";

const APP_STORE = "schoolPortalApplications";
const STUDENT_STORE = "schoolPortalStudents";

/* ===== Admission Number Generator ===== */
const generateAdmissionNumber = () => {
  const counter = Number(localStorage.getItem("admissionCounter")) || 0;
  const next = counter + 1;
  localStorage.setItem("admissionCounter", next);

  const year = new Date().getFullYear();
  return `BAC/${year}/${String(next).padStart(5, "0")}`;
};

/* ===== Lock Rule ===== */
const isLocked = (app) =>
  app.status === "Rejected" || app.converted === true;

export default function ApplicationReview() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bulkPrint, setBulkPrint] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const data = await offlineApi.get(APP_STORE);
    setApplications(data || []);
  };

  /* ===== NOTIFY PARENT (WHATSAPP) ===== */
  const notifyParent = (app, type = "approved") => {
    if (!app.phone) return alert("Parent phone number missing");

    const message =
      type === "approved"
        ? `Dear ${app.parentName}, your child ${app.surname} ${app.firstName} has been offered admission. Admission No: ${app.admissionNumber}.`
        : `Dear ${app.parentName}, we regret to inform you that the application was not successful.`;

    window.open(
      `https://wa.me/234${app.phone.replace(/^0/, "")}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  /* ===== APPROVE ===== */
  const approveApplication = async (app) => {
    if (isLocked(app)) return alert("This application is locked.");

    const admissionNumber = generateAdmissionNumber();

    await offlineApi.update(APP_STORE, app.id, {
      status: "Approved",
      admissionNumber,
      approvedAt: Date.now(),
    });

    loadApplications();
    setSelected(null);
  };

  /* ===== REJECT ===== */
  const rejectApplication = async (app) => {
    if (isLocked(app)) return alert("This application is locked.");

    await offlineApi.update(APP_STORE, app.id, {
      status: "Rejected",
      rejectedAt: Date.now(),
    });

    loadApplications();
    setSelected(null);
  };

  /* ===== CONVERT TO STUDENT ===== */
  const convertToStudent = async (app) => {
    if (!app.admissionNumber)
      return alert("Approve application first.");

    if (app.converted)
      return alert("Already converted.");

    await offlineApi.create(STUDENT_STORE, {
      name: `${app.surname} ${app.firstName} ${app.otherName || ""}`.trim(),
      admissionNo: app.admissionNumber,
      gender: app.sex,
      dateOfBirth: app.dob,
      classLevel: app.lastClass || "JSS 1",
      address: app.address,
      guardianName: app.parentName,
      guardianPhone: app.phone,
      photo: app.passport || "",
      status: "Active",
      createdAt: Date.now(),
    });

    await offlineApi.update(APP_STORE, app.id, {
      converted: true,
      convertedAt: Date.now(),
    });

    loadApplications();
    setSelected(null);
  };

  /* ===== BULK PRINT ===== */
  const handleBulkPrint = () => {
    const approved = applications.filter(
      (a) => a.status === "Approved"
    );

    if (!approved.length)
      return alert("No approved applications");

    setBulkPrint(true);
    setSelected({ bulk: approved });

    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="admin-page">
      <h2>Admission Applications</h2>

      <button onClick={handleBulkPrint}>
        Bulk Print Admission Letters
      </button>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Applicant</th>
            <th>Class</th>
            <th>Status</th>
            <th>Admission No</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((a, i) => (
            <tr key={a.id}>
              <td>{i + 1}</td>
              <td>{a.surname} {a.firstName}</td>
              <td>{a.lastClass || "—"}</td>
              <td>
                <span className={`status ${a.status?.toLowerCase()}`}>
                  {a.status}
                </span>
              </td>
              <td>{a.admissionNumber || "—"}</td>
              <td>
                <button onClick={() => setSelected(a)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== BULK PRINT VIEW ===== */}
      {bulkPrint && selected?.bulk && (
        <div className="printable">
          {selected.bulk.map((app) => (
            <AdmissionLetter key={app.id} app={app} />
          ))}
        </div>
      )}

      {/* ===== SINGLE APPLICATION MODAL ===== */}
      {selected && !bulkPrint && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-content printable"
            onClick={(e) => e.stopPropagation()}
          >
            {/* WATERMARK */}
            <div className="watermark">
              <img src="/logo.png" alt="School Logo" />
            </div>

            <h3>Application Details</h3>

            <p><strong>Name:</strong> {selected.surname} {selected.firstName}</p>
            <p><strong>Gender:</strong> {selected.sex}</p>
            <p><strong>DOB:</strong> {selected.dob}</p>
            <p><strong>Address:</strong> {selected.address}</p>

            <hr />

            <p><strong>Last Class:</strong> {selected.lastClass}</p>
            <p><strong>Activities:</strong> {selected.activities}</p>

            <hr />

            <p><strong>Parent:</strong> {selected.parentName}</p>
            <p><strong>Phone:</strong> {selected.phone}</p>

            {selected.admissionNumber && (
              <p className="admission-no">
                <strong>Admission No:</strong> {selected.admissionNumber}
              </p>
            )}

            {selected.converted && (
              <p className="locked-badge">🔒 Converted to Student</p>
            )}

            <div className="modal-actions no-print">
              {selected.status === "Approved" && (
                <button onClick={() => notifyParent(selected)}>
                  Notify Parent (WhatsApp)
                </button>
              )}

              {!isLocked(selected) && selected.status !== "Approved" && (
                <button className="approve" onClick={() => approveApplication(selected)}>
                  Approve
                </button>
              )}

              {!isLocked(selected) && selected.status !== "Rejected" && (
                <button className="reject" onClick={() => rejectApplication(selected)}>
                  Reject
                </button>
              )}

              {selected.status === "Approved" && !selected.converted && (
                <button className="convert" onClick={() => convertToStudent(selected)}>
                  Convert to Student
                </button>
              )}

              <button onClick={() => window.print()}>
                Print
              </button>
            </div>

            {selected.status === "Approved" && (
              <AdmissionLetter app={selected} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
