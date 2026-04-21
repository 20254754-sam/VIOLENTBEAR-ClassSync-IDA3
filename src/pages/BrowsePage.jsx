import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import NoteList from '../components/NoteList';

const BrowsePage = ({ notes, currentUser, onToggleLike, onDelete, onEdit }) => {
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

  useEffect(() => {
    if (!notes.length) {
      setQuery('');
    }
  }, [notes]);

  return (
    <div className="page">
      <h1>Browse Approved Notes</h1>
      <div className="upload-subtitle">
        <p>{filteredNotes.length} notes found</p>
        <p>Only notes approved by the admin are visible here.</p>
      </div>
      <SearchBar onSearch={setQuery} />

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
