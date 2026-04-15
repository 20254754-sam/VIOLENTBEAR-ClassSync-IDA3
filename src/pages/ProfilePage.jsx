import React from 'react';
import { Link } from 'react-router-dom';  // ← ADD THIS
import NoteList from '../components/NoteList';

const ProfilePage = ({ notes }) => {
  const userNotes = notes.filter((_, index) => index < 2);

  return (
    <div className="page">
      <h1>👤 Your Profile</h1>
      <div className="profile-stats">
        <h3>You've uploaded {userNotes.length} notes</h3>
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