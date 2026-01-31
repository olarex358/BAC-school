import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLocalStorage from "../hooks/useLocalStorage";
import ConfirmModal from "../components/ConfirmModal";
import { apiFetch } from "../api";

/* ===========================
   ROLE DEFINITIONS
=========================== */
const ROLES = {
  ACADEMIC_MANAGER: "Academic Manager",
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  SUPER_ADMIN: "Super Admin",
};

/* ===========================
   CLASS PROGRESSION MAP
=========================== */
const CLASS_PROGRESS = {
  "JSS 1": "JSS 2",
  "JSS 2": "JSS 3",
  "JSS 3": "SSS 1",
  "SSS 1": "SSS 2",
  "SSS 2": "SSS 3",
  "SSS 3": "GRADUATED",
};

const readLS = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const norm = (v) => String(v ?? "").trim();

export default function PromotionManagement() {
  const navigate = useNavigate();

  /* ===========================
     AUTH
  =========================== */
  const [user, setUser] = useState(null);

  /* ===========================
     DATA (offline-first + safe server READ)
     - students: read from server when online via hook
     - promotions: local-only storage for UI (we also pull from server once)
  =========================== */
  const [students, setStudents] = useLocalStorage(
    "schoolPortalStudents",
    [],
    "/api/schoolPortalStudents"
  );

  const [promotions, setPromotions] = useLocalStorage("schoolPortalPromotions", []);

  /* ===========================
     ACADEMIC STATE (v0.1 authority)
     Must exist in localStorage:
     schoolPortalAcademicState = {
       session: "2025/2026",
       term: "Third Term",
       promotionAllowed: true
     }
  =========================== */
  const academicState = useMemo(() => {
    const s = readLS("schoolPortalAcademicState", null);
    if (s && typeof s === "object") {
      return {
        session: norm(s.session),
        term: norm(s.term),
        promotionAllowed: !!s.promotionAllowed,
      };
    }
    // fallback (promotion will be locked)
    return { session: "", term: "", promotionAllowed: false };
  }, []);

  /* ===========================
     UI STATE
  =========================== */
  const [selectedClass, setSelectedClass] = useState("");
  const [promotionPreview, setPromotionPreview] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ===========================
     MODAL
  =========================== */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalAction, setModalAction] = useState(() => {});
  const [isModalAlert, setIsModalAlert] = useState(false);

  const showAlert = (msg) => {
    setModalMessage(msg);
    setIsModalAlert(true);
    setIsModalOpen(true);
  };

  const showConfirm = (msg, action) => {
    setModalMessage(msg);
    setModalAction(() => action);
    setIsModalAlert(false);
    setIsModalOpen(true);
  };

  /* ===========================
     ACCESS CHECK (NO EARLY RETURN)
  =========================== */
  useEffect(() => {
    const logged = JSON.parse(localStorage.getItem("loggedInUser"));

    if (
      !logged ||
      ![
        ROLES.ACADEMIC_MANAGER,
        ROLES.ADMIN,
        ROLES.PRINCIPAL,
        ROLES.SUPER_ADMIN,
      ].includes(logged.role)
    ) {
      navigate("/login");
      return;
    }

    setUser(logged);
  }, [navigate]);

  /* ===========================
     OPTIONAL: Fetch promotions from server once (merge into local)
     (safe, does not wipe local)
  =========================== */
  useEffect(() => {
    const loadPromotions = async () => {
      if (!navigator.onLine) return;

      try {
        const res = await apiFetch("/api/schoolPortalPromotions");
        if (!res.ok) return;

        const server = (await res.json().catch(() => [])) || [];
        if (!Array.isArray(server)) return;

        // merge unique by _id/id or fallback composite key
        const map = new Map();
        [...(promotions || []), ...server].forEach((p) => {
          const key =
            p._id ||
            p.id ||
            `${p.studentId || ""}|${p.date || ""}|${p.fromClass || ""}|${p.toClass || ""}`;
          map.set(String(key), p);
        });

        const merged = Array.from(map.values()).sort((a, b) =>
          String(b.date || "").localeCompare(String(a.date || ""))
        );

        setPromotions(merged);
      } catch {
        // silent
      }
    };

    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     PROMOTION PREVIEW
  =========================== */
  useEffect(() => {
    if (!selectedClass) {
      setPromotionPreview([]);
      setSelectedStudents({});
      return;
    }

    const eligible = (students || []).filter((s) => s.studentClass === selectedClass);

    const preview = eligible.map((s) => ({
      ...s,
      fromClass: s.studentClass,
      toClass: CLASS_PROGRESS[s.studentClass] || s.studentClass,
    }));

    const defaults = {};
    preview.forEach((p) => {
      defaults[p.admissionNo] = true;
    });

    setPromotionPreview(preview);
    setSelectedStudents(defaults);
  }, [selectedClass, students]);

  /* ===========================
     UNIQUE CLASSES (HOOK MUST BE TOP-LEVEL)
  =========================== */
  const uniqueClasses = useMemo(() => {
    return [...new Set((students || []).map((s) => s.studentClass).filter(Boolean))].sort();
  }, [students]);

  /* ===========================
     PERMISSIONS
  =========================== */
  const canApply = useMemo(() => {
    return user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;
  }, [user]);

  const canPreview = useMemo(() => {
    return canApply || user?.role === ROLES.ACADEMIC_MANAGER;
  }, [canApply, user]);

  /* ===========================
     APPLY PROMOTION (ONLINE REQUIRED)
  =========================== */
  const applyPromotion = async () => {
    if (submitting) return;

    // v0.1 gate: academic state must allow promotion
    if (!academicState.promotionAllowed) {
      return showAlert("Promotion is currently locked by Academic Calendar.");
    }

    if (academicState.term && academicState.term !== "Third Term") {
      return showAlert("Promotion is allowed only in Third Term.");
    }

    if (!navigator.onLine) {
      return showAlert("Promotion requires internet connection (online mode).");
    }

    const approved = (promotionPreview || []).filter((p) => selectedStudents[p.admissionNo]);
    if (!approved.length) return showAlert("No students selected for promotion.");

    setSubmitting(true);

    const nowIso = new Date().toISOString();
    const session = academicState.session || "";
    const term = academicState.term || "";

    // 1) Update students locally first
    const updatedStudents = (students || []).map((s) => {
      const p = approved.find((x) => x.admissionNo === s.admissionNo);
      return p ? { ...s, studentClass: p.toClass } : s;
    });

    // 2) Build logs
    const logs = approved.map((p) => ({
      studentId: p.admissionNo,
      fromClass: p.fromClass,
      toClass: p.toClass,
      session,
      term,
      promotedBy: user?.username || user?.staffId || "admin",
      date: nowIso,
      rolledBack: false,
    }));

    // save local first (safe)
    setStudents(updatedStudents);
    setPromotions((prev) => [...logs, ...(prev || [])]);

    // 3) Sync to backend (one-by-one, safe)
    try {
      for (const p of approved) {
        // Student _id exists when loaded from backend
        if (p._id) {
          await apiFetch(`/api/schoolPortalStudents/${p._id}`, {
            method: "PUT",
            body: JSON.stringify({ studentClass: p.toClass }),
          });
        }
      }

      for (const log of logs) {
        await apiFetch("/api/schoolPortalPromotions", {
          method: "POST",
          body: JSON.stringify(log),
        });
      }

      showAlert("Promotion applied successfully ✅");
      setSelectedClass("");
    } catch {
      showAlert("Promotion saved locally, but online sync failed. Data is not lost ✅");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===========================
     RENDER (NO EARLY RETURN BEFORE HOOKS)
  =========================== */
  const isReady = !!user;

  return (
    <div className="content-section">
      <ConfirmModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => {
          modalAction();
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        isAlert={isModalAlert}
      />

      {!isReady ? (
        <div className="content-section">Loading…</div>
      ) : (
        <>
          <h1>Student Promotion</h1>

          <p style={{ color: "#555" }}>
            Academic State → Session: <b>{academicState.session || "-"}</b> | Term:{" "}
            <b>{academicState.term || "-"}</b> | Promotion Allowed:{" "}
            <b>{academicState.promotionAllowed ? "YES" : "NO"}</b>
          </p>

          {canPreview && (
            <>
              <label>Select Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">-- Select Class --</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </>
          )}

          {promotionPreview.length > 0 && (
            <>
              <h3>Promotion Preview</h3>
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Admission No</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionPreview.map((p) => (
                    <tr key={p.admissionNo}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selectedStudents[p.admissionNo]}
                          onChange={(e) =>
                            setSelectedStudents((prev) => ({
                              ...prev,
                              [p.admissionNo]: e.target.checked,
                            }))
                          }
                          disabled={!canApply || submitting}
                        />
                      </td>
                      <td>
                        {p.firstName} {p.lastName}
                      </td>
                      <td>{p.admissionNo}</td>
                      <td>{p.fromClass}</td>
                      <td>{p.toClass}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {canApply && promotionPreview.length > 0 && (
            <button
              disabled={submitting}
              onClick={() => showConfirm("Apply promotion for selected students?", applyPromotion)}
            >
              {submitting ? "Applying..." : "Apply Promotion"}
            </button>
          )}

          <button onClick={() => navigate("/admin-dashboard")} style={{ marginTop: 10 }}>
            Back to Dashboard
          </button>
        </>
      )}
    </div>
  );
}
