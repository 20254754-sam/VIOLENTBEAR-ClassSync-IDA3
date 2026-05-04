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

const formatConversationTime = (dateValue) => {
  const value = new Date(dateValue);
  const now = new Date();
  const sameDay = value.toDateString() === now.toDateString();

  if (sameDay) {
    return value.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const buildConversationKey = (firstUserId, secondUserId) =>
  `direct:${[firstUserId, secondUserId].map(String).sort().join(':')}`;

const getCompactDisplayName = (name = '') => {
  const normalizedName = name.trim() || 'User';
  return normalizedName.length > 10 ? `${normalizedName.slice(0, 10)}...` : normalizedName;
};

const formatVoiceDuration = (duration = 0) => {
  const safeDuration = Math.max(0, Math.round(duration));
  const minutes = Math.floor(safeDuration / 60);
  const seconds = String(safeDuration % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const getMessagePreview = (message) => {
  if (!message) {
    return 'No messages yet. Start a new conversation.';
  }

  return message.voice ? 'Voice note' : message.text || 'Message';
};

const MessagesPage = ({
  currentUser,
  users,
  messages,
  onSendDirectMessage,
  onMarkConversationRead,
  onDeleteDirectConversation
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeUserId = searchParams.get('user') || '';
  const [activeUserId, setActiveUserId] = useState(routeUserId);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const selectedUserId = activeUserId;
  const threadRef = React.useRef(null);
  const syncedRouteUserRef = React.useRef(routeUserId);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const voiceTimerRef = React.useRef(null);
  const voiceStreamRef = React.useRef(null);
  const voiceDurationRef = React.useRef(0);

  const directContacts = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [currentUser.id, users]
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return directContacts
      .filter((user) =>
        (user.name || '').toLowerCase().includes(normalizedQuery) ||
        (user.email || '').toLowerCase().includes(normalizedQuery) ||
        (user.course || '').toLowerCase().includes(normalizedQuery)
      )
      .sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name));
  }, [directContacts, query]);

  const directMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.type === 'direct' &&
          (message.participants || []).includes(currentUser.id) &&
          !(message.deletedFor || []).includes(currentUser.id)
      ),
    [currentUser.id, messages]
  );

  const conversationSummaries = useMemo(() => {
    const summaryMap = new Map();

    directMessages.forEach((message) => {
      const otherUserId = (message.participants || []).find((participantId) => participantId !== currentUser.id);
      const otherUser = users.find((user) => user.id === otherUserId);

      if (!otherUser) {
        return;
      }

      const existingSummary = summaryMap.get(message.conversationKey);
      const isUnread = message.senderId !== currentUser.id && !(message.readBy || []).includes(currentUser.id);

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

  const recentConversationItems = useMemo(() => {
    if (!selectedUserId) {
      return conversationSummaries;
    }

    const alreadyListed = conversationSummaries.some((summary) => summary.otherUser.id === selectedUserId);

    if (alreadyListed) {
      return conversationSummaries;
    }

    const selectedListUser = users.find((user) => user.id === selectedUserId && user.id !== currentUser.id);

    if (!selectedListUser) {
      return conversationSummaries;
    }

    return [
      {
        conversationKey: buildConversationKey(currentUser.id, selectedListUser.id),
        otherUser: selectedListUser,
        lastMessage: null,
        unreadCount: 0,
        isDraft: true
      },
      ...conversationSummaries
    ];
  }, [conversationSummaries, currentUser.id, selectedUserId, users]);

  useEffect(() => {
    if (routeUserId === syncedRouteUserRef.current) {
      return;
    }

    syncedRouteUserRef.current = routeUserId;
    setActiveUserId(routeUserId);
  }, [routeUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const activeConversationKey = selectedUser ? buildConversationKey(currentUser.id, selectedUser.id) : '';

  const selectedConversationSummary = useMemo(
    () => recentConversationItems.find((summary) => summary.otherUser.id === selectedUserId) || null,
    [recentConversationItems, selectedUserId]
  );

  const activeMessages = useMemo(
    () =>
      directMessages
        .filter((message) => message.conversationKey === activeConversationKey)
        .sort((firstMessage, secondMessage) => new Date(firstMessage.createdAt) - new Date(secondMessage.createdAt)),
    [activeConversationKey, directMessages]
  );

  const hasUnreadActiveMessages = useMemo(
    () =>
      activeMessages.some(
        (message) => message.senderId !== currentUser.id && !(message.readBy || []).includes(currentUser.id)
      ),
    [activeMessages, currentUser.id]
  );

  useEffect(() => {
    if (!activeConversationKey || !hasUnreadActiveMessages) {
      return;
    }

    onMarkConversationRead(activeConversationKey);
  }, [activeConversationKey, hasUnreadActiveMessages, onMarkConversationRead]);

  useEffect(() => {
    if (!threadRef.current) {
      return;
    }

    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [activeMessages]);

  useEffect(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setIsActionMenuOpen(false);
    setVoiceDraft(null);
    setVoiceError('');
    setRecordingSeconds(0);
    voiceDurationRef.current = 0;
  }, [selectedUserId]);

  useEffect(
    () => () => {
      if (voiceTimerRef.current) {
        window.clearInterval(voiceTimerRef.current);
      }

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

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

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStartVoiceRecording = async () => {
    if (!selectedUser || isRecordingVoice) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      setVoiceError('');
      setVoiceDraft(null);
      setRecordingSeconds(0);
      voiceDurationRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      voiceStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (voiceTimerRef.current) {
          window.clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }

        stream.getTracks().forEach((track) => track.stop());
        voiceStreamRef.current = null;
        setIsRecordingVoice(false);

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        if (!blob.size) {
          setVoiceError('No voice was captured. Please try again.');
          return;
        }

        if (blob.size > 1_500_000) {
          setVoiceError('Voice note is too large. Please keep it under about one minute.');
          return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
          setVoiceDraft({
            dataUrl: reader.result,
            duration: voiceDurationRef.current,
            mimeType: blob.type,
            size: blob.size
          });
        };

        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecordingVoice(true);

      voiceTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => {
          const nextSeconds = seconds + 1;
          voiceDurationRef.current = nextSeconds;

          if (nextSeconds >= 60) {
            stopVoiceRecording();
          }

          return nextSeconds;
        });
      }, 1000);
    } catch {
      setIsRecordingVoice(false);
      setVoiceError('Microphone access was blocked or unavailable.');
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
      voiceStreamRef.current = null;
    }
  };

  const handleCancelVoiceDraft = () => {
    setVoiceDraft(null);
    setVoiceError('');
    setRecordingSeconds(0);
    voiceDurationRef.current = 0;
  };

  const handleSendVoiceDraft = () => {
    if (!selectedUser || !voiceDraft) {
      return;
    }

    const result = onSendDirectMessage(selectedUser.id, '', { voice: voiceDraft });

    if (result.success) {
      handleCancelVoiceDraft();
    } else {
      setVoiceError(result.message);
    }
  };

  const unreadConversationCount = conversationSummaries.filter((summary) => summary.unreadCount > 0).length;

  const handleSelectUser = (userId) => {
    setQuery('');
    setDraft('');

    if (selectedUserId === userId) {
      syncedRouteUserRef.current = '';
      setActiveUserId('');
      setIsActionMenuOpen(false);
      setSearchParams({}, { replace: false });
      return;
    }

    syncedRouteUserRef.current = userId;
    setActiveUserId(userId);
    setIsActionMenuOpen(false);
    setSearchParams({ user: userId }, { replace: false });
  };

  const handleDeleteConversation = () => {
    if (!activeConversationKey || !selectedUser) {
      return;
    }

    const shouldDelete = window.confirm(`Delete your conversation with ${selectedUser.name}?`);

    if (!shouldDelete) {
      return;
    }

    const result = onDeleteDirectConversation(activeConversationKey);

    if (result.success) {
      setDraft('');
      syncedRouteUserRef.current = '';
      setActiveUserId('');
      setSearchParams({}, { replace: true });
    }
  };

  const renderConversationPanel = () => {
    if (!selectedUser) {
      return null;
    }

    const selectedCompactName = getCompactDisplayName(selectedUser.name);

    return (
      <section className="messages-panel messages-panel-inline">
        <div className="messages-panel-header">
          <div className="messages-panel-user">
            <UserAvatar user={selectedUser} size="md" />
            <div>
              <strong title={selectedUser.name}>{selectedCompactName}</strong>
              <p>{selectedUser.role === 'admin' ? 'Admin' : selectedUser.course || 'Student'}</p>
            </div>
          </div>
          <div className="messages-panel-actions">
            <div className="messages-panel-meta">
              <span>{activeMessages.length} msg</span>
              <span>{selectedConversationSummary?.unreadCount || 0} unread</span>
            </div>
            <div className="messages-action-menu">
              <button
                type="button"
                className="messages-action-menu-button"
                aria-label="Open conversation actions"
                aria-expanded={isActionMenuOpen}
                onClick={() => setIsActionMenuOpen((current) => !current)}
              >
                <span />
                <span />
                <span />
              </button>
              {isActionMenuOpen && (
                <div className="messages-panel-button-row">
                  <Link to={`/users/${selectedUser.id}`} className="card-link-button" onClick={() => setIsActionMenuOpen(false)}>
                    View profile
                  </Link>
                  <button
                    type="button"
                    className="messages-delete-button"
                    onClick={handleDeleteConversation}
                    disabled={activeMessages.length === 0}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
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
                  {message.text && <p>{message.text}</p>}
                  {message.voice && (
                    <div className="message-voice-note">
                      <div className="message-voice-note-icon" aria-hidden="true">
                        <span />
                      </div>
                      <div className="message-voice-note-body">
                        <strong>Voice note</strong>
                        <audio controls src={message.voice.dataUrl}>
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                      <span className="message-voice-note-duration">
                        {formatVoiceDuration(message.voice.duration)}
                      </span>
                    </div>
                  )}
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
            placeholder={`Message ${selectedCompactName}`}
          />
          <div className="messages-voice-tools">
            {voiceDraft && (
              <div className="messages-voice-preview">
                <audio controls src={voiceDraft.dataUrl}>
                  Your browser does not support audio playback.
                </audio>
                <span>{formatVoiceDuration(voiceDraft.duration)}</span>
                <button type="button" onClick={handleSendVoiceDraft}>Send voice</button>
                <button type="button" className="messages-voice-cancel" onClick={handleCancelVoiceDraft}>
                  Cancel
                </button>
              </div>
            )}
            {voiceError && <p className="messages-voice-error">{voiceError}</p>}
          </div>
          <div className="messages-composer-footer">
            <small>Private messages are only visible to you and {selectedCompactName}.</small>
            <div className="messages-composer-actions">
              <button
                type="button"
                className={`messages-voice-button ${isRecordingVoice ? 'messages-voice-button-recording' : ''}`}
                onClick={isRecordingVoice ? stopVoiceRecording : handleStartVoiceRecording}
                disabled={!selectedUser}
                aria-label={isRecordingVoice ? 'Stop recording voice note' : 'Record voice note'}
              >
                <span aria-hidden="true" className="messages-voice-icon" />
                <span className="messages-voice-button-label">
                  {isRecordingVoice ? `Stop ${formatVoiceDuration(recordingSeconds)}` : 'Record voice'}
                </span>
              </button>
              <button type="submit" disabled={!draft.trim()}>Send message</button>
            </div>
          </div>
        </form>
      </section>
    );
  };

  return (
    <div className="page">
      <div className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-header">
            <span className="messages-sidebar-eyebrow">Private chat</span>
            <h1>Messages</h1>
            <p>Search a classmate, open a thread, and keep your direct conversations here.</p>
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
              <strong>Start a new chat</strong>
            </div>
            {query.trim() ? (
              searchResults.length > 0 ? (
                <div className="messages-contact-list">
                  {searchResults.map((user) => {
                    const isSelected = selectedUserId === user.id;

                    return (
                      <React.Fragment key={user.id}>
                        <button
                          type="button"
                          className={`messages-contact-card ${isSelected ? 'messages-contact-card-active' : ''}`}
                          onClick={() => handleSelectUser(user.id)}
                        >
                          <UserAvatar user={user} size="md" />
                          <div className="messages-contact-copy">
                            <div className="messages-contact-topline">
                              <strong>{user.name}</strong>
                              <small className="messages-contact-stamp">Search</small>
                            </div>
                            <p>{user.role === 'admin' ? 'Admin' : user.course || 'Student'}</p>
                            <small>{user.email}</small>
                          </div>
                        </button>
                        {isSelected && renderConversationPanel()}
                      </React.Fragment>
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

          <div className="messages-list-section">
            <div className="messages-list-section-header">
              <strong>Recent conversations</strong>
            </div>
            {recentConversationItems.length > 0 ? (
              <div className="messages-contact-list">
                {recentConversationItems.map((summary) => {
                  const isSelected = selectedUserId === summary.otherUser.id;

                  return (
                    <React.Fragment key={summary.conversationKey}>
                      <button
                        type="button"
                        className={`messages-contact-card ${isSelected ? 'messages-contact-card-active' : ''}`}
                        onClick={() => handleSelectUser(summary.otherUser.id)}
                      >
                        <UserAvatar user={summary.otherUser} size="md" />
                        <div className="messages-contact-copy">
                          <div className="messages-contact-topline">
                            <strong>{summary.otherUser.name}</strong>
                            <small className="messages-contact-stamp">
                              {summary.lastMessage
                                ? formatConversationTime(summary.lastMessage.createdAt)
                                : 'New'}
                            </small>
                          </div>
                          <p>{getMessagePreview(summary.lastMessage)}</p>
                          <small>
                            {summary.otherUser.role === 'admin'
                              ? 'Admin'
                              : summary.otherUser.course || 'Student'}
                          </small>
                        </div>
                        {summary.unreadCount > 0 && (
                          <span className="messages-unread-badge">{summary.unreadCount}</span>
                        )}
                      </button>
                      {isSelected && renderConversationPanel()}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="messages-search-empty">
                <p>No conversations yet.</p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default MessagesPage;
