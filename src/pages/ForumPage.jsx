import React, { useState } from 'react';

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const ForumPage = ({ currentUser, posts, onCreatePost, onVote, onComment }) => {
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tag: 'Request'
  });
  const [commentDrafts, setCommentDrafts] = useState({});

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
        {posts.map((post) => {
          const score = Math.max(0, post.upvotes.length - post.downvotes.length);

          return (
            <article key={post.id} className="forum-post">
              <div className="forum-vote-panel">
                <button type="button" className="forum-vote-button" onClick={() => onVote(post.id, 'up')}>
                  <span className="forum-vote-arrow">▲</span>
                  <span className="forum-vote-label">Up</span>
                </button>
                <strong>{score}</strong>
                <button type="button" className="forum-vote-button" onClick={() => onVote(post.id, 'down')}>
                  <span className="forum-vote-label">Down</span>
                  <span className="forum-vote-arrow">▼</span>
                </button>
              </div>

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
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ForumPage;
