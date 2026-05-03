import React from 'react';
import { Link } from 'react-router-dom';

const formatDateTime = (dateValue) =>
  new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const NotificationsPage = ({ currentUser, items, onMarkRead, onMarkAllRead }) => {
  const unreadCount = items.filter((item) => !item.readAt).length;
  const actionableNotifications = items.filter((item) => item.kind !== 'report' && !item.readAt).length;

  return (
    <div className="page">
      <section className="notification-shell">
        <div className="notification-hero">
          <div className="notification-header">
            <div className="notification-copy">
              <h1>{currentUser.role === 'admin' ? 'Admin Inbox' : 'Your Inbox'}</h1>
              <div className="notification-copy-meta">
                <p>{items.length} notification(s)</p>
                <p>See approvals, comments, likes, reviews, announcements, and admin updates here.</p>
              </div>
            </div>
            {actionableNotifications > 0 && (
              <button type="button" className="secondary-button" onClick={onMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-overview">
            <article className="notification-overview-card">
              <strong>{items.length}</strong>
              <span>Total updates</span>
            </article>
            <article className="notification-overview-card notification-overview-card-emphasis">
              <strong>{unreadCount}</strong>
              <span>Need your attention</span>
            </article>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="notification-list">
            {items.map((item) => (
              <article
                key={item.id}
                className={`notification-card ${item.readAt ? 'notification-card-read' : 'notification-card-unread'}`}
              >
                <div className="notification-card-accent" aria-hidden="true" />
                <div className="admin-review-header">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.message}</p>
                  </div>
                  {!item.readAt && (
                    <span className={`status-pill ${item.kind === 'report' ? 'status-rejected' : 'status-pending'}`}>
                      {item.kind === 'report' ? 'report' : 'new'}
                    </span>
                  )}
                </div>
                <div className="notification-meta-row">
                  <small>{formatDateTime(item.createdAt)}</small>
                  <div className="admin-review-actions">
                    {item.link && (
                      <Link
                        to={item.link}
                        className="card-link-button"
                        onClick={() => {
                          if (item.kind !== 'report') {
                            onMarkRead(item.id);
                          }
                        }}
                      >
                        {item.kind === 'report' ? 'Review report' : 'Open'}
                      </Link>
                    )}
                    {item.kind !== 'report' && !item.readAt && (
                      <button type="button" className="secondary-button" onClick={() => onMarkRead(item.id)}>
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-empty-state notification-empty-state">
            <h3>No notifications yet</h3>
            <p>Your updates and announcements will appear here once there is activity.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;
