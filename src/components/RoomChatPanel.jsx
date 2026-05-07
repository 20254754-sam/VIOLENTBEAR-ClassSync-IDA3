import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageDeleteIcon, MessageEditIcon } from './MessageActionIcons';
import {
  appendMention,
  findMentionedUsers,
  getMentionSuggestions,
  splitTextByMentions
} from '../lib/mentions';
import { formatFileSize } from '../lib/classsyncDb';

const MESSAGE_ATTACHMENT_MAX_COUNT = 4;
const MESSAGE_ATTACHMENT_MAX_SIZE = 2 * 1024 * 1024;
const MESSAGE_ATTACHMENT_MAX_TOTAL_SIZE = 2.5 * 1024 * 1024;
const MESSAGE_ATTACHMENT_ACCEPT =
  'image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip';

const getMessageAssetUrl = (asset = {}) => asset.url || asset.dataUrl || '';

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

const formatMessageTime = (dateValue) =>
  new Date(dateValue).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const MentionText = ({ text }) =>
  splitTextByMentions(text).map((part, index) =>
    part.startsWith('@') ? (
      <span key={`${part}-${index}`} className="mention-highlight">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );

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
      '--voice-playhead-progress': `${Math.max(0, Math.min(1, progress)) * 100}%`
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
    <span className="message-voice-waveform-playhead" />
  </span>
);

const RoomChatPanel = ({
  room,
  members = [],
  currentUser,
  messages,
  onSendRoomMessage,
  onMarkRoomMessagesRead,
  onUnsendRoomMessage,
  onEditRoomMessage
}) => {
  const [draft, setDraft] = useState('');
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
  const [activeMessageActionId, setActiveMessageActionId] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState('');
  const threadRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const voiceTimerRef = React.useRef(null);
  const voiceStreamRef = React.useRef(null);
  const voiceDurationRef = React.useRef(0);
  const voicePlaybackRef = React.useRef({ messageId: '', audio: null });
  const voiceProgressFrameRef = React.useRef(null);
  const messageHoldTimerRef = React.useRef(null);
  const mentionUsers = useMemo(
    () => members.filter((member) => member.id !== currentUser.id),
    [currentUser.id, members]
  );
  const mentionSuggestions = getMentionSuggestions(draft, mentionUsers);

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

  const clearMessageHoldTimer = () => {
    if (messageHoldTimerRef.current) {
      window.clearTimeout(messageHoldTimerRef.current);
      messageHoldTimerRef.current = null;
    }
  };

  const stopVoiceProgressLoop = () => {
    if (voiceProgressFrameRef.current) {
      window.cancelAnimationFrame(voiceProgressFrameRef.current);
      voiceProgressFrameRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearMessageHoldTimer();
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
    setDraft('');
    setVoiceDraft(null);
    setVoiceError('');
    setAttachmentDrafts([]);
    setAttachmentError('');
    setOpenAttachmentMenuId('');
    setActiveImageAttachment(null);
    setActiveMessageActionId('');
    setEditingMessageId('');
    setEditDraft('');
    setEditError('');
    setRecordingSeconds(0);
    setPlayingVoiceId('');
    setVoicePlaybackProgress({ messageId: '', progress: 0 });
    voiceDurationRef.current = 0;
    stopVoiceProgressLoop();
    voicePlaybackRef.current.audio?.pause();
    voicePlaybackRef.current = { messageId: '', audio: null };
  }, [room.id]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await Promise.resolve(
      onSendRoomMessage(room.id, draft, {
        mentions: findMentionedUsers(draft, mentionUsers),
        attachments: attachmentDrafts
      })
    );

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

  const handleStartEditMessage = (message) => {
    clearMessageHoldTimer();
    setActiveMessageActionId('');
    setEditingMessageId(message.id);
    setEditDraft(message.text || '');
    setEditError('');
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId('');
    setEditDraft('');
    setEditError('');
  };

  const handleSaveEditMessage = async (event) => {
    event.preventDefault();

    if (!editingMessageId) {
      return;
    }

    const result = await Promise.resolve(
      onEditRoomMessage?.(editingMessageId, editDraft, {
        mentions: findMentionedUsers(editDraft, mentionUsers)
      })
    );

    if (result?.success) {
      handleCancelEditMessage();
      return;
    }

    setEditError(result?.message || 'Luminote could not edit this room message.');
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStartVoiceRecording = async () => {
    if (isRecordingVoice) {
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

  const handleSendVoiceDraft = async () => {
    if (!voiceDraft) {
      return;
    }

    const result = await Promise.resolve(onSendRoomMessage(room.id, '', { voice: voiceDraft }));

    if (result.success) {
      handleCancelVoiceDraft();
    } else {
      setVoiceError(result.message);
    }
  };

  const startVoiceProgressLoop = (messageId, audio, fallbackDuration = 0) => {
    stopVoiceProgressLoop();

    const updateProgress = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDuration;
      const progress = duration > 0 ? Math.max(0, Math.min(1, audio.currentTime / duration)) : 0;

      setVoicePlaybackProgress({ messageId, progress });

      if (!audio.paused && !audio.ended) {
        voiceProgressFrameRef.current = window.requestAnimationFrame(updateProgress);
      } else {
        voiceProgressFrameRef.current = null;
      }
    };

    voiceProgressFrameRef.current = window.requestAnimationFrame(updateProgress);
  };

  const playVoiceFromProgress = (messageId, voice, progress = 0) => {
    const voiceUrl = getMessageAssetUrl(voice);

    if (!voiceUrl) {
      return;
    }

    const currentPlayback = voicePlaybackRef.current;
    const safeProgress = Math.max(0, Math.min(1, progress));

    currentPlayback.audio?.pause();
    stopVoiceProgressLoop();

    const audio = currentPlayback.messageId === messageId && currentPlayback.audio
      ? currentPlayback.audio
      : new Audio(voiceUrl);

    audio.preload = 'auto';
    audio.onended = () => {
      stopVoiceProgressLoop();
      voicePlaybackRef.current = { messageId: '', audio: null };
      setPlayingVoiceId('');
      setVoicePlaybackProgress({ messageId, progress: 1 });
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
        startVoiceProgressLoop(messageId, audio, voice.duration || 0);
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
    if (!getMessageAssetUrl(voice)) {
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

  const handleMessageHoldStart = (messageId, canUnsendMessage) => {
    if (!canUnsendMessage) {
      return;
    }

    clearMessageHoldTimer();
    messageHoldTimerRef.current = window.setTimeout(() => {
      setActiveMessageActionId(messageId);
      messageHoldTimerRef.current = null;
    }, 520);
  };

  const handleMessageHoldEnd = () => {
    clearMessageHoldTimer();
  };

  const handleUnsendMessage = (messageId) => {
    clearMessageHoldTimer();
    setActiveMessageActionId('');

    const result = onUnsendRoomMessage?.(messageId);

    if (result && !result.success) {
      setAttachmentError(result.message);
      return;
    }

    if (editingMessageId === messageId) {
      setEditingMessageId('');
      setEditDraft('');
      setEditError('');
    }
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
            src={getMessageAssetUrl(activeImageAttachment)}
            alt={activeImageAttachment.name}
            className="attachment-lightbox-image"
          />
          <div className="attachment-lightbox-footer">
            <small>Press Esc to close</small>
            <a
              href={getMessageAssetUrl(activeImageAttachment)}
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
      <section className="rooms-list-section">
        <div className="rooms-list-header">
          <h2>Room chat</h2>
          <p>Messages for room members.</p>
        </div>

        <div className="room-chat-card">
          <div className="room-chat-thread" ref={threadRef}>
            {roomMessages.length > 0 ? (
              roomMessages.map((message) => {
                const isOwnMessage = message.senderId === currentUser.id;
                const isUnsentMessage = Boolean(message.unsentAt);
                const canManageMessage = isOwnMessage && !isUnsentMessage;
                const canEditMessage = canManageMessage && Boolean((message.text || '').trim());
                const isEditingMessage = editingMessageId === message.id;

                return (
                  <article
                    key={message.id}
                    className={`message-bubble ${isOwnMessage ? 'message-bubble-own' : 'message-bubble-other'} ${
                      isUnsentMessage ? 'message-bubble-unsent' : ''
                    } ${activeMessageActionId === message.id ? 'message-bubble-actions-visible' : ''}`}
                    onPointerDown={(event) => {
                      if (event.pointerType !== 'mouse') {
                        handleMessageHoldStart(message.id, canManageMessage);
                      }
                    }}
                    onPointerUp={handleMessageHoldEnd}
                    onPointerCancel={handleMessageHoldEnd}
                    onPointerLeave={handleMessageHoldEnd}
                    onContextMenu={(event) => {
                      if (!canManageMessage) {
                        return;
                      }

                      event.preventDefault();
                      clearMessageHoldTimer();
                      setActiveMessageActionId(message.id);
                    }}
                  >
                    <strong>{isOwnMessage ? 'You' : message.senderName}</strong>
                    {canManageMessage && !isEditingMessage && (
                      <div className="message-bubble-actions" aria-label="Message actions">
                        {canEditMessage && (
                          <button
                            type="button"
                            className="message-action-button message-edit-button"
                            aria-label="Edit message"
                            title="Edit message"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleStartEditMessage(message);
                            }}
                          >
                            <MessageEditIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          className="message-action-button message-unsend-button"
                          aria-label="Delete message"
                          title="Delete message"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleUnsendMessage(message.id);
                          }}
                        >
                          <MessageDeleteIcon />
                        </button>
                      </div>
                    )}
                    {isUnsentMessage && (
                      <p className="message-unsent-text">
                        {isOwnMessage ? 'You unsent this message.' : 'This message was unsent.'}
                      </p>
                    )}
                    {!isUnsentMessage && isEditingMessage ? (
                      <form className="message-edit-form" onSubmit={handleSaveEditMessage}>
                        <textarea
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          rows="3"
                          aria-label="Edit room message text"
                        />
                        {editError && <span className="message-edit-error">{editError}</span>}
                        <div className="message-edit-actions">
                          <button type="submit">Save</button>
                          <button type="button" className="secondary-button" onClick={handleCancelEditMessage}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      !isUnsentMessage && message.text && (
                        <>
                          <p>
                            <MentionText text={message.text} />
                          </p>
                          {message.editedAt && <small className="message-edited-label">Edited</small>}
                        </>
                      )
                    )}
                    {!isUnsentMessage && message.voice && (
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
                    {!isUnsentMessage && (message.attachments || []).length > 0 && (
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
                                  <img src={getMessageAssetUrl(attachment)} alt={attachment.name} />
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
                                    <span>{attachment.type || 'Image'} - {formatFileSize(attachment.size)}</span>
                                    <a href={getMessageAssetUrl(attachment)} download={attachment.name}>
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
                              href={getMessageAssetUrl(attachment)}
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
                <h3>No room messages yet</h3>
                <p>Start the first chat message for this room.</p>
              </div>
            )}
          </div>

          <form className="messages-composer room-chat-composer" onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              className="messages-attachment-input"
              accept={MESSAGE_ATTACHMENT_ACCEPT}
              multiple
              onChange={handleAttachmentChange}
            />
            <textarea
              rows="3"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message room. Type @ to mention."
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
            {mentionSuggestions.length > 0 && (
              <div className="mention-suggestions room-mention-suggestions" aria-label="Mention suggestions">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="mention-suggestion-button"
                    onClick={() => setDraft((currentDraft) => appendMention(currentDraft, user))}
                  >
                    @{user.name}
                  </button>
                ))}
              </div>
            )}
            <div className="messages-composer-footer">
              <small>Visible to members.</small>
              <div className="messages-composer-actions">
                <button
                  type="button"
                  className="messages-attachment-button"
                  onClick={handlePickAttachments}
                  disabled={attachmentDrafts.length >= MESSAGE_ATTACHMENT_MAX_COUNT}
                  aria-label="Attach image or file"
                >
                  <span aria-hidden="true" className="messages-attachment-icon" />
                  <span className="messages-voice-button-label">Attach file</span>
                </button>
                <button
                  type="button"
                  className={`messages-voice-button ${isRecordingVoice ? 'messages-voice-button-recording' : ''}`}
                  onClick={isRecordingVoice ? stopVoiceRecording : handleStartVoiceRecording}
                  aria-label={isRecordingVoice ? 'Stop recording voice note' : 'Record voice note'}
                >
                  <span aria-hidden="true" className="messages-voice-icon" />
                  <span className="messages-voice-button-label">
                    {isRecordingVoice ? `Stop ${formatVoiceDuration(recordingSeconds)}` : 'Record voice'}
                  </span>
                </button>
                <button type="submit" disabled={!draft.trim() && attachmentDrafts.length === 0}>Send to room</button>
              </div>
            </div>
          </form>
        </div>
      </section>
      {typeof document !== 'undefined' && imageLightbox
        ? createPortal(imageLightbox, document.body)
        : null}
    </>
  );
};

export default RoomChatPanel;
