import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ForumVoteControls from '../components/ForumVoteControls';
import {
  appendMention,
  findMentionedUsers,
  getMentionSuggestions,
  splitTextByMentions
} from '../lib/mentions';

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6 3.5a1 1 0 0 1 1 1v.8h9.05a1.75 1.75 0 0 1 1.52 2.62l-1.44 2.46 1.44 2.46a1.75 1.75 0 0 1-1.52 2.62H7V20a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1m1 3.8v5.6h9.05l-1.73-2.95a1 1 0 0 1 0-1.01l1.73-2.94z"
      fill="currentColor"
    />
  </svg>
);

const BackRoomsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M15 5 8 12l7 7M9 12h11"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </svg>
);

const DeleteRoomIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9 4h6m-8 4h10m-8 0 .45 10.2A2 2 0 0 0 11.45 20h1.1a2 2 0 0 0 2-1.8L15 8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const PromoteMemberIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0M17 8h4m-2-2v4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const KickMemberIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0M17 8h4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);
import NoteList from '../components/NoteList';
import RoomChatPanel from '../components/RoomChatPanel';
import UserAvatar from '../components/UserAvatar';
import UploadForm from '../components/UploadForm';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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

const RoomDetailsPage = ({
  currentUser,
  users,
  rooms,
  roomNotes,
  roomPosts,
  roomMessages,
  editingNote,
  onEdit,
  onCancelEdit,
  onSubmitRoomNote,
  onCreateRoomPost,
  onSendRoomMessage,
  onMarkRoomMessagesRead,
  onUnsendRoomMessage,
  onEditRoomMessage,
  onVotePost,
  onCommentPost,
  onDeletePost,
  onReportPost,
  onToggleLike,
  onDeleteNote,
  onJoinRoom,
  onRefreshRooms,
  onPromoteMember,
  onKickMember,
  onDeleteRoom,
  getRoomLink
}) => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [feedback, setFeedback] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tag: 'Discussion'
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [replyTargets, setReplyTargets] = useState({});
  const [openRoomComments, setOpenRoomComments] = useState({});
  const [showComposer, setShowComposer] = useState(Boolean(editingNote?.roomId === roomId));
  const [showForumComposer, setShowForumComposer] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const room = rooms.find((item) => item.id === roomId);
  const inviteCode = searchParams.get('invite') || '';

  const members = useMemo(() => {
    if (!room) {
      return [];
    }

    return room.memberIds
      .map((memberId) => users.find((user) => user.id === memberId))
      .filter(Boolean);
  }, [room, users]);

  const roomScopedNotes = useMemo(
    () => roomNotes.filter((note) => note.roomId === roomId),
    [roomId, roomNotes]
  );

  const roomScopedPosts = useMemo(
    () =>
      roomPosts
        .filter((post) => post.roomId === roomId)
        .sort((firstPost, secondPost) => {
          const firstScore = firstPost.upvotes.length - firstPost.downvotes.length;
          const secondScore = secondPost.upvotes.length - secondPost.downvotes.length;

          if (firstScore !== secondScore) {
            return secondScore - firstScore;
          }

          return new Date(secondPost.createdAt) - new Date(firstPost.createdAt);
        }),
    [roomId, roomPosts]
  );

  const roomEditingNote = editingNote?.roomId === roomId ? editingNote : null;
  const isMember = room?.memberIds.includes(currentUser.id);
  const isRoomAdmin = currentUser.role === 'admin' || room?.adminIds?.includes(currentUser.id) || room?.ownerId === currentUser.id;
  const isComposerVisible = showComposer || Boolean(roomEditingNote);
  const mentionUsers = members.filter((member) => member.id !== currentUser.id);
  const roomReturnRoute = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    const refreshRooms = () => {
      Promise.resolve(onRefreshRooms?.()).catch(() => undefined);
    };
    const refreshTimer = window.setInterval(refreshRooms, 5000);

    window.addEventListener('focus', refreshRooms);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshRooms);
    };
  }, [onRefreshRooms, room]);

  if (!room) {
    return (
      <div className="page">
        <h1>Room not found</h1>
        <p>The invite link may be invalid or the room may have been removed from Luminote.</p>
        <Link to="/rooms" className="inline-link">Back to rooms</Link>
      </div>
    );
  }

  const copyValue = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback('Copy failed on this device, but you can still copy the text manually.');
    }
  };

  const handleJoinRoom = async () => {
    const result = await onJoinRoom({
      roomId: room.id,
      code: inviteCode || room.code
    });

    setFeedback(result.message);

    if (result.success) {
      Promise.resolve(onRefreshRooms?.()).catch(() => undefined);
    }
  };

  const handleRoomNoteSubmit = (noteInput) => {
    const result = onSubmitRoomNote(room.id, noteInput);
    setFeedback(result.message);

    if (result.success) {
      setShowComposer(false);
    }

    return result;
  };

  const handleDeleteRoom = () => {
    const result = onDeleteRoom?.(room.id, {
      onComplete: (actionResult) => {
        setFeedback(actionResult.message);

        if (actionResult.success) {
          navigate('/rooms', { replace: true });
        }
      }
    });

    if (result?.message) {
      setFeedback(result.message);
    }
  };

  const handleCreatePost = (event) => {
    event.preventDefault();

    if (!postForm.title.trim() || !postForm.body.trim()) {
      setFeedback('Please add a post title and message before sharing in the room.');
      return;
    }

    onCreateRoomPost(room.id, {
      title: postForm.title.trim(),
      body: postForm.body.trim(),
      tag: postForm.tag
    });

    setPostForm({
      title: '',
      body: '',
      tag: 'Discussion'
    });
    setShowForumComposer(false);
    setFeedback('Your room post is now visible to members of this classroom.');
  };

  const submitRoomComment = (postId) => {
    const text = (commentDrafts[postId] || '').trim();

    if (!text) {
      return;
    }

    onCommentPost(postId, text, {
      parentId: replyTargets[postId]?.id || null,
      mentions: findMentionedUsers(text, mentionUsers)
    });
    setOpenRoomComments((current) => ({ ...current, [postId]: true }));
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: ''
    }));
    setReplyTargets((currentTargets) => ({
      ...currentTargets,
      [postId]: null
    }));
  };

  const renderRoomComment = (post, comment, commentsByParent, depth = 0) => {
    const replies = commentsByParent.get(comment.id) || [];
    const commenterPath = comment.userId === currentUser.id ? '/profile' : `/users/${comment.userId}`;
    const returnRoute = `${location.pathname}${location.search}`;

    return (
      <div key={comment.id} className={`forum-comment ${depth > 0 ? 'forum-comment-reply' : ''}`}>
        <div className="forum-comment-header">
          <Link
            to={commenterPath}
            state={{ from: returnRoute }}
            className="forum-comment-author-link"
            onClick={() => sessionStorage.setItem('classsync-profile-return-route', returnRoute)}
          >
            {comment.userName}
          </Link>
          <button
            type="button"
            className="forum-reply-button"
            onClick={() =>
              setReplyTargets((currentTargets) => ({
                ...currentTargets,
                [post.id]: comment
              }))
            }
          >
            Reply
          </button>
        </div>
        <p>
          <MentionText text={comment.text} />
        </p>
        {replies.length > 0 && (
          <div className="forum-comment-replies">
            {replies.map((reply) => renderRoomComment(post, reply, commentsByParent, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page room-details-page">
      <div className="room-hero">
        <div className="room-hero-copy">
          <div className="room-hero-titlebar">
            <Link to="/rooms" className="secondary-button room-back-button">
              <span className="room-toolbar-action-icon">
                <BackRoomsIcon />
              </span>
              <span className="room-toolbar-action-label">Back to rooms</span>
            </Link>
            <span className="dashboard-strip-label">Private classroom</span>
            {isRoomAdmin && (
              <button type="button" className="room-delete-button" onClick={handleDeleteRoom}>
                <span className="room-toolbar-action-icon">
                  <DeleteRoomIcon />
                </span>
                <span className="room-toolbar-action-label">Delete room</span>
              </button>
            )}
          </div>
          <h1>{room.name}</h1>
          <p>{room.description || 'Private notes, chat, and forum for this room.'}</p>
          <div className="room-hero-tags">
            <span className="status-pill status-neutral">{room.subject}</span>
            <span className="ownership-badge ownership-badge-original">Code {room.code}</span>
            <span className="ownership-badge ownership-badge-referenced">Private space</span>
          </div>
          <div className="room-hero-meta">
            <small>By {room.ownerName}</small>
            <small>{members.length} member(s)</small>
            <small>{formatDate(room.createdAt)}</small>
          </div>
        </div>
      </div>

      <div className="room-overview-grid">
        <section className="rooms-list-section room-members-section">
          <div className="rooms-list-header">
            <h2>Members</h2>
            <div className="room-members-header-actions">
              <button
                type="button"
                className="room-members-toggle"
                onClick={() => setShowMembersPanel((current) => !current)}
              >
                {showMembersPanel ? 'Hide members' : 'View members'}
              </button>
              {isMember ? (
                <>
                  <button
                    type="button"
                    className="secondary-button room-access-button"
                    onClick={() => copyValue(room.code, 'Room code copied to your clipboard.')}
                  >
                    Copy code
                  </button>
                  <button
                    type="button"
                    className="secondary-button room-access-button"
                    onClick={() => copyValue(getRoomLink(room), 'Invite link copied to your clipboard.')}
                  >
                    Invite link
                  </button>
                </>
              ) : (
                <button type="button" className="room-access-button" onClick={handleJoinRoom}>
                  Join room
                </button>
              )}
            </div>
          </div>
          {feedback && <div className="rooms-feedback room-feedback-inline">{feedback}</div>}

          {showMembersPanel && (
            <div className="room-members-list">
              {members.map((member) => {
                const memberIsOwner = member.id === room.ownerId;
                const memberIsAdmin = room.adminIds?.includes(member.id) || memberIsOwner;
                const memberProfilePath = member.id === currentUser.id ? '/profile' : `/users/${member.id}`;

                return (
                  <article key={member.id} className="room-member-row">
                    <Link
                      to={memberProfilePath}
                      state={{ from: roomReturnRoute }}
                      className="room-member-main"
                      onClick={() => sessionStorage.setItem('classsync-profile-return-route', roomReturnRoute)}
                    >
                      <UserAvatar user={member} size="sm" />
                      <div className="room-member-copy">
                        <div className="room-member-name-row">
                          <strong>{member.name}</strong>
                          <span className="status-pill status-neutral">{member.role}</span>
                        </div>
                        <p>{member.bio || member.email}</p>
                        <small>{member.email}</small>
                      </div>
                    </Link>
                    <div className="room-member-badges">
                      <span className="ownership-badge ownership-badge-original">
                        {memberIsOwner ? 'Owner' : memberIsAdmin ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    {isRoomAdmin && member.id !== currentUser.id && (
                      <div className="room-member-actions">
                        {!memberIsAdmin && (
                          <button
                            type="button"
                            className="secondary-button room-member-action-button room-member-promote-button"
                            aria-label={`Make ${member.name} a room admin`}
                            title="Make admin"
                            onClick={() => {
                              onPromoteMember(room.id, member.id);
                              setFeedback(`${member.name} is now a room admin.`);
                            }}
                          >
                            <span className="room-member-action-icon">
                              <PromoteMemberIcon />
                            </span>
                            <span className="room-member-action-label">Make admin</span>
                          </button>
                        )}
                        {!memberIsOwner && (
                          <button
                            type="button"
                            className="card-link-button card-link-button-danger room-member-action-button room-member-kick-button"
                            aria-label={`Kick ${member.name} from the room`}
                            title="Kick member"
                            onClick={() => {
                              onKickMember(room.id, member.id);
                              setFeedback(`${member.name} was removed from the room.`);
                            }}
                          >
                            <span className="room-member-action-icon">
                              <KickMemberIcon />
                            </span>
                            <span className="room-member-action-label">Kick member</span>
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isMember && (
        <RoomChatPanel
          room={room}
          members={members}
          currentUser={currentUser}
          messages={roomMessages}
          onSendRoomMessage={onSendRoomMessage}
          onMarkRoomMessagesRead={onMarkRoomMessagesRead}
          onUnsendRoomMessage={onUnsendRoomMessage}
          onEditRoomMessage={onEditRoomMessage}
        />
      )}

      {isMember && (
        <>
          <section className="rooms-list-section room-private-notes-section">
            <div className="rooms-list-header room-section-header">
              <div>
                <h2>Private notes</h2>
                <p>Room-only uploads.</p>
              </div>

              <div className="room-section-header-actions">
                <button type="button" onClick={() => setShowComposer((current) => !current)}>
                  {roomEditingNote ? 'Continue editing' : isComposerVisible ? 'Hide uploader' : 'Upload note'}
                </button>
                {roomEditingNote && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      onCancelEdit();
                      setShowComposer(false);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </div>

            {isComposerVisible && (
              <div className="room-composer-card">
                <UploadForm
                  editingNote={roomEditingNote}
                  onSubmit={handleRoomNoteSubmit}
                  onCancelEdit={() => {
                    onCancelEdit();
                    setShowComposer(false);
                  }}
                />
              </div>
            )}

            {roomScopedNotes.length > 0 ? (
              <NoteList
                notes={roomScopedNotes}
                currentUser={currentUser}
                onToggleLike={onToggleLike}
                onDelete={onDeleteNote}
                onEdit={onEdit}
                detailPathBuilder={(note) => `/rooms/${room.id}/note/${note.id}`}
                editPathBuilder={() => `/rooms/${room.id}`}
              />
            ) : (
              <div className="profile-empty-state">
                <h3>No room notes yet</h3>
                <p>Upload the first room note.</p>
              </div>
            )}
          </section>

          <section className="rooms-list-section room-private-forum-section">
            <div className="rooms-list-header room-section-header">
              <div>
                <h2>Room forum</h2>
                <p>Room-only questions and ideas.</p>
              </div>

              <div className="room-section-header-actions">
                <button type="button" onClick={() => setShowForumComposer((current) => !current)}>
                  {showForumComposer ? 'Hide composer' : 'New post'}
                </button>
              </div>
            </div>

            {showForumComposer && (
              <form className="forum-form room-forum-composer" onSubmit={handleCreatePost}>
                <div className="forum-form-grid">
                  <input
                    value={postForm.title}
                    onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Post title"
                  />
                  <select
                    value={postForm.tag}
                    onChange={(event) => setPostForm((current) => ({ ...current, tag: event.target.value }))}
                  >
                    <option value="Discussion">Discussion</option>
                    <option value="Request">Request</option>
                    <option value="Idea">Idea</option>
                  </select>
                </div>
                <textarea
                  value={postForm.body}
                  onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
                  rows="4"
                  placeholder="Share a room-only question, note request, or idea"
                />
                <button type="submit">Post to room forum</button>
              </form>
            )}

            {roomScopedPosts.length > 0 ? (
              <div className="forum-list">
                {roomScopedPosts.map((post) => (
                  <article key={post.id} className="forum-post">
                    <ForumVoteControls post={post} currentUser={currentUser} onVote={onVotePost} />

                    <div className="forum-post-body">
                      <div className="forum-post-meta">
                        <div className="forum-post-meta-copy">
                          <span className="status-pill status-neutral">{post.tag}</span>
                          <small>
                            {post.authorName} - {formatDate(post.createdAt)}
                          </small>
                        </div>
                        <div className="forum-post-action-row">
                          {(currentUser.role === 'admin' || isRoomAdmin || currentUser.id === post.authorId) && (
                            <button
                              type="button"
                              className="forum-delete-button"
                              onClick={() => {
                                const result = onDeletePost(post.id, {
                                  context: 'room',
                                  onComplete: (actionResult) => setFeedback(actionResult.message)
                                });

                                if (result?.message) {
                                  setFeedback(result.message);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                          {currentUser.id !== post.authorId && (
                            <button
                              type="button"
                              className="report-icon-button"
                              aria-label={`Report post: ${post.title}`}
                              onClick={() =>
                                onReportPost({
                                  targetId: post.id,
                                  targetType: 'forum-post',
                                  targetTitle: post.title,
                                  roomId: room.id
                                })
                              }
                            >
                              <ReportIcon />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.body}</p>

                      <div className="forum-comment-toggle-row">
                        <button
                          type="button"
                          className="forum-comment-toggle"
                          onClick={() =>
                            setOpenRoomComments((current) => ({
                              ...current,
                              [post.id]: !current[post.id]
                            }))
                          }
                        >
                          {openRoomComments[post.id] ? 'Hide comments' : `Show comments (${post.comments.length})`}
                        </button>
                      </div>

                      {openRoomComments[post.id] && (
                        <>
                          <div className="forum-comment-list">
                            {post.comments.length > 0 ? (
                              (() => {
                                const commentsByParent = post.comments.reduce((groups, comment) => {
                                  const parentKey = comment.parentId || 'root';
                                  groups.set(parentKey, [...(groups.get(parentKey) || []), comment]);
                                  return groups;
                                }, new Map());

                                return (commentsByParent.get('root') || []).map((comment) =>
                                  renderRoomComment(post, comment, commentsByParent)
                                );
                              })()
                            ) : (
                              <div className="forum-comment forum-comment-empty">
                                <p>No comments yet. Start the room thread.</p>
                              </div>
                            )}
                          </div>

                          <div className="forum-comment-form">
                            {replyTargets[post.id] && (
                              <div className="forum-comment-replying">
                                Replying to {replyTargets[post.id].userName}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyTargets((currentTargets) => ({
                                      ...currentTargets,
                                      [post.id]: null
                                    }))
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            <textarea
                              rows="2"
                              value={commentDrafts[post.id] || ''}
                              placeholder={`Reply as ${currentUser.name}. Type @ to mention a member.`}
                              onChange={(event) =>
                                setCommentDrafts((currentDrafts) => ({
                                  ...currentDrafts,
                                  [post.id]: event.target.value
                                }))
                              }
                            />
                            {getMentionSuggestions(commentDrafts[post.id] || '', mentionUsers).length > 0 && (
                              <div className="mention-suggestions" aria-label="Mention suggestions">
                                {getMentionSuggestions(commentDrafts[post.id] || '', mentionUsers).map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    className="mention-suggestion-button"
                                    onClick={() =>
                                      setCommentDrafts((currentDrafts) => ({
                                        ...currentDrafts,
                                        [post.id]: appendMention(currentDrafts[post.id] || '', user)
                                      }))
                                    }
                                  >
                                    @{user.name}
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => submitRoomComment(post.id)}
                            >
                              {replyTargets[post.id] ? 'Reply' : 'Comment'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-empty-state">
                <h3>No room posts yet</h3>
                <p>Start the first room discussion.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default RoomDetailsPage;
