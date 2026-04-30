import React from 'react';

const ForumVoteControls = ({ post, currentUser, onVote }) => {
  const score = post.upvotes.length - post.downvotes.length;
  const hasLiked = currentUser ? post.upvotes.includes(currentUser.id) : false;
  const hasDisliked = currentUser ? post.downvotes.includes(currentUser.id) : false;

  return (
    <div className="forum-vote-panel">
      <strong>{score > 0 ? `+${score}` : score}</strong>
      <span className="forum-vote-total">Up score</span>
      <button
        type="button"
        className={`forum-vote-button ${hasLiked ? 'forum-vote-button-active forum-vote-button-like' : ''}`}
        onClick={() => onVote(post.id, 'up')}
        aria-pressed={hasLiked}
        aria-label="Like this post"
      >
        <span className="forum-vote-icon" aria-hidden="true">
          👍
        </span>
        <span className="forum-vote-count">{post.upvotes.length}</span>
      </button>
      <button
        type="button"
        className={`forum-vote-button ${hasDisliked ? 'forum-vote-button-active forum-vote-button-dislike' : ''}`}
        onClick={() => onVote(post.id, 'down')}
        aria-pressed={hasDisliked}
        aria-label="Reverse like this post"
      >
        <span className="forum-vote-icon" aria-hidden="true">
          👎
        </span>
        <span className="forum-vote-count">{post.downvotes.length}</span>
      </button>
    </div>
  );
};

export default ForumVoteControls;
