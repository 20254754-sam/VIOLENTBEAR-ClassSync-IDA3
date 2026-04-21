import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import UploadPage from './pages/UploadPage';
import NoteDetailsPage from './pages/NoteDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ForumPage from './pages/ForumPage';
import './App.css';

const STORAGE_KEYS = {
  notes: 'classsync-notes-v2',
  forum: 'classsync-forum-v2',
  user: 'classsync-user-v2',
  theme: 'classsync-theme-v2',
  users: 'classsync-users-v1'
};

const DEMO_USERS = [
  {
    id: 'student-1',
    name: 'Sample Student',
    email: 'student@classsync.demo',
    password: 'student123',
    role: 'student',
    bio: 'BSIT student who shares concise reviewers and practical study notes.'
  },
  {
    id: 'admin-1',
    name: 'ClassSync Admin',
    email: 'admin@classsync.demo',
    password: 'admin123',
    role: 'admin',
    bio: 'Reviews submitted notes before they become visible to the whole community.'
  }
];

const INITIAL_NOTES = [
  {
    id: 1,
    title: 'React Hooks Guide',
    subject: 'Web Development',
    content:
      'A practical guide to useState, useEffect, lifting state, and organizing reusable logic with custom hooks. Includes common pitfalls and quick examples for class discussions.',
    isOwnWork: true,
    source: null,
    uploaderId: 'mentor-1',
    uploaderName: 'Alice',
    status: 'approved',
    createdAt: '2026-04-12T09:00:00.000Z',
    updatedAt: '2026-04-12T09:00:00.000Z',
    likes: ['student-1'],
    reviews: [
      {
        id: 101,
        userId: 'student-1',
        userName: 'Sam Student',
        rating: 5,
        text: 'Clear and easy to review before quizzes.',
        createdAt: '2026-04-13T08:30:00.000Z'
      }
    ]
  },
  {
    id: 2,
    title: 'Calculus Review Sheet',
    subject: 'Mathematics',
    content:
      'Derivative shortcuts, integration patterns, limits, and sample problem reminders. Organized for quick exam preparation and formula recall.',
    isOwnWork: false,
    source: {
      type: 'Book',
      title: 'Calculus Early Transcendentals',
      author: 'James Stewart',
      link: '',
      year: '2016'
    },
    uploaderId: 'mentor-2',
    uploaderName: 'Bob',
    status: 'approved',
    createdAt: '2026-04-10T08:15:00.000Z',
    updatedAt: '2026-04-10T08:15:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 3,
    title: 'SQL Query Reviewers',
    subject: 'Database Systems',
    content:
      'Compact notes on joins, grouping, subqueries, normalization, and common SQL statements used in lab activities and machine exams.',
    isOwnWork: true,
    source: null,
    uploaderId: 'mentor-3',
    uploaderName: 'Carol',
    status: 'approved',
    createdAt: '2026-04-09T06:45:00.000Z',
    updatedAt: '2026-04-09T06:45:00.000Z',
    likes: ['student-1'],
    reviews: []
  }
];

const INITIAL_FORUM_POSTS = [
  {
    id: 1,
    title: 'Looking for networking reviewers',
    body: 'Does anyone have concise notes for subnetting and common protocols?',
    tag: 'Request',
    authorId: 'student-1',
    authorName: 'Sam Student',
    createdAt: '2026-04-18T04:00:00.000Z',
    upvotes: [],
    downvotes: [],
    comments: [
      {
        id: 11,
        userId: 'mentor-1',
        userName: 'Alice',
        text: 'I can upload one later today after class.',
        createdAt: '2026-04-18T05:15:00.000Z'
      }
    ]
  },
  {
    id: 2,
    title: 'Idea: weekly reviewer exchange',
    body: 'Maybe we can post one best reviewer every Friday so everyone benefits.',
    tag: 'Idea',
    authorId: 'mentor-2',
    authorName: 'Bob',
    createdAt: '2026-04-17T03:30:00.000Z',
    upvotes: ['student-1'],
    downvotes: [],
    comments: []
  }
];

const readStorage = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const sortNewest = (items) =>
  [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

const normalizeForumPosts = (posts) =>
  posts.map((post) => {
    const uniqueUpvotes = [...new Set(post.upvotes || [])];
    const uniqueDownvotes = [...new Set(post.downvotes || [])].filter(
      (userId) => !uniqueUpvotes.includes(userId)
    );

    return {
      ...post,
      upvotes: uniqueUpvotes,
      downvotes: uniqueDownvotes
    };
  });

function App() {
  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, DEMO_USERS));
  const [notes, setNotes] = useState(() => readStorage(STORAGE_KEYS.notes, INITIAL_NOTES));
  const [forumPosts, setForumPosts] = useState(() =>
    normalizeForumPosts(readStorage(STORAGE_KEYS.forum, INITIAL_FORUM_POSTS))
  );
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.user, null));
  const [theme, setTheme] = useState(() => readStorage(STORAGE_KEYS.theme, 'light'));
  const [editingNoteId, setEditingNoteId] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.forum, JSON.stringify(forumPosts));
  }, [forumPosts]);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [currentUser]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const publicNotes = useMemo(
    () => sortNewest(notes.filter((note) => note.status === 'approved')),
    [notes]
  );

  const visibleNotes = useMemo(() => {
    if (!currentUser) {
      return publicNotes;
    }

    if (currentUser.role === 'admin') {
      return sortNewest(notes);
    }

    return sortNewest(
      notes.filter((note) => note.status === 'approved' || note.uploaderId === currentUser.id)
    );
  }, [currentUser, notes, publicNotes]);

  const userNotes = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return sortNewest(notes.filter((note) => note.uploaderId === currentUser.id));
  }, [currentUser, notes]);

  const pendingNotes = useMemo(
    () => sortNewest(notes.filter((note) => note.status === 'pending')),
    [notes]
  );

  const editingNote = useMemo(
    () => notes.find((note) => note.id === editingNoteId) || null,
    [editingNoteId, notes]
  );

  const handleLogin = ({ email, password }) => {
    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Invalid email or password. Use one of the demo accounts shown below.'
      };
    }

    const sessionUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
      bio: matchedUser.bio
    };

    setCurrentUser(sessionUser);
    return {
      success: true,
      message: `Welcome back, ${matchedUser.name}.`
    };
  };

  const handleRegister = ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim() || !normalizedEmail || !password.trim()) {
      return {
        success: false,
        message: 'Please complete your name, email, and password.'
      };
    }

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return {
        success: false,
        message: 'That email is already registered. Please log in instead.'
      };
    }

    const newUser = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: 'student',
      bio: 'New ClassSync member ready to share helpful notes.'
    };

    setUsers((previousUsers) => [...previousUsers, newUser]);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      bio: newUser.bio
    };

    setCurrentUser(sessionUser);

    return {
      success: true,
      message: `Account created. Welcome to ClassSync, ${newUser.name}.`
    };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditingNoteId(null);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const startEditingNote = (noteId) => {
    setEditingNoteId(noteId);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
  };

  const handleSaveNote = (noteInput) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before submitting a note.'
      };
    }

    const now = new Date().toISOString();
    const nextStatus = currentUser.role === 'admin' ? 'approved' : 'pending';

    if (editingNoteId) {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === editingNoteId
            ? {
                ...note,
                ...noteInput,
                status: nextStatus,
                updatedAt: now
              }
            : note
        )
      );

      setEditingNoteId(null);

      return {
        success: true,
        message:
          currentUser.role === 'admin'
            ? 'Note updated successfully.'
            : 'Note updated and sent back to admin for review.'
      };
    }

    const newNote = {
      id: Date.now(),
      ...noteInput,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      status: nextStatus,
      createdAt: now,
      updatedAt: now,
      likes: [],
      reviews: []
    };

    setNotes((previousNotes) => [newNote, ...previousNotes]);

    return {
      success: true,
      message:
        currentUser.role === 'admin'
          ? 'Note published successfully.'
          : 'Note submitted successfully. It is now waiting for admin approval.'
    };
  };

  const handleDeleteNote = (noteId) => {
    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }
  };

  const handleToggleLike = (noteId) => {
    if (!currentUser) {
      return;
    }

    setNotes((previousNotes) =>
      previousNotes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        const alreadyLiked = note.likes.includes(currentUser.id);

        return {
          ...note,
          likes: alreadyLiked
            ? note.likes.filter((userId) => userId !== currentUser.id)
            : [...note.likes, currentUser.id]
        };
      })
    );
  };

  const handleSubmitReview = (noteId, reviewInput) => {
    if (!currentUser) {
      return;
    }

    const reviewPayload = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      rating: reviewInput.rating,
      text: reviewInput.text,
      createdAt: new Date().toISOString()
    };

    setNotes((previousNotes) =>
      previousNotes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        const existingReview = note.reviews.find((review) => review.userId === currentUser.id);

        return {
          ...note,
          reviews: existingReview
            ? note.reviews.map((review) =>
                review.userId === currentUser.id ? { ...review, ...reviewPayload, id: review.id } : review
              )
            : [reviewPayload, ...note.reviews]
        };
      })
    );
  };

  const handleApproveNote = (noteId) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === noteId ? { ...note, status: 'approved', updatedAt: new Date().toISOString() } : note
      )
    );
  };

  const handleRejectNote = (noteId) => {
    const rejectionReason =
      window.prompt('Add a short reason for rejection so the uploader knows what to improve:', 'Please revise formatting or source details.') ||
      'Please revise this note and submit it again.';

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              status: 'rejected',
              rejectionReason,
              updatedAt: new Date().toISOString()
            }
          : note
      )
    );
  };

  const handleCreateForumPost = (postInput) => {
    if (!currentUser) {
      return;
    }

    const newPost = {
      id: Date.now(),
      title: postInput.title,
      body: postInput.body,
      tag: postInput.tag,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      upvotes: [],
      downvotes: [],
      comments: []
    };

    setForumPosts((previousPosts) => [newPost, ...previousPosts]);
  };

  const handleVoteForumPost = (postId, direction) => {
    if (!currentUser) {
      return;
    }

    setForumPosts((previousPosts) =>
      normalizeForumPosts(previousPosts).map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const upvoteSet = new Set(post.upvotes);
        const downvoteSet = new Set(post.downvotes);
        const hasUpvoted = upvoteSet.has(currentUser.id);
        const hasDownvoted = downvoteSet.has(currentUser.id);

        if (direction === 'up') {
          if (hasUpvoted) {
            upvoteSet.delete(currentUser.id);
            return {
              ...post,
              upvotes: [...upvoteSet],
              downvotes: [...downvoteSet]
            };
          }

          downvoteSet.delete(currentUser.id);
          upvoteSet.add(currentUser.id);

          return {
            ...post,
            upvotes: [...upvoteSet],
            downvotes: [...downvoteSet]
          };
        }

        if (hasDownvoted) {
          downvoteSet.delete(currentUser.id);
          return {
            ...post,
            upvotes: [...upvoteSet],
            downvotes: [...downvoteSet]
          };
        }

        const currentScore = post.upvotes.length - post.downvotes.length;
        if (currentScore <= 0 && !hasUpvoted) {
          return post;
        }

        upvoteSet.delete(currentUser.id);
        downvoteSet.add(currentUser.id);

        return {
          ...post,
          upvotes: [...upvoteSet],
          downvotes: [...downvoteSet]
        };
      })
    );
  };

  const handleCommentOnPost = (postId, commentText) => {
    if (!currentUser) {
      return;
    }

    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      createdAt: new Date().toISOString()
    };

    setForumPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post
      )
    );
  };

  const sortedForumPosts = useMemo(
    () =>
      normalizeForumPosts(forumPosts).sort((firstPost, secondPost) => {
        const firstScore = firstPost.upvotes.length - firstPost.downvotes.length;
        const secondScore = secondPost.upvotes.length - secondPost.downvotes.length;

        if (firstScore !== secondScore) {
          return secondScore - firstScore;
        }

        return new Date(secondPost.createdAt) - new Date(firstPost.createdAt);
      }),
    [forumPosts]
  );

  if (!currentUser) {
    return (
      <div className="app">
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={handleLogin}
                onRegister={handleRegister}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        pendingCount={pendingNotes.length}
      />

      <main className="main">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              <HomePage
                notes={publicNotes}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteNote}
                onEdit={startEditingNote}
              />
            }
          />
          <Route
            path="/browse"
            element={
              <BrowsePage
                notes={publicNotes}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteNote}
                onEdit={startEditingNote}
              />
            }
          />
          <Route
            path="/upload"
            element={
              <UploadPage
                notes={notes}
                currentUser={currentUser}
                editingNote={editingNote}
                onSubmit={handleSaveNote}
                onCancelEdit={cancelEditingNote}
              />
            }
          />
          <Route
            path="/note/:id"
            element={
              <NoteDetailsPage
                notes={visibleNotes}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteNote}
                onEdit={startEditingNote}
                onSubmitReview={handleSubmitReview}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                notes={userNotes}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteNote}
                onEdit={startEditingNote}
              />
            }
          />
          <Route
            path="/forum"
            element={
              <ForumPage
                currentUser={currentUser}
                posts={sortedForumPosts}
                onCreatePost={handleCreateForumPost}
                onVote={handleVoteForumPost}
                onComment={handleCommentOnPost}
              />
            }
          />
          <Route
            path="/admin"
            element={
              currentUser.role === 'admin' ? (
                <AdminPage
                  pendingNotes={pendingNotes}
                  allNotes={sortNewest(notes)}
                  onApprove={handleApproveNote}
                  onReject={handleRejectNote}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
