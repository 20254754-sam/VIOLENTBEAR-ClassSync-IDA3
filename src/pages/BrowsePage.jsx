import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import NoteList from '../components/NoteList';
import UserAvatar from '../components/UserAvatar';

const UserSearchActionIcon = ({ type }) => {
  const paths = {
    profile: (
      <>
        <path
          d="M12 12.4a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4.8 20a7.2 7.2 0 0 1 14.4 0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </>
    ),
    message: (
      <path
        d="M5 6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v5.4a2.8 2.8 0 0 1-2.8 2.8H10l-4.2 3v-3.3A2.8 2.8 0 0 1 5 12.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    )
  };

  return (
    <span aria-hidden="true" className="user-search-action-icon">
      <svg viewBox="0 0 24 24" focusable="false">
        {paths[type]}
      </svg>
    </span>
  );
};

const BrowsePage = ({ notes, users, currentUser, onToggleLike, onDelete, onEdit }) => {
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!query.trim()) {
      return notes;
    }

    return notes.filter((note) =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.subject.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );
  }, [notes, query]);

  const matchingUsers = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();

    return users.filter((user) => {
      if (user.id === currentUser.id) {
        return false;
      }

      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.course.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [currentUser.id, query, users]);

  useEffect(() => {
    if (!notes.length) {
      setQuery('');
    }
  }, [notes]);

  return (
    <div className="page browse-page">
      <h1>Browse Approved Notes</h1>
      <div className="upload-subtitle">
        <p>{filteredNotes.length} notes found</p>
        <p>Only notes approved by the admin are visible here.</p>
      </div>
      <SearchBar onSearch={setQuery} />

      {matchingUsers.length > 0 && (
        <section className="user-search-section">
          <div className="upload-subtitle">
            <p>{matchingUsers.length} matching user account(s)</p>
            <p>Open a public profile or view someone&apos;s shared notes from there.</p>
          </div>
          <div className="user-search-list">
            {matchingUsers.map((user) => (
              <article key={user.id} className="user-search-card">
                <UserAvatar user={user} size="md" />
                <div className="user-search-card-copy">
                  <strong>{user.name}</strong>
                  <p>{user.role === 'admin' ? 'Admin' : user.course || 'Student'}</p>
                  <small>{user.profileVisibility === 'public' ? 'Public profile' : 'Private profile with public notes'}</small>
                </div>
                <div className="user-search-card-actions">
                  <Link to={`/users/${user.id}`} className="card-link-button user-search-action-button" aria-label={`View ${user.name}'s profile`}>
                    <UserSearchActionIcon type="profile" />
                    <span className="user-search-action-label">View profile</span>
                  </Link>
                  <Link to={`/messages?user=${user.id}`} className="card-link-button user-search-action-button" aria-label={`Message ${user.name}`}>
                    <UserSearchActionIcon type="message" />
                    <span className="user-search-action-label">Message</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {filteredNotes.length > 0 ? (
        <NoteList
          notes={filteredNotes}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ) : (
        <p>No approved notes match your search right now.</p>
      )}
    </div>
  );
};

export default BrowsePage;
