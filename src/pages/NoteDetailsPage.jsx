import React from 'react';
import { useParams, Link } from 'react-router-dom';

const NoteDetailsPage = ({ notes }) => {
  const { id } = useParams();
  const note = notes.find((n) => n.id === parseInt(id, 10));
  const hasSource = note?.isOwnWork === false && note?.source;

  if (!note) {
    return (
      <div className="page">
        <h1>Note Not Found</h1>
        <Link to="/browse" className="back-btn">Back to Browse</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="note-header">
        <Link to="/browse" className="back-btn-small">Back</Link>
        <div className="note-title-info">
          <h1>{note.title}</h1>
          <div className="note-info">
            <span className="subject">{note.subject}</span>
            <span className="author-date">
              {note.author} • {note.date}
            </span>
          </div>
        </div>
      </div>

      {hasSource && (
        <section className="citation-panel">
          <h2>Reference Information</h2>
          <div className="citation-grid">
            <div className="citation-item">
              <span className="citation-label">Source Type</span>
              <p>{note.source.type}</p>
            </div>
            <div className="citation-item">
              <span className="citation-label">Source Title</span>
              <p>{note.source.title}</p>
            </div>
            {note.source.author && (
              <div className="citation-item">
                <span className="citation-label">Author</span>
                <p>{note.source.author}</p>
              </div>
            )}
            {note.source.year && (
              <div className="citation-item">
                <span className="citation-label">Year</span>
                <p>{note.source.year}</p>
              </div>
            )}
            {note.source.link && (
              <div className="citation-item citation-item-full">
                <span className="citation-label">Source Link</span>
                <a href={note.source.link} target="_blank" rel="noreferrer" className="citation-link">
                  Open source reference
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="note-content">
        <div className="content-wrapper">
          <p>{note.content}</p>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailsPage;
