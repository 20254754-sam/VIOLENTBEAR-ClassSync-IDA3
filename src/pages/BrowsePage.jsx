import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const browseFilters = useMemo(() => {
    const subjects = [...new Set(notes.map((note) => note.subject).filter(Boolean))].slice(0, 5);
    const courses = [...new Set(users.map((user) => user.course).filter(Boolean))].slice(0, 4);

    return ['All', ...subjects, ...courses.filter((course) => !subjects.includes(course))];
  }, [notes, users]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter === 'All' ? '' : activeFilter.toLowerCase();

    return notes.filter((note) =>
      (!normalizedFilter || note.subject.toLowerCase() === normalizedFilter) &&
      (!normalizedQuery ||
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.subject.toLowerCase().includes(normalizedQuery) ||
        note.content.toLowerCase().includes(normalizedQuery))
    );
  }, [activeFilter, notes, query]);

  const matchingUsers = useMemo(() => {
    if (!query.trim() && activeFilter === 'All') {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter === 'All' ? '' : activeFilter.toLowerCase();

    return users.filter((user) => {
      if (user.id === currentUser.id) {
        return false;
      }

      return (
        (!normalizedFilter || user.course.toLowerCase() === normalizedFilter) &&
        (!normalizedQuery ||
          user.name.toLowerCase().includes(normalizedQuery) ||
          user.email.toLowerCase().includes(normalizedQuery) ||
          user.course.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [activeFilter, currentUser.id, query, users]);

  const resetBrowseSearch = () => {
    setQuery('');
    setActiveFilter('All');
  };

  useEffect(() => {
    if (!notes.length) {
      setQuery('');
      setActiveFilter('All');
    }
  }, [notes]);

  return (
    <div className="page browse-page">
      <h1>Browse Approved Notes</h1>
      <div className="upload-subtitle">
        <p>{filteredNotes.length} notes found</p>
        <p>Only notes approved by the admin are visible here.</p>
      </div>
      <SearchBar
        value={query}
        onSearch={setQuery}
        onClear={resetBrowseSearch}
        placeholder="Search notes or users"
        sticky
      />

      <div className="browse-filter-row" aria-label="Browse filters">
        {browseFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`browse-filter-chip ${activeFilter === filter ? 'browse-filter-chip-active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

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
                </div>
                <div className="user-search-card-actions">
                  <Link
                    to={`/users/${user.id}`}
                    state={{ from: `${location.pathname}${location.search}` }}
                    className="card-link-button user-search-action-button"
                    aria-label={`View ${user.name}'s profile`}
                    onClick={() =>
                      sessionStorage.setItem('classsync-profile-return-route', `${location.pathname}${location.search}`)
                    }
                  >
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
        <div className="profile-empty-state browse-empty-state">
          <h3>No notes found</h3>
          <p>Try a different keyword, clear the filter, or browse all approved notes again.</p>
          <button type="button" className="secondary-button" onClick={resetBrowseSearch}>
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowsePage;
