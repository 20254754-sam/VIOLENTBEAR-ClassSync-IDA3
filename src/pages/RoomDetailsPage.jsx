import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ForumVoteControls from '../components/ForumVoteControls';
import NoteList from '../components/NoteList';
import UploadForm from '../components/UploadForm';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const RoomDetailsPage = ({
  currentUser,
  users,
  rooms,
  roomNotes,
  roomPosts,
  editingNote,
  onEdit,
  onCancelEdit,
  onSubmitRoomNote,
  onCreateRoomPost,
  onVotePost,
  onCommentPost,
  onToggleLike,
  onDeleteNote,
  onJoinRoom,
  onPromoteMember,
  onKickMember,
  getRoomLink
}) => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const [feedback, setFeedback] = useState('');
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tag: 'Discussion'
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [showComposer, setShowComposer] = useState(Boolean(editingNote?.roomId === roomId));
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
  const isRoomAdmin = room?.adminIds?.includes(currentUser.id) || room?.ownerId === currentUser.id;
  const isComposerVisible = showComposer || Boolean(roomEditingNote);

  if (!room) {
    return (
      <div className="page">
        <h1>Room not found</h1>
        <p>The invite link may be invalid or the room may have been removed from ClassSync.</p>
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

  const handleJoinRoom = () => {
    const result = onJoinRoom({
      roomId: room.id,
      code: inviteCode || room.code
    });

    setFeedback(result.message);
  };

  const handleRoomNoteSubmit = (noteInput) => {
    const result = onSubmitRoomNote(room.id, noteInput);
    setFeedback(result.message);

    if (result.success) {
      setShowComposer(false);
    }

    return result;
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
    setFeedback('Your room post is now visible to members of this classroom.');
  };

  return (
    <div className="page">
      <div className="room-hero">
        <div className="room-hero-copy">
          <span className="dashboard-strip-label">Private classroom</span>
          <h1>{room.name}</h1>
          <p>{room.description || 'A private classroom-style room where students can gather through an invite.'}</p>
          <div className="room-hero-tags">
            <span className="status-pill status-neutral">{room.subject}</span>
            <span className="ownership-badge ownership-badge-original">Code {room.code}</span>
            <span className="ownership-badge ownership-badge-referenced">Private space</span>
          </div>
          <div className="room-hero-meta">
            <small>Created by {room.ownerName}</small>
            <small>{members.length} member(s)</small>
            <small>{formatDate(room.createdAt)}</small>
          </div>
        </div>

        <div className="room-hero-card">
          <h2>{isMember ? 'Room access unlocked' : 'Join this room'}</h2>
          <p>
            {isMember
              ? 'Inside this room, only members can view the notes, uploads, and discussions shared here.'
              : 'This invite points to a private classroom space. Join first to see its notes and discussions.'}
          </p>
          <div className="room-card-actions">
            {isMember ? (
              <>
                <button
                  type="button"
                  onClick={() => copyValue(room.code, 'Room code copied to your clipboard.')}
                >
                  Copy room code
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => copyValue(getRoomLink(room), 'Invite link copied to your clipboard.')}
                >
                  Copy invite link
                </button>
              </>
            ) : (
              <button type="button" onClick={handleJoinRoom}>
                Join room
              </button>
            )}
          </div>
          {feedback && <div className="rooms-feedback room-feedback-inline">{feedback}</div>}
        </div>
      </div>

      <section className="rooms-list-section">
        <div className="rooms-list-header">
          <h2>Members</h2>
          <p>Only these people can view this private classroom server.</p>
        </div>
        <div className="room-card-actions room-toolbar">
          <button
            type="button"
            className="room-members-toggle"
            onClick={() => setShowMembersPanel((current) => !current)}
          >
            {showMembersPanel ? 'Hide members' : 'View members'}
          </button>
        </div>

        {showMembersPanel && (
          <div className="rooms-grid">
            {members.map((member) => {
              const memberIsOwner = member.id === room.ownerId;
              const memberIsAdmin = room.adminIds?.includes(member.id) || memberIsOwner;

              return (
                <article key={member.id} className="room-card room-member-card">
                  <div className="room-card-top">
                    <span className="ownership-badge ownership-badge-original">
                      {memberIsOwner ? 'Room owner' : memberIsAdmin ? 'Room admin' : 'Member'}
                    </span>
                    <span className="status-pill status-neutral">{member.role}</span>
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.bio}</p>
                  <div className="room-card-meta">
                    <small>{member.email}</small>
                  </div>
                  {isRoomAdmin && member.id !== currentUser.id && (
                    <div className="room-member-actions">
                      {!memberIsAdmin && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            onPromoteMember(room.id, member.id);
                            setFeedback(`${member.name} is now a room admin.`);
                          }}
                        >
                          Make admin
                        </button>
                      )}
                      {!memberIsOwner && (
                        <button
                          type="button"
                          className="card-link-button card-link-button-danger"
                          onClick={() => {
                            onKickMember(room.id, member.id);
                            setFeedback(`${member.name} was removed from the room.`);
                          }}
                        >
                          Kick member
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

      {isMember && (
        <>
          <section className="rooms-list-section">
            <div className="rooms-list-header">
              <h2>Private notes</h2>
              <p>These uploads are visible only to room members, not on the public server.</p>
            </div>

            <div className="room-card-actions room-toolbar">
              <button type="button" onClick={() => setShowComposer((current) => !current)}>
                {roomEditingNote ? 'Continue editing note' : isComposerVisible ? 'Hide room uploader' : 'Upload to room'}
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
                  Cancel room edit
                </button>
              )}
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
                <p>Upload the first private note for this classroom and it will stay visible only to members.</p>
              </div>
            )}
          </section>

          <section className="rooms-list-section">
            <div className="rooms-list-header">
              <h2>Private room forum</h2>
              <p>Ask room-specific questions, request notes, and share ideas only with members here.</p>
            </div>

            <form className="forum-form" onSubmit={handleCreatePost}>
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

            {roomScopedPosts.length > 0 ? (
              <div className="forum-list">
                {roomScopedPosts.map((post) => (
                  <article key={post.id} className="forum-post">
                    <ForumVoteControls post={post} currentUser={currentUser} onVote={onVotePost} />

                    <div className="forum-post-body">
                      <div className="forum-post-meta">
                        <span className="status-pill status-neutral">{post.tag}</span>
                        <small>
                          {post.authorName} - {formatDate(post.createdAt)}
                        </small>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.body}</p>

                      <div className="forum-comment-list">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="forum-comment">
                            <strong>{comment.userName}</strong>
                            <p>{comment.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="forum-comment-form">
                        <textarea
                          rows="2"
                          value={commentDrafts[post.id] || ''}
                          placeholder={`Reply as ${currentUser.name}`}
                          onChange={(event) =>
                            setCommentDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [post.id]: event.target.value
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const text = (commentDrafts[post.id] || '').trim();
                            if (!text) {
                              return;
                            }
                            onCommentPost(post.id, text);
                            setCommentDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [post.id]: ''
                            }));
                          }}
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="profile-empty-state">
                <h3>No room posts yet</h3>
                <p>Start the first private discussion so members can talk inside this room only.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default RoomDetailsPage;
