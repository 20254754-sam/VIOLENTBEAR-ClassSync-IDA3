import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';

const formatMessageTime = (dateValue) =>
  new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const buildConversationKey = (firstUserId, secondUserId) =>
  `direct:${[firstUserId, secondUserId].map(String).sort().join(':')}`;

const MessagesPage = ({ currentUser, users, messages, onSendDirectMessage, onMarkConversationRead }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const selectedUserId = searchParams.get('user') || '';
  const threadRef = React.useRef(null);

  const directContacts = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [currentUser.id, users]
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return directContacts.filter((user) =>
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery) ||
      user.course.toLowerCase().includes(normalizedQuery)
    );
  }, [directContacts, query]);

  const directMessages = useMemo(
    () =>
      messages.filter(
        (message) => message.type === 'direct' && message.participants.includes(currentUser.id)
      ),
    [currentUser.id, messages]
  );

  const conversationSummaries = useMemo(() => {
    const summaryMap = new Map();

    directMessages.forEach((message) => {
      const otherUserId = message.participants.find((participantId) => participantId !== currentUser.id);
      const otherUser = users.find((user) => user.id === otherUserId);

      if (!otherUser) {
        return;
      }

      const existingSummary = summaryMap.get(message.conversationKey);
      const isUnread = message.senderId !== currentUser.id && !message.readBy.includes(currentUser.id);

      if (!existingSummary) {
        summaryMap.set(message.conversationKey, {
          conversationKey: message.conversationKey,
          otherUser,
          lastMessage: message,
          unreadCount: isUnread ? 1 : 0
        });
        return;
      }

      existingSummary.unreadCount += isUnread ? 1 : 0;

      if (new Date(message.createdAt) > new Date(existingSummary.lastMessage.createdAt)) {
        existingSummary.lastMessage = message;
      }
    });

    return Array.from(summaryMap.values()).sort(
      (firstSummary, secondSummary) =>
        new Date(secondSummary.lastMessage.createdAt) - new Date(firstSummary.lastMessage.createdAt)
    );
  }, [currentUser.id, directMessages, users]);

  useEffect(() => {
    if (selectedUserId || conversationSummaries.length === 0) {
      return;
    }

    const firstConversationUserId = conversationSummaries[0].otherUser.id;
    setSearchParams({ user: firstConversationUserId });
  }, [conversationSummaries, selectedUserId, setSearchParams]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const activeConversationKey = selectedUser ? buildConversationKey(currentUser.id, selectedUser.id) : '';

  const activeMessages = useMemo(
    () =>
      directMessages
        .filter((message) => message.conversationKey === activeConversationKey)
        .sort((firstMessage, secondMessage) => new Date(firstMessage.createdAt) - new Date(secondMessage.createdAt)),
    [activeConversationKey, directMessages]
  );

  useEffect(() => {
    if (!activeConversationKey) {
      return;
    }

    onMarkConversationRead(activeConversationKey);
  }, [activeConversationKey, onMarkConversationRead]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeMessages]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    const result = onSendDirectMessage(selectedUser.id, draft);

    if (result.success) {
      setDraft('');
    }
  };

  const unreadConversationCount = conversationSummaries.filter((summary) => summary.unreadCount > 0).length;

  const handleSelectUser = (userId) => {
    setSearchParams({ user: userId });
  };

  return (
    <div className="page">
      <div className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h1>Messages</h1>
            <p>Pick a classmate and continue the conversation here.</p>
          </div>

          <input
            className="messages-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a classmate by name"
          />

          <div className="messages-sidebar-stats">
            <article className="messages-sidebar-stat">
              <strong>{conversationSummaries.length}</strong>
              <span>Active chats</span>
            </article>
            <article className="messages-sidebar-stat">
              <strong>{unreadConversationCount}</strong>
              <span>Unread chats</span>
            </article>
          </div>

          <div className="messages-list-section">
            <div className="messages-list-section-header">
              <strong>Recent conversations</strong>
            </div>
            {conversationSummaries.length > 0 ? (
              <div className="messages-contact-list">
                {conversationSummaries.map((summary) => {
                  const isSelected = selectedUserId === summary.otherUser.id;

                  return (
                    <button
                      key={summary.conversationKey}
                      type="button"
                      className={`messages-contact-card ${isSelected ? 'messages-contact-card-active' : ''}`}
                      onClick={() => handleSelectUser(summary.otherUser.id)}
                    >
                      <UserAvatar user={summary.otherUser} size="md" />
                      <div className="messages-contact-copy">
                        <strong>{summary.otherUser.name}</strong>
                        <p>{summary.lastMessage.text}</p>
                        <small>{formatMessageTime(summary.lastMessage.createdAt)}</small>
                      </div>
                      {summary.unreadCount > 0 && (
                        <span className="messages-unread-badge">{summary.unreadCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="messages-search-empty">
                <p>No conversations yet.</p>
              </div>
            )}
          </div>

          <div className="messages-list-section">
            <div className="messages-list-section-header">
              <strong>Start a new chat</strong>
            </div>
            {query.trim() ? (
              searchResults.length > 0 ? (
                <div className="messages-contact-list">
                  {searchResults.map((user) => {
                    const isSelected = selectedUserId === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        className={`messages-contact-card ${isSelected ? 'messages-contact-card-active' : ''}`}
                        onClick={() => handleSelectUser(user.id)}
                      >
                        <UserAvatar user={user} size="md" />
                        <div className="messages-contact-copy">
                          <strong>{user.name}</strong>
                          <p>{user.role === 'admin' ? 'Admin' : user.course || 'Student'}</p>
                          <small>{user.email}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="messages-search-empty">
                  <p>No users matched your search.</p>
                </div>
              )
            ) : (
              <div className="messages-search-empty">
                <p>Search a user by name to start a conversation.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="messages-panel">
          {selectedUser ? (
            <>
              <div className="messages-panel-header">
                <div className="messages-panel-user">
                  <UserAvatar user={selectedUser} size="md" />
                  <div>
                    <strong>{selectedUser.name}</strong>
                    <p>{selectedUser.role === 'admin' ? 'Admin' : selectedUser.course || 'Student'}</p>
                  </div>
                </div>
                <Link to={`/users/${selectedUser.id}`} className="card-link-button">
                  View profile
                </Link>
              </div>

              <div className="messages-thread" ref={threadRef}>
                {activeMessages.length > 0 ? (
                  activeMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUser.id;

                    return (
                      <article
                        key={message.id}
                        className={`message-bubble ${isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'}`}
                      >
                        <p>{message.text}</p>
                        <small>{formatMessageTime(message.createdAt)}</small>
                      </article>
                    );
                  })
                ) : (
                  <div className="profile-empty-state messages-empty-thread">
                    <h3>No messages yet</h3>
                    <p>Send the first private message to start this conversation.</p>
                  </div>
                )}
              </div>

              <form className="messages-composer" onSubmit={handleSubmit}>
                <textarea
                  rows="3"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Message ${selectedUser.name}`}
                />
                <div className="messages-composer-footer">
                  <small>Private messages are only visible to you and {selectedUser.name}.</small>
                  <button type="submit">Send message</button>
                </div>
              </form>
            </>
          ) : (
            <div className="profile-empty-state messages-empty-thread">
              <h3>Select a conversation</h3>
              <p>Choose a classmate from the left to start chatting.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MessagesPage;
