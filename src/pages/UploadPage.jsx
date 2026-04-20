import React from 'react';
import UploadForm from '../components/UploadForm';

const UploadPage = ({ notes, setNotes }) => {
  const handleSubmit = (newNote) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  return (
    <div className="page">
      <h1>Upload New Note</h1>
      <div className="upload-subtitle">
        <p>Share your class notes with other students</p>
      </div>
      <UploadForm notes={notes} onSubmit={handleSubmit} />
    </div>
  );
};

export default UploadPage;
