import React from 'react';
import { Link } from 'react-router-dom';
import NoteList from '../components/NoteList';

const ProfilePage = ({ notes, currentUser, onToggleLike, onDelete, onEdit }) => {
  const approvedNotes = notes.filter((note) => note.status === 'approved');
  const pendingNotes = notes.filter((note) => note.status === 'pending');
  const rejectedNotes = notes.filter((note) => note.status === 'rejected');
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="page">
      <h1>Your Profile</h1>

      <div className="profile-hero">
        <div>
          <h2>{currentUser.name}</h2>
          <p>{currentUser.bio}</p>
        </div>
        <div className="profile-role-badge">{currentUser.role}</div>
      </div>

      <div className="profile-stat-grid">
        <div className="summary-card">
          <h3>Total uploads</h3>
          <p>{notes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Approved</h3>
          <p>{approvedNotes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Waiting for review</h3>
          <p>{pendingNotes.length}</p>
        </div>
        {!isAdmin && (
          <div className="summary-card">
            <h3>Needs revision</h3>
            <p>{rejectedNotes.length}</p>
          </div>
        )}
      </div>

      <div className="upload-subtitle">
        <p>Your uploads and moderation status are listed here.</p>
        <p>Pending notes become public only after the admin approves them.</p>
      </div>

      <h2>Waiting for review</h2>
      {pendingNotes.length > 0 ? (
        <NoteList
          notes={pendingNotes}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onDelete={onDelete}
          onEdit={onEdit}
          showStatus
        />
      ) : (
        <div className="profile-empty-state">
          <h3>Nothing is waiting for review</h3>
          <p>Your new uploads will appear here while the admin is checking them.</p>
        </div>
      )}

      <h2>Approved uploads</h2>
      {approvedNotes.length > 0 ? (
        <NoteList
          notes={approvedNotes}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onDelete={onDelete}
          onEdit={onEdit}
          showStatus
        />
      ) : (
        <div className="profile-empty-state">
          <h3>No approved uploads yet</h3>
          <p><Link to="/upload">Upload your first note</Link> and wait for the admin to approve it.</p>
        </div>
      )}

      {!isAdmin && (
        <>
          <h2>Needs revision</h2>
          {rejectedNotes.length > 0 ? (
            <NoteList
              notes={rejectedNotes}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
              onEdit={onEdit}
              showStatus
            />
          ) : (
            <div className="profile-empty-state">
              <h3>No revisions needed</h3>
              <p>Your notes have not been sent back for revision. Keep it up.</p>
            </div>
          )}

          {rejectedNotes.length > 0 && (
            <div className="profile-rejection-list">
              {rejectedNotes.map((note) => (
                <div key={`rejection-${note.id}`} className="profile-empty-state profile-revision-card">
                  <h3>{note.title}</h3>
                  <p>{note.rejectionReason || 'The admin requested a few revisions before approval.'}</p>
                  <small>
                    Commented by {note.rejectionByName || 'Admin'}
                  </small>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
