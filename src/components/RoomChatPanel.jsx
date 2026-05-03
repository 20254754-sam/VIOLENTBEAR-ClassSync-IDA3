import React, { useEffect, useMemo, useState } from 'react';

const formatMessageTime = (dateValue) =>
  new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const RoomChatPanel = ({ room, currentUser, messages, onSendRoomMessage, onMarkRoomMessagesRead }) => {
  const [draft, setDraft] = useState('');
  const threadRef = React.useRef(null);

  const roomMessages = useMemo(
    () =>
      messages
        .filter((message) => message.type === 'room' && message.roomId === room.id)
        .sort((firstMessage, secondMessage) => new Date(firstMessage.createdAt) - new Date(secondMessage.createdAt)),
    [messages, room.id]
  );

  useEffect(() => {
    onMarkRoomMessagesRead(room.id);
  }, [onMarkRoomMessagesRead, room.id]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [roomMessages]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = onSendRoomMessage(room.id, draft);

    if (result.success) {
      setDraft('');
    }
  };

  return (
    <section className="rooms-list-section">
      <div className="rooms-list-header">
        <h2>Room chat</h2>
        <p>Use this shared thread like a private classroom messenger for everyone inside the room.</p>
      </div>

      <div className="room-chat-card">
        <div className="room-chat-summary">
          <article className="room-chat-summary-chip">
            <strong>{roomMessages.length}</strong>
            <span>Total messages</span>
          </article>
          <article className="room-chat-summary-chip">
            <strong>{room.memberIds.length}</strong>
            <span>Room members</span>
          </article>
        </div>

        <div className="room-chat-thread" ref={threadRef}>
          {roomMessages.length > 0 ? (
            roomMessages.map((message) => {
              const isOwnMessage = message.senderId === currentUser.id;

              return (
                <article
                  key={message.id}
                  className={`message-bubble ${isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'}`}
                >
                  <strong>{isOwnMessage ? 'You' : message.senderName}</strong>
                  <p>{message.text}</p>
                  <small>{formatMessageTime(message.createdAt)}</small>
                </article>
              );
            })
          ) : (
            <div className="profile-empty-state messages-empty-thread">
              <h3>No room messages yet</h3>
              <p>Start the first chat message for this room.</p>
            </div>
          )}
        </div>

        <form className="messages-composer room-chat-composer" onSubmit={handleSubmit}>
          <textarea
            rows="3"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message everyone in ${room.name}`}
          />
          <div className="messages-composer-footer">
            <small>Everyone currently inside this room can read the messages sent here.</small>
            <button type="submit">Send to room</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RoomChatPanel;
