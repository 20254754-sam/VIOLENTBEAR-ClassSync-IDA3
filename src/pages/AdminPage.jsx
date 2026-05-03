import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const getPreviewText = (value, limit = 240) => {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= limit) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, limit).trimEnd()}...`;
};

const AdminPage = ({
  pendingNotes,
  allNotes,
  reports,
  users,
  onApprove,
  onReject,
  onDelete,
  onResolveReport,
  onCreateAnnouncement
}) => {
  const approvedCount = allNotes.filter((note) => note.status === 'approved').length;
  const rejectedCount = allNotes.filter((note) => note.status === 'rejected').length;
  const openReports = reports.filter((report) => report.status === 'open');
  const [announcementForm, setAnnouncementForm] = useState({
    audience: 'all',
    targetUserId: '',
    title: '',
    message: ''
  });
  const [announcementFeedback, setAnnouncementFeedback] = useState('');

  const handleAnnouncementSubmit = (event) => {
    event.preventDefault();

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementFeedback('Please complete the announcement title and message.');
      return;
    }

    const result = onCreateAnnouncement({
      audience: announcementForm.audience,
      targetUserId: announcementForm.targetUserId,
      title: announcementForm.title.trim(),
      message: announcementForm.message.trim()
    });

    setAnnouncementFeedback(result.message);

    if (result.success) {
      setAnnouncementForm({
        audience: 'all',
        targetUserId: '',
        title: '',
        message: ''
      });
    }
  };

  return (
    <div className="page">
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <h1>Admin Review Queue</h1>
          <p>Review submissions, handle reports, and send announcements from one place.</p>
        </div>
      </section>

      <div className="profile-stat-grid admin-stat-grid">
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
        <div className="summary-card">
          <h3>Open reports</h3>
          <p>{openReports.length}</p>
        </div>
      </div>

      <section className="admin-section-block">
        <div className="admin-section-heading">
          <h2>Announcements</h2>
          <div className="upload-subtitle">
            <p>Broadcast updates or send a direct admin notice to one user.</p>
            <p>Announcements appear in the user inbox right away.</p>
          </div>
        </div>
        <form className="forum-form admin-announcement-form" onSubmit={handleAnnouncementSubmit}>
          <div className="forum-form-grid">
            <select
              value={announcementForm.audience}
              onChange={(event) =>
                setAnnouncementForm((currentForm) => ({
                  ...currentForm,
                  audience: event.target.value,
                  targetUserId: event.target.value === 'all' ? '' : currentForm.targetUserId
                }))
              }
            >
              <option value="all">Send to all users</option>
              <option value="one">Send to one user</option>
            </select>
            {announcementForm.audience === 'one' && (
              <select
                value={announcementForm.targetUserId}
                onChange={(event) =>
                  setAnnouncementForm((currentForm) => ({ ...currentForm, targetUserId: event.target.value }))
                }
              >
                <option value="">Choose a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
            <input
              value={announcementForm.title}
              onChange={(event) => setAnnouncementForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
              placeholder="Announcement title"
            />
          </div>
          <textarea
            rows="4"
            value={announcementForm.message}
            onChange={(event) => setAnnouncementForm((currentForm) => ({ ...currentForm, message: event.target.value }))}
            placeholder="Write the announcement you want users to see in their inbox."
          />
          <button type="submit">Send announcement</button>
          {announcementFeedback && <p className="rooms-feedback">{announcementFeedback}</p>}
        </form>
      </section>

      <section className="admin-section-block">
        <div className="admin-section-heading">
          <h2>Pending uploads</h2>
          <div className="upload-subtitle">
            <p>All student submissions appear here first.</p>
            <p>Approve a note to publish it, or reject it so the uploader can revise it.</p>
          </div>
        </div>

        {pendingNotes.length > 0 ? (
          <div className="admin-review-list">
            {pendingNotes.map((note) => (
              <article key={note.id} className="admin-review-card admin-review-card-compact">
                <div className="admin-review-header">
                  <div>
                    <h3>{note.title}</h3>
                    <p>
                      {note.subject} - submitted by {note.uploaderName} on {formatDate(note.updatedAt || note.createdAt)}
                    </p>
                  </div>
                  <span className="status-pill status-pending">pending</span>
                </div>

                <p className="admin-review-content admin-review-content-preview">{getPreviewText(note.content)}</p>

                <div className="admin-review-meta-grid">
                  <div className="admin-review-meta-chip">
                    <strong>Attachments</strong>
                    <span>{note.attachments?.length || 0}</span>
                  </div>
                  <div className="admin-review-meta-chip">
                    <strong>Reference</strong>
                    <span>{note.source ? note.source.type : 'Original work'}</span>
                  </div>
                </div>

                <div className="admin-review-tips">
                  <span>Admin checklist</span>
                  <p>Check clarity, completeness, and whether the reference details are filled in when needed.</p>
                </div>

                <div className="admin-review-actions admin-review-actions-sticky">
                  <Link to={`/note/${note.id}`} className="card-link-button">
                    View full note
                  </Link>
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
          <div className="profile-empty-state">
            <h3>No pending uploads</h3>
            <p>No notes are waiting for review right now.</p>
          </div>
        )}
      </section>

      <section className="admin-section-block">
        <div className="admin-section-heading">
          <h2>Reports</h2>
          <div className="upload-subtitle">
            <p>User reports land here for admin review.</p>
            <p>Reports can point to notes or forum posts that may need attention.</p>
          </div>
        </div>

        {openReports.length > 0 ? (
          <div className="admin-report-list">
            {openReports.map((report) => (
              <article key={report.id} className="admin-report-card">
                <div className="admin-review-header">
                  <div>
                    <h3>{report.targetTitle}</h3>
                    <p>
                      Reported by {report.reporterName} on {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <span className="status-pill status-rejected">{report.targetType === 'note' ? 'note report' : 'forum report'}</span>
                </div>
                <p className="admin-report-reason">{report.reason}</p>
                <div className="admin-review-actions">
                  {report.targetType === 'note' ? (
                    <Link to={report.roomId ? `/rooms/${report.roomId}/note/${report.targetId}` : `/note/${report.targetId}`} className="card-link-button">
                      Open reported note
                    </Link>
                  ) : (
                    <Link to={report.roomId ? `/rooms/${report.roomId}` : '/forum'} className="card-link-button">
                      Open forum thread
                    </Link>
                  )}
                  <button type="button" className="secondary-button" onClick={() => onResolveReport(report.id)}>
                    Mark resolved
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-empty-state">
            <h3>No open reports</h3>
            <p>Nothing is waiting for admin action here right now.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
