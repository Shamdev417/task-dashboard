import { useState } from 'react';

function ConfirmDialog({ task, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal confirm-dialog">
        <h2 className="modal__title">Delete Task</h2>
        <p className="confirm-dialog__message">
          Are you sure you want to delete{' '}
          <span className="confirm-dialog__task-name">"{task.title}"</span>?
          This action cannot be undone.
        </p>
        <div className="form-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className="btn-confirm-delete" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
