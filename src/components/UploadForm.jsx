import React, { useState, useCallback } from 'react';

const UploadForm = ({ onSubmit, notes = [] }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Web Development');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [content, setContent] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [isOwnWork, setIsOwnWork] = useState(null);
  const [sourceType, setSourceType] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [link, setLink] = useState('');
  const [year, setYear] = useState('');

  const subjects = [
    'Web Development', 'Mobile App Dev', 'Database Systems',
    'Data Structures', 'Algorithms', 'Software Engineering',
    'Networking', 'Cybersecurity', 'AI & Machine Learning',
    'Cloud Computing', 'Java Programming', 'Python Programming',
    'C++ Programming', 'Operating Systems', 'Computer Graphics'
  ];

  const handleSubjectChange = useCallback((e) => {
    const value = e.target.value;
    setSubject(value);
    setShowCustom(value === 'custom');
    if (value !== 'custom') setCustomSubject('');
  }, []);

  const handleCustomSubject = useCallback((e) => {
    setCustomSubject(e.target.value);
    setSubject(e.target.value);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('Please fill title and content');
      return;
    }

    if (isOwnWork === null) {
      alert('Please select if this is your own work');
      return;
    }

    if (!isOwnWork) {
      if (!sourceType || !sourceTitle.trim()) {
        alert('Please provide source details');
        return;
      }

      if (sourceType === 'Website' && !link.trim()) {
        alert('Please provide a link for website sources');
        return;
      }
    }

    const finalSubject = showCustom ? customSubject.trim() : subject;

    const newNote = {
      id: notes.length + 1,
      title: title.trim(),
      subject: finalSubject,
      content: content.trim(),
      author: 'You',
      date: new Date().toISOString().split('T')[0],
      isOwnWork,
      source: !isOwnWork ? {
        type: sourceType,
        title: sourceTitle,
        author,
        link,
        year
      } : null
    };

    onSubmit(newNote);

    setTitle('');
    setContent('');
    setShowCustom(false);
    setCustomSubject('');
    setSubject('Web Development');
    setIsOwnWork(null);
    setSourceType('');
    setSourceTitle('');
    setAuthor('');
    setLink('');
    setYear('');
    setShowSuccessPopup(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Subject:</label>
          <div className="subject-wrapper">
            <select value={subject} onChange={handleSubjectChange}>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="custom">Custom...</option>
            </select>

            {showCustom && (
              <input
                value={customSubject}
                onChange={handleCustomSubject}
                placeholder="Enter subject"
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="10"
            required
          />
        </div>

        <div className="form-group">
          <label>Is this your own work?</label>
          <div>
            <label>
              <input
                type="radio"
                name="ownership"
                checked={isOwnWork === true}
                onChange={() => setIsOwnWork(true)}
              />
              Yes
            </label>

            <label style={{ marginLeft: '15px' }}>
              <input
                type="radio"
                name="ownership"
                checked={isOwnWork === false}
                onChange={() => setIsOwnWork(false)}
              />
              No
            </label>
          </div>
        </div>

        {isOwnWork === false && (
          <div className="source-section">
            <h4>Source Information</h4>

            <div className="form-group">
              <label>Source Type:</label>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="">Select Source</option>
                <option value="Book">Book</option>
                <option value="Website">Website</option>
                <option value="Lecture">Lecture</option>
                <option value="Personal">Personal Notes</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Source Title:</label>
              <input
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Author:</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Link:</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Year:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
        )}

        <button type="submit">
          Share with Classmates ({notes.length + 1})
        </button>
      </form>

      {showSuccessPopup && (
        <div className="upload-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
          <div className="upload-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Note uploaded successfully</h3>
            <p>Your note is now available in Browse and Profile.</p>
            <button
              type="button"
              className="upload-popup-button"
              onClick={() => setShowSuccessPopup(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadForm;
