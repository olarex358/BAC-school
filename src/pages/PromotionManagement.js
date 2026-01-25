import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import ConfirmModal from '../components/ConfirmModal';

/* ===========================
   ROLE DEFINITIONS
=========================== */
const ROLES = {
  ACADEMIC_MANAGER: 'Academic Manager',
  ADMIN: 'Admin',
  PRINCIPAL: 'Principal',
  SUPER_ADMIN: 'Super Admin'
};

/* ===========================
   CLASS PROGRESSION MAP
=========================== */
const CLASS_PROGRESS = {
  'JSS 1': 'JSS 2',
  'JSS 2': 'JSS 3',
  'JSS 3': 'SSS 1',
  'SSS 1': 'SSS 2',
  'SSS 2': 'SSS 3',
  'SSS 3': 'GRADUATED'
};

function PromotionManagement() {
  const navigate = useNavigate();

  /* ===========================
     AUTH
  =========================== */
  const [user, setUser] = useState(null);

  /* ===========================
     DATA (OFFLINE-FIRST)
  =========================== */
  const [students, setStudents] = useLocalStorage(
    'schoolPortalStudents',
    [],
    'http://localhost:5000/api/schoolPortalStudents'
  );

  const [promotions, setPromotions] = useLocalStorage(
    'schoolPortalPromotions',
    [],
    'http://localhost:5000/api/schoolPortalPromotions'
  );

  /* ===========================
     STATE
  =========================== */
  const [selectedClass, setSelectedClass] = useState('');
  const [promotionPreview, setPromotionPreview] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState({});
  const [currentTerm, setCurrentTerm] = useState('3rd Term');

  /* ===========================
     MODAL
  =========================== */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
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
     ACCESS CHECK
  =========================== */
  useEffect(() => {
    const logged = JSON.parse(localStorage.getItem('loggedInUser'));
    if (
      !logged ||
      ![
        ROLES.ACADEMIC_MANAGER,
        ROLES.ADMIN,
        ROLES.PRINCIPAL,
        ROLES.SUPER_ADMIN
      ].includes(logged.role)
    ) {
      navigate('/login');
      return;
    }
    setUser(logged);
  }, [navigate]);

  /* ===========================
     PROMOTION PREVIEW
  =========================== */
  useEffect(() => {
    if (!selectedClass) {
      setPromotionPreview([]);
      setSelectedStudents({});
      return;
    }

    const eligible = students.filter(
      s => s.studentClass === selectedClass
    );

    const preview = eligible.map(s => ({
      ...s,
      fromClass: s.studentClass,
      toClass: CLASS_PROGRESS[s.studentClass] || s.studentClass
    }));

    const defaultSelection = {};
    preview.forEach(p => {
      defaultSelection[p.admissionNo] = true;
    });

    setPromotionPreview(preview);
    setSelectedStudents(defaultSelection);
  }, [selectedClass, students]);

  /* ===========================
     APPLY PROMOTION (ADMIN)
  =========================== */
  const applyPromotion = async () => {
    if (currentTerm !== '3rd Term') {
      showAlert('Promotion is allowed only in 3rd Term.');
      return;
    }

    const approved = promotionPreview.filter(
      p => selectedStudents[p.admissionNo]
    );

    if (approved.length === 0) {
      showAlert('No students selected for promotion.');
      return;
    }

    const updatedStudents = students.map(s => {
      const promoted = approved.find(
        p => p.admissionNo === s.admissionNo
      );
      return promoted
        ? { ...s, studentClass: promoted.toClass }
        : s;
    });

    const promotionLogs = approved.map(p => ({
      studentId: p.admissionNo,
      fromClass: p.fromClass,
      toClass: p.toClass,
      session: new Date().getFullYear(),
      term: currentTerm,
      promotedBy: user.username,
      date: new Date().toISOString(),
      rolledBack: false
    }));

    setStudents(updatedStudents);
    setPromotions([...promotions, ...promotionLogs]);

    showAlert('Promotion applied successfully.');
    setSelectedClass('');
  };

  if (!user) return <div className="content-section">Loading...</div>;

  const canApply = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  const canPreview = canApply || user.role === ROLES.ACADEMIC_MANAGER;

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

      <h1>Student Promotion</h1>
      <p>
        Term: <strong>{currentTerm}</strong>
      </p>

      {canPreview && (
        <>
          <label>Select Class</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {[...new Set(students.map(s => s.studentClass))].map(cls => (
              <option key={cls} value={cls}>{cls}</option>
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
              {promotionPreview.map(p => (
                <tr key={p.admissionNo}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents[p.admissionNo]}
                      onChange={e =>
                        setSelectedStudents(prev => ({
                          ...prev,
                          [p.admissionNo]: e.target.checked
                        }))
                      }
                      disabled={!canApply}
                    />
                  </td>
                  <td>{p.firstName} {p.lastName}</td>
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
          onClick={() =>
            showConfirm(
              'Apply promotion for selected students?',
              applyPromotion
            )
          }
        >
          Apply Promotion
        </button>
      )}

      <button onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default PromotionManagement;
