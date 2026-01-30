import { useEffect, useMemo, useRef, useState } from "react";
import offlineApi from "../services/offlineApi";

const STORE = "schoolPortalStudents";
const ADMISSION_PREFIX = "BC/STD";

// CSV headers supported (case-insensitive):
// admissionNo | admission_number | admNo
// fullName | name | studentName
// gender | sex
// dateOfBirth | dob
// classLevel | class | studentClass
// parentPhone | guardianPhone | phone
// guardianName | parentName
// address
// status

const normalizeKey = (k) =>
  String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");

function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out.map((v) => v.replace(/^"|"$/g, "").trim());
}

function parseCSV(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = splitCSVLine(lines[0]).map(normalizeKey);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.every((c) => !String(c || "").trim())) continue;

    const obj = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    rows.push(obj);
  }

  return { headers, rows };
}

function mapRowToStudent(row) {
  const g = (key) => row[normalizeKey(key)] ?? "";

  const admissionNo =
    g("admissionNo") || g("admission_number") || g("admNo") || "";
  const fullName = g("fullName") || g("name") || g("studentName") || "";
  const gender = g("gender") || g("sex") || "";
  const dateOfBirth = g("dateOfBirth") || g("dob") || "";
  const classLevel = g("classLevel") || g("class") || g("studentClass") || "";
  const parentPhone =
    g("parentPhone") || g("guardianPhone") || g("phone") || "";
  const guardianName = g("guardianName") || g("parentName") || "";
  const address = g("address") || "";
  const status = g("status") || "Active";

  const name = String(fullName).trim();

  return {
    name,
    admissionNo: String(admissionNo).trim(),
    gender: String(gender).trim(),
    dateOfBirth: String(dateOfBirth).trim(),
    classLevel: String(classLevel).trim(),
    guardianPhone: String(parentPhone).trim(),
    guardianName: String(guardianName).trim(),
    address: String(address).trim(),
    status: String(status).trim() || "Active",
    photo: "",
  };
}

/* ✅ FIX: Keep inputs always controlled */
const safeForm = (s = {}) => ({
  name: s.name ?? "",
  admissionNo: s.admissionNo ?? "",
  classLevel: s.classLevel ?? "",
  gender: s.gender ?? "",
  dateOfBirth: s.dateOfBirth ?? "",
  guardianName: s.guardianName ?? "",
  guardianPhone: s.guardianPhone ?? "",
  address: s.address ?? "",
  status: s.status ?? "Active",
  photo: s.photo ?? "",
});

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isOldStudent, setIsOldStudent] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // ✅ Batch import (live converter)
  const fileRef = useRef(null);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState(safeForm());

  /* ================= LOAD ================= */
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const data = await offlineApi.get(STORE);
    setStudents(data || []);
  };

  /* ================= ADMISSION NUMBER ================= */
  const generateAdmissionNumber = () => {
    const year = new Date().getFullYear();

    const used = students
      .map((s) => s.admissionNo)
      .filter((n) => n && n.startsWith(`${ADMISSION_PREFIX}/${year}`))
      .map((n) => parseInt(n.split("/").pop(), 10))
      .filter((n) => !isNaN(n));

    const next = used.length ? Math.max(...used) + 1 : 1;
    return `${ADMISSION_PREFIX}/${year}/${String(next).padStart(4, "0")}`;
  };

  useEffect(() => {
    if (!isOldStudent && !editingId) {
      setFormData((prev) => ({
        ...safeForm(prev),
        admissionNo: generateAdmissionNumber(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, isOldStudent, editingId]);

  /* ================= FORM ================= */
  const handleChange = (e) =>
    setFormData((prev) => ({
      ...safeForm(prev),
      [e.target.name]: e.target.value ?? "",
    }));

  const handlePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setFormData((prev) => ({ ...safeForm(prev), photo: reader.result ?? "" }));
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsOldStudent(false);
    setFormData(safeForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.admissionNo) {
      alert("Admission number is required");
      return;
    }

    if (editingId) {
      await offlineApi.update(STORE, editingId, safeForm(formData));
    } else {
      await offlineApi.create(STORE, {
        ...safeForm(formData),
        createdAt: Date.now(),
      });
    }

    resetForm();
    loadStudents();
  };

  const handleEdit = (student) => {
    setEditingId(student.id || student._id);
    setIsOldStudent(true);
    setFormData(safeForm(student)); // ✅ FIX HERE
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await offlineApi.remove(STORE, id);
    loadStudents();
  };

  /* ================= BATCH IMPORT (LIVE) ================= */
  const admissionSet = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const a = String(s.admissionNo || "").trim().toLowerCase();
      if (a) set.add(a);
    });
    return set;
  }, [students]);

  const validateBatch = (mapped) => {
    const errs = [];
    const seen = new Set();

    mapped.forEach((st, idx) => {
      const e = [];

      if (!st.admissionNo) e.push("Missing admissionNo");
      if (!st.name) e.push("Missing name/fullName");
      if (!st.classLevel) e.push("Missing classLevel/studentClass");

      const key = String(st.admissionNo || "").trim().toLowerCase();
      if (key) {
        if (seen.has(key)) e.push("Duplicate admissionNo in CSV");
        seen.add(key);
        if (admissionSet.has(key)) e.push("Already exists in system");
      }

      if (
        st.guardianPhone &&
        String(st.guardianPhone).replace(/\s+/g, "").length < 8
      )
        e.push("Phone looks short");

      if (e.length) errs.push({ row: idx + 2, errors: e });
    });

    return errs;
  };

  const buildPreviewFromText = (text) => {
    const { rows } = parseCSV(text);
    const mapped = rows
      .map(mapRowToStudent)
      .map((s) => safeForm(s))
      .filter((s) => s.admissionNo || s.name);

    const errs = validateBatch(mapped);

    setCsvPreview(mapped);
    setCsvErrors(errs);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const text = String(target.result || "");
      setCsvText(text);
      buildPreviewFromText(text);
    };
    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    if (!csvPreview.length) return alert("No valid CSV rows found.");
    if (csvErrors.length) return alert("Fix CSV errors first.");

    setImporting(true);
    try {
      for (const st of csvPreview) {
        await offlineApi.create(STORE, { ...safeForm(st), createdAt: Date.now() });
      }

      alert(`${csvPreview.length} students imported`);
      setCsvPreview([]);
      setCsvErrors([]);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      loadStudents();
    } finally {
      setImporting(false);
    }
  };

  const clearBatch = () => {
    setCsvPreview([]);
    setCsvErrors([]);
    setCsvText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ================= FILTER ================= */
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      s.name?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.classLevel?.toLowerCase().includes(q) ||
      s.guardianPhone?.toLowerCase().includes(q);

    const matchStatus = filterStatus === "All" || s.status === filterStatus;

    return matchSearch && matchStatus;
  });

  /* ================= UI ================= */
  return (
    <div className="student-page">
      <h2>Student Management</h2>

      {/* ===== FORM ===== */}
      <form onSubmit={handleSubmit} className="standard-form">
        <label>
          <input
            type="checkbox"
            checked={isOldStudent}
            onChange={() => setIsOldStudent(!isOldStudent)}
          />{" "}
          Old Student
        </label>

        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          name="admissionNo"
          placeholder="Admission Number"
          value={formData.admissionNo}
          onChange={handleChange}
          readOnly={!isOldStudent}
          required
        />

        <input
          name="classLevel"
          placeholder="Class (e.g SS2A)"
          value={formData.classLevel}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
        />

        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input
          name="guardianName"
          placeholder="Guardian Name"
          value={formData.guardianName}
          onChange={handleChange}
        />

        <input
          name="guardianPhone"
          placeholder="Guardian Phone"
          value={formData.guardianPhone}
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Home Address"
          value={formData.address}
          onChange={handleChange}
        />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />

        <button>{editingId ? "Update Student" : "Add Student"}</button>
      </form>

      {/* ===== BATCH IMPORT (LIVE CSV CONVERTER) ===== */}
      <hr />
      <h3>Batch Import Old Students</h3>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} />

      <p style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
        Paste CSV below (or upload). Supported headers:{" "}
        <b>admissionNo, fullName, gender, dateOfBirth, classLevel, parentPhone</b>
      </p>

      <textarea
        value={csvText}
        onChange={(e) => {
          const v = e.target.value;
          setCsvText(v);
          buildPreviewFromText(v);
        }}
        placeholder={`admissionNo,fullName,gender,dateOfBirth,classLevel,parentPhone
BC/STD/2025/0001,John Daniel,M,10-11-2014,JSS1A,0806xxxxxxx`}
        style={{
          width: "100%",
          minHeight: 150,
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginTop: 6,
        }}
      />

      {csvErrors.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#fff7e6",
            border: "1px solid #ffe2a8",
            borderRadius: 8,
          }}
        >
          <b>CSV Issues:</b>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {csvErrors.slice(0, 8).map((e) => (
              <li key={e.row}>
                Row {e.row}: {e.errors.join(", ")}
              </li>
            ))}
          </ul>
          {csvErrors.length > 8 && <div>...and {csvErrors.length - 8} more</div>}
        </div>
      )}

      {csvPreview.length > 0 && (
        <>
          <p style={{ marginTop: 10 }}>
            <b>{csvPreview.length}</b> students ready to import
          </p>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Admission</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(0, 50).map((s, i) => (
                  <tr key={`${s.admissionNo}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{s.admissionNo}</td>
                    <td>{s.name}</td>
                    <td>{s.classLevel}</td>
                    <td>{s.gender}</td>
                    <td>{s.guardianPhone}</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvPreview.length > 50 && <p>Showing first 50 rows…</p>}

          <button
            onClick={handleBatchImport}
            disabled={importing || csvErrors.length > 0}
          >
            {importing ? "Importing..." : "Import Students"}
          </button>

          <button onClick={clearBatch} style={{ marginLeft: 8 }}>
            Clear Preview
          </button>
        </>
      )}

      {/* ===== SEARCH + FILTER ===== */}
      <hr />
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search name / admission / class / phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button onClick={loadStudents} type="button">
          Refresh
        </button>
      </div>

      {/* ===== LIST ===== */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Admission</th>
            <th>Class</th>
            <th>Gender</th>
            <th>Guardian Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredStudents.map((s, i) => (
            <tr key={s.id || s._id || `${s.admissionNo}-${i}`}>
              <td>{i + 1}</td>

              <td>
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt="student"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "-"
                )}
              </td>

              <td>{s.name}</td>
              <td>{s.admissionNo}</td>
              <td>{s.classLevel}</td>
              <td>{s.gender}</td>
              <td>{s.guardianPhone || "-"}</td>
              <td>{s.status}</td>

              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id || s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
