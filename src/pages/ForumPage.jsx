import React, { useState } from 'react';
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

const ForumPage = ({ currentUser, users = [], posts, onCreatePost, onVote, onComment, onReport }) => {
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tag: 'Request'
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [replyTargets, setReplyTargets] = useState({});

  const mentionUsers = users.filter((user) => user.id !== currentUser.id);

  const handleCreatePost = (event) => {
    event.preventDefault();

    if (!postForm.title.trim() || !postForm.body.trim()) {
      return;
    }

    onCreatePost({
      title: postForm.title.trim(),
      body: postForm.body.trim(),
      tag: postForm.tag
    });

    setPostForm({
      title: '',
      body: '',
      tag: 'Request'
    });
  };

  const submitComment = (postId) => {
    const text = (commentDrafts[postId] || '').trim();

    if (!text) {
      return;
    }

    onComment(postId, text, {
      parentId: replyTargets[postId]?.id || null,
      mentions: findMentionedUsers(text, mentionUsers)
    });
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: ''
    }));
    setReplyTargets((currentTargets) => ({
      ...currentTargets,
      [postId]: null
    }));
  };

  const renderComment = (post, comment, commentsByParent, depth = 0) => {
    const replies = commentsByParent.get(comment.id) || [];

    return (
      <div key={comment.id} className={`forum-comment ${depth > 0 ? 'forum-comment-reply' : ''}`}>
        <div className="forum-comment-header">
          <strong>{comment.userName}</strong>
          <button
            type="button"
            className="forum-reply-button"
            onClick={() => {
              setOpenComments((current) => ({
                ...current,
                [post.id]: true
              }));
              setReplyTargets((currentTargets) => ({
                ...currentTargets,
                [post.id]: comment
              }));
            }}
          >
            Reply
          </button>
        </div>
        <p>
          <MentionText text={comment.text} />
        </p>
        {replies.length > 0 && (
          <div className="forum-comment-replies">
            {replies.map((reply) => renderComment(post, reply, commentsByParent, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page forum-page">
      <h1>Community Forum</h1>
      <div className="upload-subtitle">
        <p>Ask for notes, share ideas, and help your classmates.</p>
        <p>This works like a lightweight classroom discussion board.</p>
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
            <option value="Request">Request</option>
            <option value="Idea">Idea</option>
            <option value="Discussion">Discussion</option>
          </select>
        </div>
        <textarea
          value={postForm.body}
          onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
          rows="4"
          placeholder="What notes do you need or what idea do you want to share?"
        />
        <button type="submit">Post to Forum</button>
      </form>

      <div className="forum-list">
        {posts.map((post) => (
          <article key={post.id} className="forum-post">
            <ForumVoteControls post={post} currentUser={currentUser} onVote={onVote} />

            <div className="forum-post-body">
              <div className="forum-post-meta">
                <div className="forum-post-meta-copy">
                  <span className="status-pill status-neutral">{post.tag}</span>
                  <small>
                    {post.authorName} - {formatDate(post.createdAt)}
                  </small>
                </div>
                {currentUser.id !== post.authorId && (
                  <button
                    type="button"
                    className="report-icon-button"
                    aria-label={`Report post: ${post.title}`}
                    onClick={() =>
                      onReport({
                        targetId: post.id,
                        targetType: 'forum-post',
                        targetTitle: post.title,
                        roomId: post.roomId
                      })
                    }
                  >
                    <ReportIcon />
                  </button>
                )}
              </div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div className="forum-comment-toggle-row">
                <button
                  type="button"
                  className="forum-comment-toggle"
                  onClick={() =>
                    setOpenComments((current) => ({
                      ...current,
                      [post.id]: !current[post.id]
                    }))
                  }
                >
                  {openComments[post.id] ? 'Hide comments' : `Show comments (${post.comments.length})`}
                </button>
              </div>

              {openComments[post.id] && (
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
                          renderComment(post, comment, commentsByParent)
                        );
                      })()
                    ) : (
                      <div className="forum-comment forum-comment-empty">
                        <p>No comments yet. Start the thread.</p>
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
                      placeholder={`Reply as ${currentUser.name}. Type @ to mention someone.`}
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
                      onClick={() => submitComment(post.id)}
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
    </div>
  );
};

export default ForumPage;
