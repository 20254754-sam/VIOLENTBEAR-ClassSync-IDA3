import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RoomsPage = ({ currentUser, rooms, onCreateRoom, onJoinRoom, getRoomLink }) => {
  const navigate = useNavigate();
  const [createForm, setCreateForm] = useState({
    name: '',
    subject: '',
    description: ''
  });
  const [joinCode, setJoinCode] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleCreateSubmit = (event) => {
    event.preventDefault();

    if (!createForm.name.trim() || !createForm.subject.trim()) {
      setFeedback('Please add a room name and subject before creating a room.');
      return;
    }

    const result = onCreateRoom(createForm);
    setFeedback(result.message);

    if (result.success) {
      setCreateForm({
        name: '',
        subject: '',
        description: ''
      });
      navigate(`/rooms/${result.room.id}`);
    }
  };

  const handleJoinSubmit = (event) => {
    event.preventDefault();

    if (!joinCode.trim()) {
      setFeedback('Enter a room code to join a classroom.');
      return;
    }

    const result = onJoinRoom({ code: joinCode });
    setFeedback(result.message);

    if (result.success) {
      setJoinCode('');
      navigate(`/rooms/${result.room.id}`);
    }
  };

  const copyValue = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback('Copy failed on this device, but you can still copy the text manually.');
    }
  };

  return (
    <div className="page">
      <h1>Classrooms</h1>
      <div className="upload-subtitle">
        <p>Create a room for your class or join one with a shared invite.</p>
        <p>Use a link or a unique classroom code, similar to a study group invite.</p>
      </div>

      <div className="rooms-shell">
        <section className="rooms-panel">
          <div className="rooms-panel-header">
            <span className="dashboard-strip-label">Create room</span>
            <h2>Start a classroom space</h2>
            <p>Create a room for one subject, one section, or one study circle.</p>
          </div>

          <form className="rooms-form" onSubmit={handleCreateSubmit}>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Room name"
            />
            <input
              value={createForm.subject}
              onChange={(event) => setCreateForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject or section"
            />
            <textarea
              rows="4"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Short description of the room"
            />
            <button type="submit">Create room</button>
          </form>
        </section>

        <section className="rooms-panel">
          <div className="rooms-panel-header">
            <span className="dashboard-strip-label">Join room</span>
            <h2>Enter a classroom code</h2>
            <p>If a classmate shared a code with you, paste it here to join quickly.</p>
          </div>

          <form className="rooms-form" onSubmit={handleJoinSubmit}>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Enter room code"
            />
            <button type="submit">Join with code</button>
          </form>

          <div className="rooms-tip-card">
            <strong>{currentUser.name}</strong>
            <p>Your rooms and invite links are shared through the published ClassSync database.</p>
          </div>
        </section>
      </div>

      {feedback && <div className="rooms-feedback">{feedback}</div>}

      <section className="rooms-list-section">
        <div className="rooms-list-header">
          <h2>Your rooms</h2>
          <p>{rooms.length} room(s) joined</p>
        </div>

        {rooms.length > 0 ? (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <article key={room.id} className="room-card">
                <div className="room-card-top">
                  <span className="status-pill status-neutral">{room.subject}</span>
                  <span className="ownership-badge ownership-badge-original">{room.code}</span>
                </div>
                <h3>{room.name}</h3>
                <p>{room.description || 'No description yet. Use this room for group notes and class invites.'}</p>
                <div className="room-card-meta">
                  <small>Created by {room.ownerName}</small>
                  <small>{room.memberIds.length} member(s)</small>
                </div>
                <div className="room-card-actions">
                  <Link to={`/rooms/${room.id}`} className="card-link-button">
                    Open room
                  </Link>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => copyValue(getRoomLink(room), 'Room link copied to your clipboard.')}
                  >
                    Copy invite link
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-empty-state">
            <h3>No rooms joined yet</h3>
            <p>Create your first room above or ask a classmate for a room code or invite link.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RoomsPage;
