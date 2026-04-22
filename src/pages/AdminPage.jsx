import React from 'react';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const AdminPage = ({ pendingNotes, allNotes, onApprove, onReject, onDelete }) => {
  const approvedCount = allNotes.filter((note) => note.status === 'approved').length;
  const rejectedCount = allNotes.filter((note) => note.status === 'rejected').length;

  return (
    <div className="page">
      <h1>Admin Review Queue</h1>
      <div className="profile-stat-grid">
        <div className="summary-card">
          <h3>Pending</h3>
          <p>{pendingNotes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Approved</h3>
          <p>{approvedCount}</p>
        </div>
        <div className="summary-card">
          <h3>Rejected</h3>
          <p>{rejectedCount}</p>
        </div>
      </div>

      <div className="upload-subtitle">
        <p>All student submissions appear here first.</p>
        <p>Approve a note to publish it, or reject it so the uploader can revise it.</p>
      </div>

      {pendingNotes.length > 0 ? (
        <div className="admin-review-list">
          {pendingNotes.map((note) => (
            <article key={note.id} className="admin-review-card">
              <div className="admin-review-header">
                <div>
                  <h3>{note.title}</h3>
                  <p>
                    {note.subject} - submitted by {note.uploaderName} on {formatDate(note.updatedAt || note.createdAt)}
                  </p>
                </div>
                <span className="status-pill status-pending">pending</span>
              </div>

              <p className="admin-review-content">{note.content}</p>

              {note.source && (
                <div className="admin-review-source">
                  <strong>Reference:</strong> {note.source.type} - {note.source.title}
                </div>
              )}

              {note.attachments?.length > 0 && (
                <div className="attachment-panel">
                  <strong>Attachments</strong>
                  <div className="attachment-view-list">
                    {note.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-view-button"
                      >
                        {attachment.isImage ? 'Open image' : 'Open file'}: {attachment.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin-review-tips">
                <span>Admin checklist</span>
                <p>Check clarity, completeness, and whether the reference details are filled in when needed.</p>
              </div>

              <div className="admin-review-actions">
                <button type="button" className="secondary-button" onClick={() => onApprove(note.id)}>
                  Approve
                </button>
                <button type="button" className="card-link-button card-link-button-danger" onClick={() => onReject(note.id)}>
                  Reject
                </button>
                <button type="button" className="card-link-button card-link-button-danger" onClick={() => onDelete(note.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No notes are waiting for review right now.</p>
      )}
    </div>
  );
};

export default AdminPage;
