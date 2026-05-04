import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AttachmentGallery from '../components/AttachmentGallery';
import UserAvatar from '../components/UserAvatar';

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6 3.5a1 1 0 0 1 1 1v.8h9.05a1.75 1.75 0 0 1 1.52 2.62l-1.44 2.46 1.44 2.46a1.75 1.75 0 0 1-1.52 2.62H7V20a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1m1 3.8v5.6h9.05l-1.73-2.95a1 1 0 0 1 0-1.01l1.73-2.94z"
      fill="currentColor"
    />
  </svg>
);

const DetailActionIcon = ({ type }) => {
  const paths = {
    like: (
      <path
        d="M12 20.2 5.4 13.9a4.1 4.1 0 0 1-.25-5.75 3.7 3.7 0 0 1 5.45.08L12 9.7l1.4-1.47a3.7 3.7 0 0 1 5.45-.08 4.1 4.1 0 0 1-.25 5.75z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ),
    edit: (
      <path
        d="m4.5 16.8-.5 3.2 3.2-.5L18.8 7.9a2.1 2.1 0 0 0-3-3zM14.6 6.1l3.3 3.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ),
    delete: (
      <path
        d="M5.5 7h13M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7m2.1 0-.7 12a1.6 1.6 0 0 1-1.6 1.5H9.2a1.6 1.6 0 0 1-1.6-1.5L6.9 7m3.1 3.2v6.2m4-6.2v6.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    )
  };

  return (
    <span aria-hidden="true" className="detail-action-icon">
      <svg viewBox="0 0 24 24" focusable="false">
        {paths[type]}
      </svg>
    </span>
  );
};

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const RoomNoteDetailsPage = ({
  notes,
  rooms,
  users,
  currentUser,
  onToggleLike,
  onDelete,
  onEdit,
  onSubmitReview,
  onReport
}) => {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const note = notes.find((item) => item.id === Number(id) && item.roomId === roomId);
  const room = rooms.find((item) => item.id === roomId);
  const [reviewForm, setReviewForm] = useState({ rating: '5', text: '' });
  const ratingOptions = [1, 2, 3, 4, 5];

  const hasSource = note?.isOwnWork === false && note?.source;
  const isUploader = note && currentUser && note.uploaderId === currentUser.id;
  const liked = note && currentUser ? note.likes.includes(currentUser.id) : false;
  const uploader = users.find((user) => user.id === note?.uploaderId) || null;
  const storedBackRoute = sessionStorage.getItem('classsync-note-return-route');
  const backTo = storedBackRoute || `/rooms/${roomId}`;

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
        <Link to={backTo} className="back-btn-small" aria-label="Back to room">
          <span aria-hidden="true" className="back-btn-icon" />
          <span className="back-btn-label">Back</span>
        </Link>
        <div className="note-title-info">
          <div className="note-badge-row">
            <div className="note-badge-row-copy">
              <span className={`ownership-badge ${hasSource ? 'ownership-badge-referenced' : 'ownership-badge-original'}`}>
                {hasSource ? 'Referenced material' : 'Original work'}
              </span>
              <span className="status-pill status-neutral">Private room note</span>
            </div>
            {!isUploader && currentUser.role !== 'admin' && (
              <button
                type="button"
                className="report-icon-button"
                aria-label={`Report note: ${note.title}`}
                onClick={() =>
                  onReport({
                    targetId: note.id,
                    targetType: 'note',
                    targetTitle: note.title,
                    roomId
                  })
                }
              >
                <ReportIcon />
              </button>
            )}
          </div>
          <h1>{note.title}</h1>
          <div className="note-info">
            <span className="subject">{note.subject}</span>
            <span className="author-date">
              Uploaded by {note.uploaderName} on {formatDate(note.updatedAt || note.createdAt)}
            </span>
          </div>
          {uploader && (
            <Link to={uploader.id === currentUser.id ? '/profile' : `/users/${uploader.id}`} className="note-uploader-link">
              <UserAvatar user={uploader} size="sm" />
              <span>Open {uploader.name}&apos;s profile</span>
            </Link>
          )}
        </div>
      </div>

      <div className="detail-toolbar">
        <button
          type="button"
          className={`card-action-button detail-icon-button ${liked ? 'card-action-button-active' : ''}`}
          onClick={() => onToggleLike(note.id)}
          aria-label={`${liked ? 'Unlike' : 'Like'} note`}
        >
          <DetailActionIcon type="like" />
          <span className="detail-action-label">{liked ? 'Unlike' : 'Like'}</span>
          <span className="detail-action-count">{note.likes.length}</span>
        </button>
        {isUploader && (
          <button
            type="button"
            className="card-link-button detail-icon-button"
            onClick={() => {
              onEdit(note.id);
              navigate(`/rooms/${roomId}`);
            }}
            aria-label="Edit note"
          >
            <DetailActionIcon type="edit" />
            <span className="detail-action-label">Edit note</span>
          </button>
        )}
        {(isUploader || currentUser.role === 'admin') && (
          <button
            type="button"
            className="card-link-button card-link-button-danger detail-icon-button"
            onClick={() =>
              onDelete(note.id, {
                onSuccess: () => navigate(`/rooms/${roomId}`)
              })
            }
            aria-label="Delete note"
          >
            <DetailActionIcon type="delete" />
            <span className="detail-action-label">Delete note</span>
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
          <AttachmentGallery attachments={note.attachments} />
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
