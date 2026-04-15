import React, { useState } from 'react';
import { Link } from 'react-router-dom';  // ← ADD THIS
import SearchBar from '../components/SearchBar';
import NoteList from '../components/NoteList';

const BrowsePage = ({ notes }) => {
  const [filteredNotes, setFilteredNotes] = useState(notes);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.subject.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredNotes(filtered);
  };

  return (
    <div className="page">
      <h1>🔍 Browse All Notes</h1>
      <SearchBar onSearch={handleSearch} />
      
      <div className="filters">
        <p>{filteredNotes.length} notes found</p>
      </div>
      
      {filteredNotes.length > 0 ? (
        <NoteList notes={filteredNotes} />
      ) : (
        <p>No notes match your search. <Link to="/upload">Upload one!</Link></p>
      )}
    </div>
  );
};

export default BrowsePage;