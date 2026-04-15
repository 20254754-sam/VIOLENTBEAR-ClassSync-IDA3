import React from 'react';
import NoteCard from './NoteCard';

const NoteList = ({ notes }) => {
  return (
    <div className="note-list">
      {notes.map(note => (
        <div key={note.id} className="note-item">
          <NoteCard note={note} />
        </div>
      ))}
    </div>
  );
};

export default NoteList;