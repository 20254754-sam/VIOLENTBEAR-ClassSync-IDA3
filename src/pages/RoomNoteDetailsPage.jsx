import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const RoomNoteDetailsPage = ({ notes, rooms, currentUser, onToggleLike, onDelete, onEdit, onSubmitReview }) => {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const note = notes.find((item) => item.id === Number(id) && item.roomId === roomId);
  const room = rooms.find((item) => item.id === roomId);
  const [reviewForm, setReviewForm] = useState({ rating: '5', text: '' });
  const ratingOptions = [1, 2, 3, 4, 5];

  const hasSource = note?.isOwnWork === false && note?.source;
  const isUploader = note && currentUser && note.uploaderId === currentUser.id;
  const liked = note && currentUser ? note.likes.includes(currentUser.id) : false;

  const averageRating = useMemo(() => {
    if (!note || note.reviews.length === 0) {
      return null;
    }

    const total = note.reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return (total / note.reviews.length).toFixed(1);
  }, [note]);

  if (!note || !room) {
    return (
      <div className="page">
        <h1>Room note not found</h1>
        <Link to={`/rooms/${roomId}`} className="inline-link">Back to room</Link>
      </div>
    );
  }

  if (!room.memberIds.includes(currentUser.id)) {
    return (
      <div className="page">
        <h1>Private note</h1>
        <p>You need to join this room before you can open its private notes.</p>
        <Link to={`/rooms/${roomId}`} className="inline-link">Back to room</Link>
      </div>
    );
  }

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    if (!reviewForm.text.trim()) {
      return;
    }

    onSubmitReview(note.id, {
      rating: Number(reviewForm.rating),
      text: reviewForm.text.trim()
    });

    setReviewForm({ rating: '5', text: '' });
  };

  return (
    <div className="page">
      <div className="note-header">
        <Link to={`/rooms/${roomId}`} className="back-btn-small">Back</Link>
        <div className="note-title-info">
          <div className="note-badge-row">
            <span className={`ownership-badge ${hasSource ? 'ownership-badge-referenced' : 'ownership-badge-original'}`}>
              {hasSource ? 'Referenced material' : 'Original work'}
            </span>
            <span className="status-pill status-neutral">Private room note</span>
          </div>
          <h1>{note.title}</h1>
          <div className="note-info">
            <span className="subject">{note.subject}</span>
            <span className="author-date">
              Uploaded by {note.uploaderName} on {formatDate(note.updatedAt || note.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-toolbar">
        <button
          type="button"
          className={`card-action-button ${liked ? 'card-action-button-active' : ''}`}
          onClick={() => onToggleLike(note.id)}
        >
          {liked ? 'Unlike' : 'Like'} {note.likes.length}
        </button>
        {isUploader && (
          <button
            type="button"
            className="card-link-button"
            onClick={() => {
              onEdit(note.id);
              navigate(`/rooms/${roomId}`);
            }}
          >
            Edit note
          </button>
        )}
        {(isUploader || currentUser.role === 'admin') && (
          <button
            type="button"
            className="card-link-button card-link-button-danger"
            onClick={() =>
              onDelete(note.id, {
                onSuccess: () => navigate(`/rooms/${roomId}`)
              })
            }
          >
            Delete note
          </button>
        )}
      </div>

      {hasSource && (
        <section className="citation-panel">
          <h2>Reference Information</h2>
          <div className="citation-grid">
            <div className="citation-item">
              <span className="citation-label">Source Type</span>
              <p>{note.source.type}</p>
            </div>
            <div className="citation-item">
              <span className="citation-label">Source Title</span>
              <p>{note.source.title}</p>
            </div>
            {note.source.author && (
              <div className="citation-item">
                <span className="citation-label">Author</span>
                <p>{note.source.author}</p>
              </div>
            )}
            {note.source.year && (
              <div className="citation-item">
                <span className="citation-label">Year</span>
                <p>{note.source.year}</p>
              </div>
            )}
            {note.source.link && (
              <div className="citation-item citation-item-full">
                <span className="citation-label">Source Link</span>
                <a href={note.source.link} target="_blank" rel="noreferrer" className="citation-link">
                  <span>Open reference</span>
                  <span className="citation-link-icon" aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="note-content">
        <div className="content-wrapper">
          <p>{note.content}</p>
        </div>
      </div>

      {note.attachments?.length > 0 && (
        <section className="citation-panel">
          <h2>Attached Files</h2>
          <div className="attachment-view-list">
            {note.attachments.map((attachment) => (
              <article key={attachment.id} className="attachment-card">
                <div className="attachment-card-copy">
                  <strong>{attachment.name}</strong>
                  <small>{attachment.isImage ? 'Image attachment' : 'File attachment'}</small>
                </div>
                {attachment.isImage && (
                  <img src={attachment.url} alt={attachment.name} className="attachment-image-preview" />
                )}
                <a href={attachment.url} target="_blank" rel="noreferrer" className="attachment-view-button">
                  {attachment.isImage ? 'View image' : 'Open file'}
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="review-section">
        <div className="review-summary">
          <div>
            <h2>Reviews</h2>
            <p className="review-summary-text">{note.reviews.length} review(s)</p>
          </div>
          {averageRating && <div className="review-rating-chip">Average {averageRating} / 5</div>}
        </div>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <div className="review-form-row">
            <div className="star-rating-picker" aria-label="Choose your rating">
              {ratingOptions.map((ratingValue) => {
                const isActive = Number(reviewForm.rating) >= ratingValue;

                return (
                  <button
                    key={ratingValue}
                    type="button"
                    className={`star-rating-button ${isActive ? 'star-rating-button-active' : ''}`}
                    aria-label={`${ratingValue} star${ratingValue > 1 ? 's' : ''}`}
                    onClick={() =>
                      setReviewForm((currentForm) => ({
                        ...currentForm,
                        rating: String(ratingValue)
                      }))
                    }
                  >
                    ★
                  </button>
                );
              })}
              <span className="star-rating-value">{reviewForm.rating} / 5</span>
            </div>
            <textarea
              value={reviewForm.text}
              onChange={(event) => setReviewForm((currentForm) => ({ ...currentForm, text: event.target.value }))}
              placeholder="Share a quick review about this room note"
              rows="4"
            />
          </div>
          <button type="submit">Submit review</button>
        </form>

        <div className="review-list">
          {note.reviews.length > 0 ? (
            note.reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-card-header">
                  <strong>{review.userName}</strong>
                  <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                    {'★'.repeat(review.rating)}
                    <small>{review.rating} / 5</small>
                  </span>
                </div>
                <p>{review.text}</p>
                <small>{formatDate(review.createdAt)}</small>
              </article>
            ))
          ) : (
            <p>No reviews yet. Be the first to rate this room note.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default RoomNoteDetailsPage;
