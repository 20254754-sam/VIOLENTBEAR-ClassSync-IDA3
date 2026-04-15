import React from 'react';
import { useParams, Link } from 'react-router-dom';

const NoteDetailsPage = ({ notes }) => {
  const { id } = useParams();
  const note = notes.find(n => n.id === parseInt(id));

  if (!note) {
    return (
      <div className="page">
        <h1>❌ Note Not Found</h1>
        <Link to="/browse" className="back-btn">← Back to Browse</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="note-header">
        <Link to="/browse" className="back-btn-small">←</Link>
        <div className="note-title-info">
          <h1>{note.title}</h1>
          <div className="note-info">
            <span className="subject">{note.subject}</span>
            <span className="author-date">
              👤 {note.author} • 📅 {note.date}
            </span>
          </div>
        </div>
      </div>
      <div className="note-content">
        <div className="content-wrapper">
          <p>{note.content}</p>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailsPage;