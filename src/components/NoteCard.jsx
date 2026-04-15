import { Link } from 'react-router-dom';

const NoteCard = ({ note }) => {
  return (
    <Link to={`/note/${note.id}`} className="note-card">
      <div className="note-card-inner">
        <h3>{note.title}</h3>
        <span className="subject">{note.subject}</span>
        <p className="preview">{note.content.substring(0, 80)}...</p>
        <div className="note-meta">
          <span>👤 {note.author}</span>
          <span>📅 {note.date}</span>
        </div>
      </div>
    </Link>
  )
}

export default NoteCard;