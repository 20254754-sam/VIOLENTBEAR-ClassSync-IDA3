import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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

const MESSAGE_ATTACHMENT_MAX_COUNT = 4;
const MESSAGE_ATTACHMENT_MAX_SIZE = 2 * 1024 * 1024;
const MESSAGE_ATTACHMENT_MAX_TOTAL_SIZE = 2.5 * 1024 * 1024;
const MESSAGE_ATTACHMENT_ACCEPT =
  'image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip';

const getCompactDisplayName = (name = '') => {
  const normalizedName = name.trim() || 'User';
  return normalizedName.length > 10 ? `${normalizedName.slice(0, 10)}...` : normalizedName;
};

const formatFileSize = (size = 0) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size || 0} B`;
};

const readMessageAttachment = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result,
        isImage: (file.type || '').startsWith('image/'),
        attachedAt: new Date().toISOString()
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatVoiceDuration = (duration = 0) => {
  const safeDuration = Math.max(0, Math.round(duration));
  const minutes = Math.floor(safeDuration / 60);
  const seconds = String(safeDuration % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
};

const getVoiceWaveformBars = (voice = {}, barCount = 28) => {
  const durationSeed = Math.max(1, Math.round((voice.duration || 1) * 9));
  const sizeSeed = Math.max(1, Math.round((voice.size || 12000) / 1400));
  const seed = durationSeed + sizeSeed;

  return Array.from({ length: barCount }, (_, index) => {
    const centerBias = 1 - Math.abs(index - (barCount - 1) / 2) / (barCount / 2);
    const primaryWave = (Math.sin((index + 1) * (seed % 7 + 3.4)) + 1) / 2;
    const secondaryWave = (Math.sin((index + seed) * 1.72) + 1) / 2;
    const height = 8 + primaryWave * 15 + secondaryWave * 8 + centerBias * 9;

    return Math.round(Math.max(7, Math.min(34, height)));
  });
};

const VoiceWaveform = ({ voice, isPlaying = false, progress = 0, onSeek }) => (
  <span
    className={`message-voice-waveform ${isPlaying ? 'message-voice-waveform-playing' : ''}`}
    style={{
      '--voice-play-duration': `${Math.max(0.8, Number(voice?.duration) || 1)}s`,
      '--voice-play-delay': `${-(Math.max(0.8, Number(voice?.duration) || 1) * Math.max(0, Math.min(1, progress)))}s`
    }}
    role="button"
    tabIndex={0}
    aria-label="Seek voice message"
    onClick={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const nextProgress = bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0;

      onSeek?.(Math.max(0, Math.min(1, nextProgress)));
    }}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSeek?.(0);
      }
    }}
  >
    {getVoiceWaveformBars(voice).map((height, index) => (
      <span
        key={`${height}-${index}`}
        className="message-voice-waveform-bar"
        style={{ '--voice-bar-height': `${height}px` }}
      />
    ))}
    <span
      className="message-voice-waveform-playhead"
      style={{ '--voice-playhead-progress': `${Math.max(0, Math.min(1, progress)) * 100}%` }}
    />
  </span>
);

const getMessagePreview = (message) => {
  if (!message) {
    return 'No messages yet. Start a new conversation.';
  }

  if (message.voice) {
    return 'Voice note';
  }

  if (message.text) {
    return message.text;
  }

  if ((message.attachments || []).length > 0) {
    return `${message.attachments.length} attachment${message.attachments.length === 1 ? '' : 's'}`;
  }

  return 'Message';
};

const MessagesPage = ({
  currentUser,
  users,
  messages,
  onSendDirectMessage,
  onMarkConversationRead,
  onDeleteDirectConversation
}) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeUserId = searchParams.get('user') || '';
  const [activeUserId, setActiveUserId] = useState(routeUserId);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const [attachmentDrafts, setAttachmentDrafts] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [openAttachmentMenuId, setOpenAttachmentMenuId] = useState('');
  const [activeImageAttachment, setActiveImageAttachment] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState('');
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState({ messageId: '', progress: 0 });
  const selectedUserId = activeUserId;
  const threadRef = React.useRef(null);
  const syncedRouteUserRef = React.useRef(routeUserId);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const voiceTimerRef = React.useRef(null);
  const voiceStreamRef = React.useRef(null);
  const voiceDurationRef = React.useRef(0);
  const voicePlaybackRef = React.useRef({ messageId: '', audio: null });
  const voiceProgressFrameRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

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
    setAttachmentDrafts([]);
    setAttachmentError('');
    setOpenAttachmentMenuId('');
    setActiveImageAttachment(null);
    setRecordingSeconds(0);
    setPlayingVoiceId('');
    setVoicePlaybackProgress({ messageId: '', progress: 0 });
    voiceDurationRef.current = 0;
    if (voiceProgressFrameRef.current) {
      window.cancelAnimationFrame(voiceProgressFrameRef.current);
      voiceProgressFrameRef.current = null;
    }
    voicePlaybackRef.current.audio?.pause();
    voicePlaybackRef.current = { messageId: '', audio: null };
  }, [selectedUserId]);

  useEffect(
    () => () => {
      if (voiceTimerRef.current) {
        window.clearInterval(voiceTimerRef.current);
      }

      if (voiceProgressFrameRef.current) {
        window.cancelAnimationFrame(voiceProgressFrameRef.current);
      }

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      voicePlaybackRef.current.audio?.pause();
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  useEffect(() => {
    if (!activeImageAttachment) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveImageAttachment(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImageAttachment]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    const result = onSendDirectMessage(selectedUser.id, draft, {
      attachments: attachmentDrafts
    });

    if (result.success) {
      setDraft('');
      setAttachmentDrafts([]);
      setAttachmentError('');
      setOpenAttachmentMenuId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setAttachmentError(result.message);
    }
  };

  const handlePickAttachments = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const availableSlots = MESSAGE_ATTACHMENT_MAX_COUNT - attachmentDrafts.length;

    if (availableSlots <= 0) {
      setAttachmentError(`You can attach up to ${MESSAGE_ATTACHMENT_MAX_COUNT} files per message.`);
      event.target.value = '';
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, availableSlots);
    const oversizedFile = acceptedFiles.find((file) => file.size > MESSAGE_ATTACHMENT_MAX_SIZE);
    const currentAttachmentSize = attachmentDrafts.reduce((totalSize, attachment) => totalSize + (attachment.size || 0), 0);
    const nextAttachmentSize = acceptedFiles.reduce((totalSize, file) => totalSize + file.size, 0);

    if (oversizedFile) {
      setAttachmentError(`${oversizedFile.name} is too large. Keep each file under ${formatFileSize(MESSAGE_ATTACHMENT_MAX_SIZE)}.`);
      event.target.value = '';
      return;
    }

    if (currentAttachmentSize + nextAttachmentSize > MESSAGE_ATTACHMENT_MAX_TOTAL_SIZE) {
      setAttachmentError(`Keep all files in one message under ${formatFileSize(MESSAGE_ATTACHMENT_MAX_TOTAL_SIZE)}.`);
      event.target.value = '';
      return;
    }

    try {
      const nextAttachments = await Promise.all(acceptedFiles.map(readMessageAttachment));

      setAttachmentDrafts((currentAttachments) => [...currentAttachments, ...nextAttachments]);
      setAttachmentError(
        selectedFiles.length > availableSlots
          ? `Only ${availableSlots} more attachment${availableSlots === 1 ? '' : 's'} can fit in this message.`
          : ''
      );
    } catch {
      setAttachmentError('Unable to attach that file. Please try another one.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveAttachmentDraft = (attachmentId) => {
    setAttachmentDrafts((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const stopVoiceProgressLoop = () => {
    if (voiceProgressFrameRef.current) {
      window.cancelAnimationFrame(voiceProgressFrameRef.current);
      voiceProgressFrameRef.current = null;
    }
  };

  const startVoiceProgressLoop = (messageId, audio, fallbackDuration = 0) => {
    stopVoiceProgressLoop();

    const updateProgress = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDuration;
      const progress = duration > 0 ? audio.currentTime / duration : 0;

      setVoicePlaybackProgress({ messageId, progress });

      if (!audio.paused && !audio.ended) {
        voiceProgressFrameRef.current = window.requestAnimationFrame(updateProgress);
      } else {
        voiceProgressFrameRef.current = null;
      }
    };

    voiceProgressFrameRef.current = window.requestAnimationFrame(updateProgress);
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

  const playVoiceFromProgress = (messageId, voice, progress = 0) => {
    if (!voice?.dataUrl) {
      return;
    }

    const currentPlayback = voicePlaybackRef.current;
    const safeProgress = Math.max(0, Math.min(1, progress));

    currentPlayback.audio?.pause();
    stopVoiceProgressLoop();

    const audio = currentPlayback.messageId === messageId && currentPlayback.audio
      ? currentPlayback.audio
      : new Audio(voice.dataUrl);

    audio.preload = 'auto';
    audio.onended = () => {
      stopVoiceProgressLoop();
      voicePlaybackRef.current = { messageId: '', audio: null };
      setPlayingVoiceId('');
      setVoicePlaybackProgress({ messageId: '', progress: 0 });
    };
    audio.onerror = () => {
      stopVoiceProgressLoop();
      voicePlaybackRef.current = { messageId: '', audio: null };
      setPlayingVoiceId('');
      setVoicePlaybackProgress({ messageId: '', progress: 0 });
      setVoiceError('Unable to play this voice message.');
    };
    voicePlaybackRef.current = { messageId, audio };
    setVoiceError('');
    setPlayingVoiceId(messageId);
    setVoicePlaybackProgress({ messageId, progress: safeProgress });

    const seekWhenReady = () => {
      const safeDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : voice.duration || 0;
      audio.currentTime = safeDuration > 0 ? safeDuration * safeProgress : 0;
    };

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seekWhenReady();
    } else {
      audio.onloadedmetadata = seekWhenReady;
    }

    audio
      .play()
      .then(() => {
        setPlayingVoiceId(messageId);
      })
      .catch(() => {
        stopVoiceProgressLoop();
        voicePlaybackRef.current = { messageId: '', audio: null };
        setPlayingVoiceId('');
        setVoicePlaybackProgress({ messageId: '', progress: 0 });
        setVoiceError('Tap again to play this voice message.');
      });
  };

  const handleToggleVoicePlayback = (messageId, voice) => {
    if (!voice?.dataUrl) {
      return;
    }

    const currentPlayback = voicePlaybackRef.current;

    if (currentPlayback.messageId === messageId && currentPlayback.audio && !currentPlayback.audio.paused) {
      currentPlayback.audio.pause();
      currentPlayback.audio.currentTime = 0;
      stopVoiceProgressLoop();
      voicePlaybackRef.current = { messageId: '', audio: null };
      setPlayingVoiceId('');
      setVoicePlaybackProgress({ messageId: '', progress: 0 });
      return;
    }

    playVoiceFromProgress(messageId, voice, 0);
  };

  const unreadConversationCount = conversationSummaries.filter((summary) => summary.unreadCount > 0).length;

  const handleSelectUser = (userId) => {
    setQuery('');
    setDraft('');
    setAttachmentDrafts([]);
    setAttachmentError('');
    setOpenAttachmentMenuId('');

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
      setAttachmentDrafts([]);
      setAttachmentError('');
      setOpenAttachmentMenuId('');
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
                  <Link
                    to={`/users/${selectedUser.id}`}
                    state={{ from: `${location.pathname}${location.search}` }}
                    className="card-link-button"
                    onClick={() => {
                      sessionStorage.setItem('classsync-profile-return-route', `${location.pathname}${location.search}`);
                      setIsActionMenuOpen(false);
                    }}
                  >
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
                      <button
                        type="button"
                        className={`message-voice-play-button ${playingVoiceId === message.id ? 'message-voice-play-button-active' : ''}`}
                        onClick={() => handleToggleVoicePlayback(message.id, message.voice)}
                        aria-label={playingVoiceId === message.id ? 'Pause voice message' : 'Play voice message'}
                      >
                        <span aria-hidden="true" />
                      </button>
                      <VoiceWaveform
                        voice={message.voice}
                        isPlaying={playingVoiceId === message.id}
                        progress={voicePlaybackProgress.messageId === message.id ? voicePlaybackProgress.progress : 0}
                        onSeek={(nextProgress) => playVoiceFromProgress(message.id, message.voice, nextProgress)}
                      />
                      <span className="message-voice-note-duration">
                        {formatVoiceDuration(message.voice.duration)}
                      </span>
                    </div>
                  )}
                  {(message.attachments || []).length > 0 && (
                    <div className="message-attachment-list">
                      {message.attachments.map((attachment) => {
                        const attachmentMenuId = `${message.id}-${attachment.id}`;

                        if (attachment.isImage) {
                          return (
                            <div key={attachment.id} className="message-image-attachment">
                              <button
                                type="button"
                                className="message-image-link"
                                aria-label={`Open ${attachment.name}`}
                                onClick={() => setActiveImageAttachment(attachment)}
                              >
                                <img src={attachment.dataUrl} alt={attachment.name} />
                              </button>
                              <button
                                type="button"
                                className="message-attachment-menu-button"
                                aria-label={`Show details for ${attachment.name}`}
                                aria-expanded={openAttachmentMenuId === attachmentMenuId}
                                onClick={() =>
                                  setOpenAttachmentMenuId((currentMenuId) =>
                                    currentMenuId === attachmentMenuId ? '' : attachmentMenuId
                                  )
                                }
                              >
                                <span />
                                <span />
                                <span />
                              </button>
                              {openAttachmentMenuId === attachmentMenuId && (
                                <div className="message-attachment-details-menu">
                                  <strong>Image details</strong>
                                  <span title={attachment.name}>{attachment.name}</span>
                                  <span>{attachment.type || 'Image'} · {formatFileSize(attachment.size)}</span>
                                  <a href={attachment.dataUrl} download={attachment.name}>
                                    Download image
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <a
                            key={attachment.id}
                            className="message-attachment"
                            href={attachment.dataUrl}
                            download={attachment.name}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="message-attachment-file-icon" aria-hidden="true" />
                            <span className="message-attachment-copy">
                              <strong>{attachment.name}</strong>
                              <small>{formatFileSize(attachment.size)}</small>
                            </span>
                          </a>
                        );
                      })}
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
          <input
            ref={fileInputRef}
            type="file"
            className="messages-attachment-input"
            accept={MESSAGE_ATTACHMENT_ACCEPT}
            multiple
            onChange={handleAttachmentChange}
          />
          <textarea
            rows="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${selectedCompactName}`}
          />
          <div className="messages-voice-tools">
            {isRecordingVoice && (
              <div className="messages-recording-indicator" role="status" aria-live="polite">
                <span className="messages-recording-dot" aria-hidden="true" />
                <span className="messages-recording-wave" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, index) => (
                    <span key={index} style={{ '--recording-bar-index': index }} />
                  ))}
                </span>
                <strong>Recording {formatVoiceDuration(recordingSeconds)}</strong>
              </div>
            )}
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
            {attachmentDrafts.length > 0 && (
              <div className="messages-attachment-preview">
                {attachmentDrafts.map((attachment) => (
                  <article key={attachment.id} className="messages-attachment-preview-card">
                    {attachment.isImage ? (
                      <img src={attachment.dataUrl} alt={attachment.name} />
                    ) : (
                      <span className="message-attachment-file-icon" aria-hidden="true" />
                    )}
                    <span>
                      <strong>{attachment.name}</strong>
                      <small>{formatFileSize(attachment.size)}</small>
                    </span>
                    <button
                      type="button"
                      className="messages-attachment-remove"
                      aria-label={`Remove ${attachment.name}`}
                      onClick={() => handleRemoveAttachmentDraft(attachment.id)}
                    >
                      x
                    </button>
                  </article>
                ))}
              </div>
            )}
            {attachmentError && <p className="messages-voice-error">{attachmentError}</p>}
          </div>
          <div className="messages-composer-footer">
            <small>Private messages are only visible to you and {selectedCompactName}.</small>
            <div className="messages-composer-actions">
              <button
                type="button"
                className="messages-attachment-button"
                onClick={handlePickAttachments}
                disabled={!selectedUser || attachmentDrafts.length >= MESSAGE_ATTACHMENT_MAX_COUNT}
                aria-label="Attach image or file"
              >
                <span aria-hidden="true" className="messages-attachment-icon" />
                <span className="messages-voice-button-label">Attach file</span>
              </button>
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
              <button type="submit" disabled={!draft.trim() && attachmentDrafts.length === 0}>Send message</button>
            </div>
          </div>
        </form>
      </section>
    );
  };

  const imageLightbox =
    activeImageAttachment?.isImage ? (
      <div className="attachment-lightbox-overlay" onClick={() => setActiveImageAttachment(null)}>
        <div className="attachment-lightbox" onClick={(event) => event.stopPropagation()}>
          <div className="attachment-lightbox-header">
            <div className="attachment-lightbox-copy">
              <h3>{activeImageAttachment.name}</h3>
              <p>{activeImageAttachment.type || 'Image attachment'}</p>
            </div>
            <button type="button" className="upload-popup-button" onClick={() => setActiveImageAttachment(null)}>
              Close
            </button>
          </div>
          <img
            src={activeImageAttachment.dataUrl}
            alt={activeImageAttachment.name}
            className="attachment-lightbox-image"
          />
          <div className="attachment-lightbox-footer">
            <small>Press Esc to close</small>
            <a
              href={activeImageAttachment.dataUrl}
              download={activeImageAttachment.name}
              className="attachment-download-button"
            >
              Download image
            </a>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="page">
        <div className="messages-page-header messages-intro-card">
          <span className="messages-sidebar-eyebrow">Private chat</span>
          <h1>Messages</h1>
          <p className="page-description-box">Search a classmate, open a thread, and keep your direct conversations here.</p>
        </div>

        <div className="messages-shell">
          <aside className="messages-sidebar">
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
      {typeof document !== 'undefined' && imageLightbox
        ? createPortal(imageLightbox, document.body)
        : null}
    </>
  );
};

export default MessagesPage;
