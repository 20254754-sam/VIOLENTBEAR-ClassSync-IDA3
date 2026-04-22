import React, { useEffect, useState } from 'react';

const AppModal = ({
  isOpen,
  variant = 'default',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requireComment = false,
  commentLabel = 'Comment',
  commentPlaceholder = 'Type your comment here',
  initialComment = '',
  onCancel,
  onConfirm
}) => {
  const [comment, setComment] = useState(initialComment);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setComment(initialComment);
    setShowError(false);
  }, [initialComment, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    const trimmedComment = comment.trim();

    if (requireComment && !trimmedComment) {
      setShowError(true);
      return;
    }

    onConfirm(trimmedComment);
  };

  return (
    <div className="app-modal-overlay" onClick={onCancel}>
      <div
        className={`app-modal app-modal-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal-header">
          <span className={`app-modal-badge app-modal-badge-${variant}`}>
            {variant === 'danger' ? 'Attention' : variant === 'success' ? 'Update' : 'Confirm'}
          </span>
          <h3 id="app-modal-title">{title}</h3>
        </div>

        {message && <p className="app-modal-message">{message}</p>}

        {requireComment && (
          <div className="form-group">
            <label htmlFor="app-modal-comment">{commentLabel}</label>
            <textarea
              id="app-modal-comment"
              className={`form-control ${showError ? 'field-error' : ''}`}
              rows="4"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                if (showError) {
                  setShowError(false);
                }
              }}
              placeholder={commentPlaceholder}
            />
            {showError && <p className="field-error-text">Please add a comment before continuing.</p>}
          </div>
        )}

        <div className="app-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={variant === 'danger' ? 'card-link-button card-link-button-danger' : undefined}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppModal;
