// src/pages/StudentManagement.js
import React, { useEffect, useState } from "react";
import offlineApi from "../services/offlineApi";

const STORE = "schoolPortalStudents";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    admissionNo: "",
    classLevel: "",
    gender: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    status: "Active",
  });

  const load = async () => {
    const data = await offlineApi.get(STORE);
    setStudents(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onEdit = (student) => {
    const id = student._id || student.id; // ✅ correct
    setEditingId(id);

    setFormData({
      name:
        student.name ||
        [student.firstName, student.lastName].filter(Boolean).join(" "),
      admissionNo: student.admissionNo || "",
      classLevel: student.classLevel || student.studentClass || "",
      gender: student.gender || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || student.parentPhone || "",
      address: student.address || "",
      status: student.status || "Active",
    });
  };

  const onDelete = async (student) => {
    const id = student._id || student.id;
    await offlineApi.remove(STORE, id);
    await load();
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      await offlineApi.update(STORE, editingId, formData);
    } else {
      await offlineApi.create(STORE, formData);
    }

    setEditingId(null);
    setFormData({
      name: "",
      admissionNo: "",
      classLevel: "",
      gender: "",
      guardianName: "",
      guardianPhone: "",
      address: "",
      status: "Active",
    });

    await load();
  };

  return (
    <div>
      <h2>Student Management</h2>

      <form onSubmit={onSubmit}>
        <input name="name" value={formData.name} onChange={onChange} placeholder="Full Name" />
        <input name="admissionNo" value={formData.admissionNo} onChange={onChange} placeholder="Admission No" />
        <input name="classLevel" value={formData.classLevel} onChange={onChange} placeholder="Class" />
        <input name="gender" value={formData.gender} onChange={onChange} placeholder="Gender" />
        <input name="guardianName" value={formData.guardianName} onChange={onChange} placeholder="Guardian Name" />
        <input name="guardianPhone" value={formData.guardianPhone} onChange={onChange} placeholder="Guardian Phone" />
        <input name="address" value={formData.address} onChange={onChange} placeholder="Address" />
        <select name="status" value={formData.status} onChange={onChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button type="submit">{editingId ? "Update" : "Add"}</button>
      </form>

      <hr />

      {students.map((s) => (
        <div key={s._id || s.id} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <b>{s.name || [s.firstName, s.lastName].filter(Boolean).join(" ")}</b> — {s.admissionNo}
          </div>
          <button onClick={() => onEdit(s)}>Edit</button>
          <button onClick={() => onDelete(s)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
