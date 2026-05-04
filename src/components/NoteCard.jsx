import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const NoteCardActionIcon = ({ type }) => {
  const paths = {
    like: (
      <path
        d="M12 20.2 5.4 13.9a4.1 4.1 0 0 1-.25-5.75 3.7 3.7 0 0 1 5.45.08L12 9.7l1.4-1.47a3.7 3.7 0 0 1 5.45-.08 4.1 4.1 0 0 1-.25 5.75z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ),
    edit: (
      <path
        d="m4.5 16.8-.5 3.2 3.2-.5L18.8 7.9a2.1 2.1 0 0 0-3-3zM14.6 6.1l3.3 3.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ),
    delete: (
      <path
        d="M5.5 7h13M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7m2.1 0-.7 12a1.6 1.6 0 0 1-1.6 1.5H9.2a1.6 1.6 0 0 1-1.6-1.5L6.9 7m3.1 3.2v6.2m4-6.2v6.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    )
  };

  return (
    <span className="note-card-button-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {paths[type]}
      </svg>
    </span>
  );
};

const NoteCard = ({ note, currentUser, onToggleLike, onDelete, onEdit, showStatus, detailPath, editPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasSource = note.isOwnWork === false && note.source;
  const isUploader = currentUser && note.uploaderId === currentUser.id;
  const canDelete = isUploader || currentUser?.role === 'admin';
  const likedByCurrentUser = currentUser ? note.likes.includes(currentUser.id) : false;
  const nextDetailPath = detailPath || `/note/${note.id}`;
  const backRoute = `${location.pathname}${location.search}`;

  const openDetails = () => {
    const returnRoute = backRoute || '/';
    sessionStorage.setItem('classsync-note-return-route', returnRoute);
    navigate(nextDetailPath, { state: { from: returnRoute } });
  };

  const handleAction = (event, callback) => {
    event.stopPropagation();
    callback();
  };

  return (
    <article
      className="note-card"
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetails();
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
            aria-label={`${likedByCurrentUser ? 'Unlike' : 'Like'} note, ${note.likes.length} likes`}
          >
            <NoteCardActionIcon type="like" />
            <span className="note-card-button-label">{likedByCurrentUser ? 'Unlike' : 'Like'}</span>
            <span className="note-card-button-count">{note.likes.length}</span>
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
            aria-label="Edit note"
          >
              <NoteCardActionIcon type="edit" />
              <span className="note-card-button-label">Edit</span>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="card-link-button card-link-button-danger"
              onClick={(event) =>
              handleAction(event, () => onDelete(note.id))
            }
            aria-label="Delete note"
          >
              <NoteCardActionIcon type="delete" />
              <span className="note-card-button-label">Delete</span>
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
