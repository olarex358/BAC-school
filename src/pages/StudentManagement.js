import { useEffect, useState } from "react";
import offlineApi from "../services/offlineApi";

const STORE = "schoolPortalStudents";
const ADMISSION_PREFIX = "BC/STD";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isOldStudent, setIsOldStudent] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Batch import
  const [csvPreview, setCsvPreview] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    admissionNo: "",
    classLevel: "",
    gender: "",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    status: "Active",
    photo: "",
  });

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
        ...prev,
        admissionNo: generateAdmissionNumber(),
      }));
    }
  }, [students, isOldStudent, editingId]);

  /* ================= FORM ================= */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhoto = (file) => {
    const reader = new FileReader();
    reader.onload = () =>
      setFormData((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setIsOldStudent(false);
    setFormData({
      name: "",
      admissionNo: "",
      classLevel: "",
      gender: "",
      dateOfBirth: "",
      guardianName: "",
      guardianPhone: "",
      address: "",
      status: "Active",
      photo: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.admissionNo) {
      alert("Admission number is required");
      return;
    }

    if (editingId) {
      await offlineApi.update(STORE, editingId, formData);
    } else {
      await offlineApi.create(STORE, {
        ...formData,
        createdAt: Date.now(),
      });
    }

    resetForm();
    loadStudents();
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setIsOldStudent(true);
    setFormData({ ...student });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await offlineApi.remove(STORE, id);
    loadStudents();
  };

  /* ================= BATCH IMPORT ================= */
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const rows = target.result.split("\n").slice(1);
      const parsed = [];

      rows.forEach((row) => {
        if (!row.trim()) return;

        const [
          admissionNo,
          fullName,
          gender,
          dateOfBirth,
          classLevel,
          parentPhone,
        ] = row.split(",");

        if (!admissionNo || !fullName || !classLevel) return;

        if (students.some((s) => s.admissionNo === admissionNo.trim())) return;

        const parts = fullName.trim().split(" ");
        const first = parts.shift();
        const last = parts.join(" ");

        parsed.push({
          name: `${first} ${last}`,
          admissionNo: admissionNo.trim(),
          gender: gender?.trim() || "",
          dateOfBirth: dateOfBirth?.trim() || "",
          classLevel: classLevel.trim(),
          guardianPhone: parentPhone?.trim() || "",
          guardianName: "",
          address: "",
          status: "Active",
          photo: "",
        });
      });

      setCsvPreview(parsed);
    };

    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    for (const student of csvPreview) {
      await offlineApi.create(STORE, student);
    }

    alert(`${csvPreview.length} students imported`);
    setCsvPreview([]);
    loadStudents();
  };

  /* ================= FILTER ================= */
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === "All" || s.status === filterStatus;

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

        <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
        <input name="admissionNo" placeholder="Admission Number" value={formData.admissionNo} onChange={handleChange} readOnly={!isOldStudent} required />
        <input name="classLevel" placeholder="Class (e.g SS2A)" value={formData.classLevel} onChange={handleChange} required />
        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />

        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input name="guardianName" placeholder="Guardian Name" value={formData.guardianName} onChange={handleChange} />
        <input name="guardianPhone" placeholder="Guardian Phone" value={formData.guardianPhone} onChange={handleChange} />
        <textarea name="address" placeholder="Home Address" value={formData.address} onChange={handleChange} />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files[0])} />

        <button>{editingId ? "Update Student" : "Add Student"}</button>
      </form>

      {/* ===== BATCH IMPORT ===== */}
      <hr />
      <h3>Batch Import Old Students</h3>
      <input type="file" accept=".csv" onChange={handleCSVUpload} />

      {csvPreview.length > 0 && (
        <>
          <p>{csvPreview.length} students ready to import</p>
          <button onClick={handleBatchImport}>Import Students</button>
        </>
      )}

      {/* ===== SEARCH ===== */}
      <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* ===== LIST ===== */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Admission</th>
            <th>Class</th>
            <th>Gender</th>
            <th>Guardian</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{s.name}</td>
              <td>{s.admissionNo}</td>
              <td>{s.classLevel}</td>
              <td>{s.gender}</td>
              <td>{s.guardianName}</td>
              <td>{s.status}</td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
