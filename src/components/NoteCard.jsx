import React from 'react';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const NoteCard = ({ note, currentUser, onToggleLike, onDelete, onEdit, showStatus, detailPath, editPath }) => {
  const navigate = useNavigate();
  const hasSource = note.isOwnWork === false && note.source;
  const isUploader = currentUser && note.uploaderId === currentUser.id;
  const canDelete = isUploader || currentUser?.role === 'admin';
  const likedByCurrentUser = currentUser ? note.likes.includes(currentUser.id) : false;
  const nextDetailPath = detailPath || `/note/${note.id}`;

  const handleAction = (event, callback) => {
    event.stopPropagation();
    callback();
  };

  return (
    <article
      className="note-card"
      onClick={() => navigate(nextDetailPath)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(nextDetailPath);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="note-card-inner">
        <div className="note-badge-row">
          <span className={`ownership-badge ${hasSource ? 'ownership-badge-referenced' : 'ownership-badge-original'}`}>
            {hasSource ? 'Referenced material' : 'Original work'}
          </span>
          {showStatus && <span className={`status-pill status-${note.status}`}>{note.status}</span>}
        </div>

        <h3 className="note-card-title">{note.title}</h3>
        <span className="subject">{note.subject}</span>

        <p className="preview">{note.content}</p>

        <div className="note-card-action-row">
          <button
            type="button"
            className={`card-action-button ${likedByCurrentUser ? 'card-action-button-active' : ''}`}
            onClick={(event) => handleAction(event, () => onToggleLike(note.id))}
          >
            {likedByCurrentUser ? 'Unlike' : 'Like'} {note.likes.length}
          </button>
          <span className={`reference-button ${hasSource ? '' : 'reference-button-hidden'}`}>
            {hasSource ? 'Reference available' : 'No reference'}
          </span>
        </div>

        <div className="note-owner-actions">
          {isUploader && onEdit && (
            <button
              type="button"
              className="card-link-button"
              onClick={(event) => handleAction(event, () => {
                onEdit(note.id);
                navigate(editPath || '/upload');
              })}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="card-link-button card-link-button-danger"
              onClick={(event) =>
                handleAction(event, () => onDelete(note.id))
              }
            >
              Delete
            </button>
          )}
          {!isUploader && !canDelete && <span className="card-link-button card-link-button-placeholder">Actions</span>}
        </div>

        <div className="note-meta">
          <span>{note.uploaderName}</span>
          <span>{formatDate(note.updatedAt || note.createdAt)}</span>
        </div>
      </div>
    </article>
  );
};

export default NoteCard;
