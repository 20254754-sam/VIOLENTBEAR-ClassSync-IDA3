import React from 'react';
import { Link } from 'react-router-dom';
import NoteList from '../components/NoteList';

const HomePage = ({ notes }) => {
  const recentNotes = notes.slice(-3);

  return (
    <div className="page">
      <section className="hero">
        <h1>🕮 Share & Study Together</h1>
        <p>Access class notes from students across all subjects</p>
      </section>
      <section>
        <h2>Recent Notes ({recentNotes.length})</h2>
        {recentNotes.length > 0 ? (
          <NoteList notes={recentNotes} />
        ) : (
          <p>No recent notes yet. <Link to="/upload">Be the first to upload!</Link></p>
        )}
      </section>
    </div>
  );
};

export default HomePage;
