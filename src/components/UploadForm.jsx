import React, { useEffect, useMemo, useState } from 'react';

const SUBJECTS = [
  'Web Development',
  'Mobile App Development',
  'Database Systems',
  'Data Structures',
  'Algorithms',
  'Software Engineering',
  'Networking',
  'Cybersecurity',
  'Artificial Intelligence',
  'Cloud Computing',
  'Java Programming',
  'Python Programming',
  'Operating Systems'
];

const emptyForm = {
  title: '',
  subject: 'Web Development',
  customSubject: '',
  useCustomSubject: false,
  content: '',
  isOwnWork: '',
  sourceType: '',
  sourceTitle: '',
  sourceAuthor: '',
  sourceLink: '',
  sourceYear: ''
};

const UploadForm = ({ onSubmit, editingNote, onCancelEdit }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (editingNote) {
      setForm({
        title: editingNote.title,
        subject: editingNote.subject,
        customSubject: '',
        useCustomSubject: !SUBJECTS.includes(editingNote.subject),
        content: editingNote.content,
        isOwnWork: editingNote.isOwnWork ? 'yes' : 'no',
        sourceType: editingNote.source?.type || '',
        sourceTitle: editingNote.source?.title || '',
        sourceAuthor: editingNote.source?.author || '',
        sourceLink: editingNote.source?.link || '',
        sourceYear: editingNote.source?.year || ''
      });
      setErrors({});
      setSubmitted(false);
      return;
    }

    setForm(emptyForm);
    setErrors({});
    setSubmitted(false);
  }, [editingNote]);

  const finalSubject = useMemo(
    () => (form.useCustomSubject ? form.customSubject.trim() : form.subject),
    [form.customSubject, form.subject, form.useCustomSubject]
  );

  const validateForm = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!finalSubject.trim()) {
      nextErrors.subject = 'Subject is required.';
    }

    if (!form.content.trim()) {
      nextErrors.content = 'Content is required.';
    }

    if (!form.isOwnWork) {
      nextErrors.isOwnWork = 'Please tell us if this note is your own work.';
    }

    if (form.isOwnWork === 'no') {
      if (!form.sourceType.trim()) {
        nextErrors.sourceType = 'Source type is required.';
      }

      if (!form.sourceTitle.trim()) {
        nextErrors.sourceTitle = 'Source title is required.';
      }

      if (form.sourceType === 'Website' && !form.sourceLink.trim()) {
        nextErrors.sourceLink = 'Please provide the source link.';
      }
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubjectChange = (event) => {
    const value = event.target.value;
    setForm((currentForm) => ({
      ...currentForm,
      subject: value,
      useCustomSubject: value === 'custom',
      customSubject: value === 'custom' ? currentForm.customSubject : ''
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = onSubmit({
      title: form.title.trim(),
      subject: finalSubject,
      content: form.content.trim(),
      isOwnWork: form.isOwnWork === 'yes',
      source:
        form.isOwnWork === 'no'
          ? {
              type: form.sourceType,
              title: form.sourceTitle.trim(),
              author: form.sourceAuthor.trim(),
              link: form.sourceLink.trim(),
              year: form.sourceYear.trim()
            }
          : null
    });

    if (!result.success) {
      return;
    }

    setPopupMessage(result.message);
    setForm(emptyForm);
    setErrors({});
    setSubmitted(false);
  };

  const fieldClassName = (fieldName) =>
    submitted && errors[fieldName] ? 'form-control field-error' : 'form-control';

  return (
    <>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            className={fieldClassName('title')}
            value={form.title}
            onChange={handleChange}
            placeholder="Enter your note title"
          />
          {submitted && errors.title && <p className="field-error-text">{errors.title}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            className={fieldClassName('subject')}
            value={form.useCustomSubject ? 'custom' : form.subject}
            onChange={handleSubjectChange}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
            <option value="custom">Custom subject</option>
          </select>
          {form.useCustomSubject && (
            <input
              name="customSubject"
              className={fieldClassName('subject')}
              value={form.customSubject}
              onChange={handleChange}
              placeholder="Type your custom subject"
            />
          )}
          {submitted && errors.subject && <p className="field-error-text">{errors.subject}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            className={fieldClassName('content')}
            value={form.content}
            onChange={handleChange}
            rows="10"
            placeholder="Paste or type the note content here"
          />
          {submitted && errors.content && <p className="field-error-text">{errors.content}</p>}
        </div>

        <div className="form-group">
          <label>Is this your own work?</label>
          <div className={`radio-group ${submitted && errors.isOwnWork ? 'radio-group-error' : ''}`}>
            <label className="radio-option">
              <input
                type="radio"
                name="isOwnWork"
                value="yes"
                checked={form.isOwnWork === 'yes'}
                onChange={handleChange}
              />
              <span>Yes</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="isOwnWork"
                value="no"
                checked={form.isOwnWork === 'no'}
                onChange={handleChange}
              />
              <span>No</span>
            </label>
          </div>
          {submitted && errors.isOwnWork && <p className="field-error-text">{errors.isOwnWork}</p>}
        </div>

        {form.isOwnWork === 'no' && (
          <div className="source-section">
            <h4>Source information</h4>

            <div className="form-group">
              <label htmlFor="sourceType">Source Type</label>
              <select
                id="sourceType"
                name="sourceType"
                className={fieldClassName('sourceType')}
                value={form.sourceType}
                onChange={handleChange}
              >
                <option value="">Select source type</option>
                <option value="Book">Book</option>
                <option value="Website">Website</option>
                <option value="Lecture">Lecture</option>
                <option value="Personal Notes">Personal Notes</option>
                <option value="Other">Other</option>
              </select>
              {submitted && errors.sourceType && <p className="field-error-text">{errors.sourceType}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="sourceTitle">Source Title</label>
              <input
                id="sourceTitle"
                name="sourceTitle"
                className={fieldClassName('sourceTitle')}
                value={form.sourceTitle}
                onChange={handleChange}
                placeholder="Enter the title of the reference"
              />
              {submitted && errors.sourceTitle && <p className="field-error-text">{errors.sourceTitle}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="sourceAuthor">Author</label>
              <input
                id="sourceAuthor"
                name="sourceAuthor"
                className="form-control"
                value={form.sourceAuthor}
                onChange={handleChange}
                placeholder="Optional author name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sourceLink">Link</label>
              <input
                id="sourceLink"
                name="sourceLink"
                className={fieldClassName('sourceLink')}
                value={form.sourceLink}
                onChange={handleChange}
                placeholder="Optional source link"
              />
              {submitted && errors.sourceLink && <p className="field-error-text">{errors.sourceLink}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="sourceYear">Year</label>
              <input
                id="sourceYear"
                name="sourceYear"
                className="form-control"
                value={form.sourceYear}
                onChange={handleChange}
                placeholder="Optional year"
              />
            </div>
          </div>
        )}

        <div className="form-button-row">
          {editingNote && (
            <button type="button" className="secondary-button" onClick={onCancelEdit}>
              Cancel edit
            </button>
          )}
          <button type="submit">{editingNote ? 'Update Note' : 'Share with Classmates'}</button>
        </div>
      </form>

      {popupMessage && (
        <div className="upload-popup-overlay" onClick={() => setPopupMessage('')}>
          <div className="upload-popup" onClick={(event) => event.stopPropagation()}>
            <h3>{editingNote ? 'Note updated' : 'Submission received'}</h3>
            <p>{popupMessage}</p>
            <button type="button" className="upload-popup-button" onClick={() => setPopupMessage('')}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadForm;
