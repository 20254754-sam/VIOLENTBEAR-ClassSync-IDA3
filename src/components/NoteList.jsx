import React from 'react';
import NoteCard from './NoteCard';

const NoteList = ({
  notes,
  currentUser,
  onToggleLike,
  onDelete,
  onEdit,
  showStatus = false,
  detailPathBuilder,
  editPathBuilder
}) => {
  return (
    <div className="note-list">
      {notes.map((note) => (
        <div key={note.id} className="note-item">
          <NoteCard
            note={note}
            currentUser={currentUser}
            onToggleLike={onToggleLike}
            onDelete={onDelete}
            onEdit={onEdit}
            showStatus={showStatus}
            detailPath={detailPathBuilder ? detailPathBuilder(note) : undefined}
            editPath={editPathBuilder ? editPathBuilder(note) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default NoteList;
