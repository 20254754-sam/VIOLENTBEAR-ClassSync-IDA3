import React, { useState } from 'react';
import ForumVoteControls from '../components/ForumVoteControls';

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

const ForumPage = ({ currentUser, posts, onCreatePost, onVote, onComment, onReport }) => {
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tag: 'Request'
  });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});

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

  return (
    <div className="page">
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
                      post.comments.map((comment) => (
                        <div key={comment.id} className="forum-comment">
                          <strong>{comment.userName}</strong>
                          <p>{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="forum-comment forum-comment-empty">
                        <p>No comments yet. Start the thread.</p>
                      </div>
                    )}
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
                        onComment(post.id, text);
                        setCommentDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [post.id]: ''
                        }));
                      }}
                    >
                      Comment
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
