import React from 'react';
import { Link } from 'react-router-dom';
import NoteList from '../components/NoteList';

const ProfilePage = ({ notes }) => {
  const userNotes = notes.filter((note) => note.author === 'You').reverse();

  return (
    <div className="page">
      <h1>Your Profile</h1>
      <div className="upload-subtitle">
        <p>You've uploaded {userNotes.length} notes</p>
        <p>Help more students by uploading new notes!</p>
      </div>
      <h2>Your Notes</h2>
      {userNotes.length > 0 ? (
        <NoteList notes={userNotes} />
      ) : (
        <p>No notes yet. <Link to="/upload">Upload your first note!</Link></p>
      )}
    </div>
  );
};

export default ProfilePage;
