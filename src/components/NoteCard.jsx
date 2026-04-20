import { Link } from 'react-router-dom';

const NoteCard = ({ note }) => {
  const hasSource = note.isOwnWork === false && note.source;
  const ownershipLabel = hasSource ? 'Referenced Material' : 'Original Work';

  return (
    <Link to={`/note/${note.id}`} className="note-card">
      <div className="note-card-inner">
        <div className={`ownership-badge ${hasSource ? 'ownership-badge-referenced' : 'ownership-badge-original'}`}>
          {ownershipLabel}
        </div>

        <h3>{note.title}</h3>

        <span className="subject">{note.subject}</span>

        <p className="preview">
          {note.content.substring(0, 80)}...
        </p>

        {hasSource && (
          <div className="note-card-action">
            <span className="reference-button">View Reference</span>
          </div>
        )}

        <div className="note-meta">
          <span>{note.author}</span>
          <span>{note.date}</span>
        </div>
      </div>
    </Link>
  );
};

export default NoteCard;
