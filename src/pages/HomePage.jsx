import React from 'react';
import { Link } from 'react-router-dom';
import NoteList from '../components/NoteList';

const HomePage = ({ notes, currentUser, onToggleLike, onDelete, onEdit }) => {
  const recentNotes = notes.slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <h1>🕮</h1>
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

      <section>
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
    </div>
  );
};

export default HomePage;
