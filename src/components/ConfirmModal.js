// src/components/ConfirmModal.js
import React from 'react';
import './ConfirmModal.css';

/**
 * A reusable modal for showing confirmation dialogues and alerts.
 * @param {object} props The component props.
 * @param {boolean} props.isOpen Controls the visibility of the modal.
 * @param {string} props.message The message to display inside the modal.
 * @param {Function} props.onConfirm The function to call when the user confirms the action.
 * @param {Function} props.onCancel The function to call when the user cancels the action.
 * @param {boolean} [props.isAlert=false] If true, shows a single 'OK' button instead of 'Confirm' and 'Cancel'.
 */
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, isAlert = false }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Confirm Action</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-button-container">
          {!isAlert && (
            <button
              type="button"
              className="confirm-btn"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          )}
          <button
            type="button"
            className="cancel-btn"
            onClick={isAlert ? handleConfirm : handleCancel}
          >
            {isAlert ? 'OK' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
