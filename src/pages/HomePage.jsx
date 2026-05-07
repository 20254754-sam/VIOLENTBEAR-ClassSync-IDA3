import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import NoteList from '../components/NoteList';

const formatAnnouncementDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const HomePage = ({ notes, currentUser, announcements = [], onToggleLike, onDelete, onEdit }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const recentNotes = [...notes]
    .filter((note) => note.status === 'approved' && !note.roomId)
    .sort(
      (firstNote, secondNote) =>
        new Date(secondNote.approvedAt || secondNote.updatedAt || secondNote.createdAt) -
        new Date(firstNote.approvedAt || firstNote.updatedAt || firstNote.createdAt)
    )
    .slice(0, 3);
  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (firstAnnouncement, secondAnnouncement) =>
          new Date(secondAnnouncement.createdAt || 0) - new Date(firstAnnouncement.createdAt || 0)
      ),
    [announcements]
  );
  const previewAnnouncements = sortedAnnouncements.slice(0, 3);
  const hasMoreAnnouncements = sortedAnnouncements.length > previewAnnouncements.length;
  const focusedAnnouncementId = searchParams.get('announcement');

  const announcementMatchesId = (announcement, targetId) => {
    if (!announcement || !targetId) {
      return false;
    }

    const possibleIds = [
      announcement.id,
      announcement.announcementId,
      ...(Array.isArray(announcement.notificationIds) ? announcement.notificationIds : [])
    ].filter(Boolean);

    return possibleIds.some((id) => String(id) === String(targetId));
  };

  useEffect(() => {
    if (!focusedAnnouncementId || sortedAnnouncements.length === 0) {
      return;
    }

    const matchingAnnouncement = sortedAnnouncements.find((announcement) =>
      announcementMatchesId(announcement, focusedAnnouncementId)
    );

    if (matchingAnnouncement) {
      setSelectedAnnouncement(matchingAnnouncement);
      setIsAnnouncementModalOpen(true);
    }
  }, [focusedAnnouncementId, sortedAnnouncements]);

  const clearFocusedAnnouncement = () => {
    if (!searchParams.has('announcement')) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('announcement');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const closeAnnouncementModal = () => {
    clearFocusedAnnouncement();
    setIsAnnouncementModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const openAnnouncementDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
  };

  const renderAnnouncementCard = (announcement, options = {}) => (
    <button
      type="button"
      className={`home-announcement-card ${
        announcement.readAt ? 'home-announcement-card-read' : 'home-announcement-card-unread'
      } ${
        selectedAnnouncement?.id === announcement.id ? 'home-announcement-card-active' : ''
      }`}
      key={announcement.id}
      onClick={() => openAnnouncementDetails(announcement)}
      aria-label={`Open announcement: ${announcement.title || 'Announcement'}`}
    >
      <div className="home-announcement-copy">
        <strong>{announcement.title || 'Announcement'}</strong>
        <p>{announcement.message}</p>
      </div>
      <small>{formatAnnouncementDate(announcement.createdAt)}</small>
      {options.showHint && (
        <span className="home-announcement-open-hint">View details</span>
      )}
    </button>
  );

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-logo-wrap">
          <BrandLogo size="hero" showWordmark={false} />
        </div>
        <h1>Share and study together</h1>
        <p>
          Discover approved class notes, support helpful uploads, and collaborate with
          classmates in one organized study space.
        </p>
      </section>

      <section className="dashboard-strip">
        <div className="dashboard-strip-card">
          <span className="dashboard-strip-label">Quick start</span>
          <h3>Upload a note or ask the community</h3>
          <p>Students can share reviewers, while admins review and approve what becomes public.</p>
        </div>
        <div className="dashboard-strip-actions">
          <span className="dashboard-strip-actions-label">Quick actions</span>
          <div className="dashboard-action-group">
            <Link to="/upload" className="dashboard-action-link">Upload note</Link>
            <Link to="/forum" className="dashboard-action-link">Open forum</Link>
            {currentUser.role === 'admin' && (
              <Link to="/admin" className="dashboard-action-link">Review queue</Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-announcements" aria-labelledby="home-announcements-title">
        <div className="home-section-heading">
          <div>
            <span className="dashboard-strip-label">Announcements</span>
            <h2 id="home-announcements-title">Latest announcements</h2>
          </div>
          {hasMoreAnnouncements && (
            <button
              className="secondary-button home-announcements-view-button"
              type="button"
              onClick={() => setIsAnnouncementModalOpen(true)}
            >
              View all ({sortedAnnouncements.length})
            </button>
          )}
        </div>

        {previewAnnouncements.length > 0 ? (
          <div className="home-announcement-list">
            {previewAnnouncements.map(renderAnnouncementCard)}
          </div>
        ) : (
          <div className="home-announcements-empty">
            <p>No announcements yet. New admin updates will appear here.</p>
          </div>
        )}
      </section>

      <div className="page-summary-grid">
        <div className="summary-card">
          <h3>Approved notes</h3>
          <p>{notes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Community features</h3>
          <p>Likes, reviews, and requests</p>
        </div>
        <div className="summary-card">
          <h3>Need a new reviewer?</h3>
          <p>
            Visit the <Link to="/forum">forum</Link> to ask for one.
          </p>
        </div>
      </div>

      <section className="home-recent-notes">
        <h2>Recent Approved Notes</h2>
        {recentNotes.length > 0 ? (
          <NoteList
            notes={recentNotes}
            currentUser={currentUser}
            onToggleLike={onToggleLike}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ) : (
          <p>No approved notes yet. Ask the admin to review new submissions.</p>
        )}
      </section>

      {isAnnouncementModalOpen && (
        <div
          className="home-announcement-modal-backdrop"
          role="presentation"
          onClick={closeAnnouncementModal}
        >
          <section
            className="home-announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-announcements-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-announcement-modal-header">
              <div>
                <span className="dashboard-strip-label">Broadcasts</span>
                <h3 id="all-announcements-title">All announcements</h3>
              </div>
              <button
                type="button"
                className="home-announcement-modal-close"
                aria-label="Close announcements"
                onClick={closeAnnouncementModal}
              >
                x
              </button>
            </div>
            <div
              className={`home-announcement-modal-body ${
                selectedAnnouncement ? 'home-announcement-modal-body-with-detail' : ''
              }`}
            >
              {selectedAnnouncement && (
                <article className="home-announcement-detail-panel">
                  <div className="home-announcement-detail-header">
                    <span className="dashboard-strip-label">Full details</span>
                    <button
                      type="button"
                      className="home-announcement-detail-back"
                      onClick={() => {
                        clearFocusedAnnouncement();
                        setSelectedAnnouncement(null);
                      }}
                    >
                      Back
                    </button>
                  </div>
                  <h4>{selectedAnnouncement.title || 'Announcement'}</h4>
                  <p>{selectedAnnouncement.message}</p>
                  <small>
                    Posted {formatAnnouncementDate(selectedAnnouncement.createdAt)}
                    {selectedAnnouncement.editedAt
                      ? ` - edited ${formatAnnouncementDate(selectedAnnouncement.editedAt)}`
                      : ''}
                  </small>
                </article>
              )}
              <div className="home-announcement-modal-list">
                {sortedAnnouncements.map((announcement) =>
                  renderAnnouncementCard(announcement, { showHint: true })
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HomePage;
