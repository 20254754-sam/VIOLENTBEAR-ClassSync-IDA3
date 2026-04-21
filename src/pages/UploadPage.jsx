import React from 'react';
import UploadForm from '../components/UploadForm';

const UploadPage = ({ notes, currentUser, editingNote, onSubmit, onCancelEdit }) => {
  return (
    <div className="page">
      <h1>{editingNote ? 'Update Note' : 'Upload New Note'}</h1>
      <div className="upload-subtitle">
        <p>{editingNote ? 'Refine your note before resubmitting it' : 'Share your class notes with other students'}</p>
        <p>
          {currentUser.role === 'admin'
            ? 'Admin uploads are published immediately.'
            : 'Student uploads go to the admin first before they become public.'}
        </p>
      </div>
      <UploadForm
        notes={notes}
        editingNote={editingNote}
        onSubmit={onSubmit}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
};

export default UploadPage;
