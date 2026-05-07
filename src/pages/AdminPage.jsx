import React, { useMemo, useState } from 'react';
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

const EditIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path
      d="M4 20h4.4L19.1 9.3a2.1 2.1 0 0 0 0-3L17.7 4.9a2.1 2.1 0 0 0-3 0L4 15.6V20Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="m13.6 6 4.4 4.4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path
      d="M5 7h14M10 11v6M14 11v6M8 7l.6 12.1A2 2 0 0 0 10.6 21h2.8a2 2 0 0 0 2-1.9L16 7M9 7l1-3h4l1 3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const AdminPage = ({
  pendingNotes,
  allNotes,
  reports,
  users,
  announcements = [],
  onApprove,
  onReject,
  onDelete,
  onResolveReport,
  onCreateAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement
}) => {
  const approvedCount = allNotes.filter((note) => note.status === 'approved').length;
  const rejectedCount = allNotes.filter((note) => note.status === 'rejected').length;
  const openReports = reports.filter((report) => report.status === 'open');
  const [activeQueue, setActiveQueue] = useState('pending');
  const [announcementForm, setAnnouncementForm] = useState({
    audience: 'all',
    targetUserId: '',
    title: '',
    message: ''
  });
  const [announcementUserQuery, setAnnouncementUserQuery] = useState('');
  const [isAnnouncementUserSearchOpen, setIsAnnouncementUserSearchOpen] = useState(false);
  const [announcementFeedback, setAnnouncementFeedback] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementEditForm, setAnnouncementEditForm] = useState({
    title: '',
    message: ''
  });
  const [announcementEditFeedback, setAnnouncementEditFeedback] = useState('');
  const [isAnnouncementHistoryOpen, setIsAnnouncementHistoryOpen] = useState(false);
  const selectedAnnouncementUser = users.find((user) => user.id === announcementForm.targetUserId);
  const announcementUserResults = useMemo(() => {
    const normalizedQuery = announcementUserQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return users.slice(0, 6);
    }

    return users
      .filter((user) => user.email.toLowerCase().includes(normalizedQuery))
      .slice(0, 6);
  }, [announcementUserQuery, users]);

  const handleAnnouncementSubmit = (event) => {
    event.preventDefault();

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setAnnouncementFeedback('Please complete the announcement title and message.');
      return;
    }

    if (announcementForm.audience === 'one' && !announcementForm.targetUserId) {
      setAnnouncementFeedback('Search and choose a matching user email first.');
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
      setAnnouncementUserQuery('');
      setIsAnnouncementUserSearchOpen(false);
    }
  };

  const handleAnnouncementUserSearchChange = (value) => {
    const matchingUser = users.find((user) => user.email.toLowerCase() === value.trim().toLowerCase());

    setAnnouncementUserQuery(value);
    setIsAnnouncementUserSearchOpen(true);
    setAnnouncementForm((currentForm) => ({
      ...currentForm,
      targetUserId: matchingUser?.id || ''
    }));
  };

  const selectAnnouncementUser = (user) => {
    setAnnouncementUserQuery(user.email);
    setIsAnnouncementUserSearchOpen(false);
    setAnnouncementForm((currentForm) => ({
      ...currentForm,
      targetUserId: user.id
    }));
  };

  const startEditingAnnouncement = (announcement) => {
    setIsAnnouncementHistoryOpen(true);
    setEditingAnnouncement(announcement);
    setAnnouncementEditForm({
      title: announcement.title || '',
      message: announcement.message || ''
    });
    setAnnouncementEditFeedback('');
  };

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementEditForm({
      title: '',
      message: ''
    });
    setAnnouncementEditFeedback('');
  };

  const handleAnnouncementEditSubmit = (event) => {
    event.preventDefault();

    if (!editingAnnouncement) {
      return;
    }

    const result = onUpdateAnnouncement({
      announcementId: editingAnnouncement.announcementId,
      notificationIds: editingAnnouncement.notificationIds,
      title: announcementEditForm.title,
      message: announcementEditForm.message
    });

    setAnnouncementEditFeedback(result.message);

    if (result.success) {
      setEditingAnnouncement(null);
      setAnnouncementEditForm({
        title: '',
        message: ''
      });
    }
  };

  const handleDeleteAnnouncement = (announcement) => {
    if (editingAnnouncement?.id === announcement.id) {
      cancelEditingAnnouncement();
    }

    onDeleteAnnouncement(announcement);
  };

  return (
    <div className="page admin-page">
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <span className="dashboard-strip-label">Admin console</span>
          <h1>Admin Review Queue</h1>
          <p>Review submissions, handle reports, and send announcements from one place.</p>
        </div>
        <div className="admin-dashboard-status">
          <strong>{pendingNotes.length + openReports.length}</strong>
          <span>Needs action</span>
        </div>
      </section>

      <div className="profile-stat-grid admin-stat-grid">
        <div className="summary-card admin-stat-card admin-stat-card-warning">
          <h3>Pending</h3>
          <p>{pendingNotes.length}</p>
        </div>
        <div className="summary-card admin-stat-card admin-stat-card-success">
          <h3>Approved</h3>
          <p>{approvedCount}</p>
        </div>
        <div className="summary-card admin-stat-card admin-stat-card-muted">
          <h3>Rejected</h3>
          <p>{rejectedCount}</p>
        </div>
        <div className="summary-card admin-stat-card admin-stat-card-danger">
          <h3>Open reports</h3>
          <p>{openReports.length}</p>
        </div>
      </div>

      <section className="admin-section-block">
        <div className="admin-section-heading">
          <div>
            <span className="dashboard-strip-label">Broadcast center</span>
            <h2>Announcements</h2>
          </div>
          <div className="admin-section-note">
            <p>Broadcast updates or send a direct admin notice to one user.</p>
            <p>Announcements appear in the user inbox right away.</p>
          </div>
        </div>
        <form className="forum-form admin-announcement-form" onSubmit={handleAnnouncementSubmit}>
          <div className="forum-form-grid admin-announcement-grid">
            <input
              value={announcementForm.title}
              onChange={(event) => setAnnouncementForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
              placeholder="Announcement title"
            />
            <select
              value={announcementForm.audience}
              onChange={(event) => {
                const nextAudience = event.target.value;

                if (nextAudience === 'all') {
                  setAnnouncementUserQuery('');
                  setIsAnnouncementUserSearchOpen(false);
                }

                setAnnouncementForm((currentForm) => ({
                  ...currentForm,
                  audience: nextAudience,
                  targetUserId: nextAudience === 'all' ? '' : currentForm.targetUserId
                }));
              }}
            >
              <option value="all">Send to all users</option>
              <option value="one">Send to one user</option>
            </select>
            {announcementForm.audience === 'one' && (
              <div className="admin-announcement-recipient">
                <input
                  value={announcementUserQuery}
                  onChange={(event) => handleAnnouncementUserSearchChange(event.target.value)}
                  onFocus={() => setIsAnnouncementUserSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setIsAnnouncementUserSearchOpen(false), 120)}
                  placeholder="Search user email"
                  aria-label="Search user email"
                  autoComplete="off"
                />
                {isAnnouncementUserSearchOpen && (
                  <div className="admin-announcement-user-results">
                    {announcementUserResults.length > 0 ? (
                      announcementUserResults.map((user) => (
                        <button
                          type="button"
                          key={user.id}
                          className={`admin-announcement-user-option ${
                            selectedAnnouncementUser?.id === user.id ? 'admin-announcement-user-option-active' : ''
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectAnnouncementUser(user)}
                        >
                          {user.email}
                        </button>
                      ))
                    ) : (
                      <p>No matching email found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
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

        <div className="admin-announcement-history">
          <div className="admin-announcement-history-header">
            <div>
              <span className="dashboard-strip-label">Sent updates</span>
              <h3>Announcement history</h3>
            </div>
            <div className="admin-announcement-history-actions">
              <span>{announcements.length} sent</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsAnnouncementHistoryOpen((isOpen) => !isOpen)}
              >
                {isAnnouncementHistoryOpen ? 'Hide history' : 'View history'}
              </button>
            </div>
          </div>

          {isAnnouncementHistoryOpen && announcements.length > 0 ? (
            <div className="admin-announcement-list">
              {announcements.map((announcement) => (
                <article className="admin-announcement-card" key={announcement.id}>
                  <div className="admin-announcement-card-copy">
                    <strong>{announcement.title}</strong>
                    <p>{getPreviewText(announcement.message, 160)}</p>
                    <small>
                      {formatDate(announcement.createdAt)} - {announcement.recipientCount} recipient(s)
                      {announcement.editedAt ? ' - edited' : ''}
                    </small>
                  </div>
                  <div className="admin-announcement-actions">
                    <button
                      type="button"
                      className="admin-announcement-icon-button"
                      aria-label={`Edit announcement: ${announcement.title}`}
                      title="Edit announcement"
                      onClick={() => startEditingAnnouncement(announcement)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="admin-announcement-icon-button admin-announcement-icon-button-danger"
                      aria-label={`Delete announcement: ${announcement.title}`}
                      title="Delete announcement"
                      onClick={() => handleDeleteAnnouncement(announcement)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>

                  {editingAnnouncement?.id === announcement.id && (
                    <form className="admin-announcement-edit-form" onSubmit={handleAnnouncementEditSubmit}>
                      <input
                        value={announcementEditForm.title}
                        onChange={(event) =>
                          setAnnouncementEditForm((currentForm) => ({
                            ...currentForm,
                            title: event.target.value
                          }))
                        }
                        placeholder="Announcement title"
                      />
                      <textarea
                        rows="3"
                        value={announcementEditForm.message}
                        onChange={(event) =>
                          setAnnouncementEditForm((currentForm) => ({
                            ...currentForm,
                            message: event.target.value
                          }))
                        }
                        placeholder="Announcement message"
                      />
                      <div className="admin-announcement-edit-actions">
                        <button type="submit">Save changes</button>
                        <button type="button" className="secondary-button" onClick={cancelEditingAnnouncement}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>
          ) : isAnnouncementHistoryOpen ? (
            <div className="profile-empty-state admin-announcement-empty">
              <h3>No announcements yet</h3>
              <p>Sent announcements will appear here so admins can edit them later.</p>
            </div>
          ) : null}

          {isAnnouncementHistoryOpen && announcementEditFeedback && (
            <p className="rooms-feedback">{announcementEditFeedback}</p>
          )}
        </div>
      </section>

      <section className="admin-section-block">
        <div className="admin-section-heading">
          <div>
            <span className="dashboard-strip-label">Review desk</span>
            <h2>Moderation queue</h2>
          </div>
          <div className="admin-section-note">
            <p>Switch between student uploads and user reports.</p>
            <p>Open only the queue you need, review it, then move on without the page feeling crowded.</p>
          </div>
          <span className="admin-section-count">
            {activeQueue === 'pending' ? `${pendingNotes.length} waiting` : `${openReports.length} open`}
          </span>
        </div>

        <div className="admin-queue-toggle" role="tablist" aria-label="Admin review queues">
          <button
            type="button"
            role="tab"
            aria-selected={activeQueue === 'pending'}
            className={`admin-queue-tab ${activeQueue === 'pending' ? 'admin-queue-tab-active' : ''}`}
            onClick={() => setActiveQueue('pending')}
          >
            <span>Pending uploads</span>
            <strong>{pendingNotes.length}</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeQueue === 'reports'}
            className={`admin-queue-tab ${activeQueue === 'reports' ? 'admin-queue-tab-active' : ''}`}
            onClick={() => setActiveQueue('reports')}
          >
            <span>Reports</span>
            <strong>{openReports.length}</strong>
          </button>
        </div>

        <div className="admin-queue-panel">
          {activeQueue === 'pending' ? (
            pendingNotes.length > 0 ? (
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
                      <Link to={`/note/${note.id}`} state={{ from: '/admin' }} className="card-link-button">
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
            )
          ) : openReports.length > 0 ? (
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
                      <Link
                        to={report.roomId ? `/rooms/${report.roomId}/note/${report.targetId}` : `/note/${report.targetId}`}
                        state={{ from: '/admin' }}
                        className="card-link-button"
                      >
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
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
