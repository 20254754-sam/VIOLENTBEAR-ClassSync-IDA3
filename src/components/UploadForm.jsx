import React, { useState, useCallback } from 'react';

const UploadForm = ({ onSubmit, notes = [] }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Web Development');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [content, setContent] = useState('');

  const subjects = [
    'Web Development', 'Mobile App Dev', 'Database Systems', 
    'Data Structures', 'Algorithms', 'Software Engineering',
    'Networking', 'Cybersecurity', 'AI & Machine Learning',
    'Cloud Computing', 'Java Programming', 'Python Programming',
    'C++ Programming', 'Operating Systems', 'Computer Graphics'
  ];

  // SMOOTH HANDLER - useCallback prevents lag
  const handleSubjectChange = useCallback((e) => {
    const value = e.target.value;
    setSubject(value);
    setShowCustom(value === 'custom');
    if (value !== 'custom') {
      setCustomSubject('');
    }
  }, []);

  const handleCustomSubject = useCallback((e) => {
    setCustomSubject(e.target.value);
    setSubject(e.target.value);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim())) {
      alert('Please fill title and content');
      return;
    }
    
    const finalSubject = showCustom ? customSubject.trim() : subject;
    if (showCustom && !finalSubject) {
      alert('Please enter a custom subject');
      return;
    }
    
    const newNote = {
      id: notes.length + 1,
      title: title.trim(),
      subject: finalSubject,
      content: content.trim(),
      author: 'You',
      date: new Date().toISOString().split('T')[0]
    };
    onSubmit(newNote);
    // Reset form smoothly
    setTitle('');
    setContent('');
    setShowCustom(false);
    setCustomSubject('');
    setSubject('Web Development');
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className="form-group">
        <label>📄 Title:</label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g., React Hooks Summary, Binary Trees..."
          required 
        />
      </div>
      
      <div className="form-group">
        <label>🎓 Subject:</label>
        <div className="subject-wrapper">
          <select 
            value={subject} 
            onChange={handleSubjectChange}
            className="smooth-select"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
            <option value="custom">➕ Custom Subject...</option>
          </select>
          
          {showCustom && (
            <input
              className="custom-subject-input"
              value={customSubject}
              onChange={handleCustomSubject}
              placeholder="e.g., Web Design, Discrete Math..."
              autoFocus
            />
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label>📖 Content:</label>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          rows="10" 
          placeholder="Write detailed notes, code examples, formulas... 
Help your IT classmates ace their exams! 💪✨"
          required 
        />
      </div>
      
      <button type="submit">
        🚀 Share with Classmates 
        <span className="note-counter">({notes.length + 1})</span>
      </button>
    </form>
  );
};

export default UploadForm;