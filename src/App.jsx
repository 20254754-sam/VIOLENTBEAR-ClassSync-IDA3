import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppModal from './components/AppModal';
import Footer from './components/Footer';
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
  },
  {
    id: 4,
    title: 'How To Upload Notes Properly',
    subject: 'Study Guide',
    content:
      'Before uploading, prepare a clear title, choose the correct subject, and review your note for spelling or missing parts. If the note is your own work, select the original work option. If you used a book, website, lecture, or another source, choose the referenced option and complete the source details. Keep the content organized with headings, short paragraphs, and important points that classmates can scan quickly. After submission, student uploads will wait for admin review before they appear publicly.',
    isOwnWork: true,
    source: null,
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-15T09:20:00.000Z',
    updatedAt: '2026-04-15T09:20:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 5,
    title: 'Java Abstract Classes And Interfaces',
    subject: 'Java Programming',
    content:
      'An abstract class is a class that cannot be instantiated directly. It is used when related classes should share common fields, methods, or partial behavior. Abstract classes can have both abstract methods and concrete methods. An interface is used to define a contract that classes agree to follow. Interfaces are useful when different classes may behave similarly but do not share the same parent class. A class uses extends for an abstract class and implements for an interface. In practice, use an abstract class when you want shared base logic, and use an interface when you want flexibility and multiple behavior contracts. Example: an abstract class Vehicle may provide startEngine logic, while an interface Drivable can require a drive method.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'The Java Tutorials: Interfaces and Inheritance',
      author: 'Oracle',
      link: 'https://docs.oracle.com/javase/tutorial/java/IandI/',
      year: '2024'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-16T10:10:00.000Z',
    updatedAt: '2026-04-16T10:10:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 6,
    title: 'React JS Quick Reviewer',
    subject: 'Web Development',
    content:
      'React is a JavaScript library for building user interfaces using reusable components. Each component can manage its own state and receive data through props. React updates the UI efficiently through a virtual DOM, which helps keep applications responsive. Common concepts include JSX, components, props, state, conditional rendering, lists, events, and hooks like useState and useEffect. A good React project usually breaks the interface into small components, keeps state in the right place, and updates data in a predictable way.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'React Documentation',
      author: 'React Team',
      link: 'https://react.dev/learn',
      year: '2026'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-17T11:30:00.000Z',
    updatedAt: '2026-04-17T11:30:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 7,
    title: 'C# Basics For First-Year Students',
    subject: 'Programming Fundamentals',
    content:
      'C# is a modern programming language often used for desktop apps, web apps, and backend systems. A basic C# program starts with a Main method, where execution begins. Important beginner topics include variables, data types, input and output, operators, conditionals, loops, methods, arrays, and classes. Use int for whole numbers, double for decimal values, string for text, and bool for true or false values. Write clear method names, keep indentation consistent, and break larger problems into smaller methods to make your code easier to understand and debug.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'Get started with C#',
      author: 'Microsoft Learn',
      link: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/',
      year: '2026'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-18T08:10:00.000Z',
    updatedAt: '2026-04-18T08:10:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 8,
    title: 'HTML Essentials For Beginners',
    subject: 'Web Development',
    content:
      'HTML stands for HyperText Markup Language and is used to structure web pages. Common tags include headings, paragraphs, links, images, lists, tables, forms, and semantic elements like header, main, section, article, and footer. HTML does not style the page by itself. Instead, it defines the meaning and structure of the content so browsers and other tools can understand it correctly. A strong beginner habit is to use proper nesting, clear indentation, and semantic elements instead of using generic div tags for everything.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'HTML basics',
      author: 'MDN Web Docs',
      link: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax',
      year: '2026'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-18T09:00:00.000Z',
    updatedAt: '2026-04-18T09:00:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 9,
    title: 'CSS Fundamentals For Layout And Design',
    subject: 'Web Development',
    content:
      'CSS stands for Cascading Style Sheets and controls the look of a web page. It is used for colors, spacing, fonts, borders, sizing, positioning, and layout. Beginners should understand selectors, classes, ids, the box model, display, margin, padding, flexbox, and responsive design. The box model explains how content, padding, border, and margin affect element size and spacing. Flexbox is especially helpful for aligning items in rows or columns. Keep styles organized by grouping related rules and using reusable class names.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'CSS first steps',
      author: 'MDN Web Docs',
      link: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics',
      year: '2026'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-18T09:35:00.000Z',
    updatedAt: '2026-04-18T09:35:00.000Z',
    likes: [],
    reviews: []
  },
  {
    id: 10,
    title: 'JavaScript Basics For First-Year Coding',
    subject: 'Web Development',
    content:
      'JavaScript adds behavior and interactivity to web pages. Important beginner topics include variables, data types, functions, arrays, objects, conditionals, loops, events, and DOM manipulation. Use let for values that can change and const for values that should stay the same. Functions help organize logic into reusable parts, while the DOM allows JavaScript to read and update HTML elements on the page. A good beginner workflow is to write small pieces of code, test often in the browser console, and read error messages carefully when something does not work.',
    isOwnWork: false,
    source: {
      type: 'Website',
      title: 'JavaScript basics',
      author: 'MDN Web Docs',
      link: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting',
      year: '2026'
    },
    uploaderId: 'admin-1',
    uploaderName: 'ClassSync Admin',
    status: 'approved',
    rejectionReason: null,
    rejectionByName: null,
    createdAt: '2026-04-18T10:05:00.000Z',
    updatedAt: '2026-04-18T10:05:00.000Z',
    likes: [],
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

const mergeSeedNotes = (storedNotes) => {
  const existingNotes = Array.isArray(storedNotes) ? storedNotes : [];
  const existingIds = new Set(existingNotes.map((note) => note.id));
  const missingSeedNotes = INITIAL_NOTES.filter((note) => !existingIds.has(note.id));

  return [...existingNotes, ...missingSeedNotes];
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
  const [notes, setNotes] = useState(() => mergeSeedNotes(readStorage(STORAGE_KEYS.notes, INITIAL_NOTES)));
  const [forumPosts, setForumPosts] = useState(() =>
    normalizeForumPosts(readStorage(STORAGE_KEYS.forum, INITIAL_FORUM_POSTS))
  );
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.user, null));
  const [theme, setTheme] = useState(() => readStorage(STORAGE_KEYS.theme, 'light'));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    variant: 'default',
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    requireComment: false,
    commentLabel: 'Comment',
    commentPlaceholder: '',
    initialComment: '',
    onConfirm: null
  });

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

  const closeModal = () => {
    setModalState((currentState) => ({
      ...currentState,
      isOpen: false,
      onConfirm: null
    }));
  };

  const openModal = (config) => {
    setModalState({
      isOpen: true,
      variant: config.variant || 'default',
      title: config.title,
      message: config.message || '',
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      requireComment: config.requireComment || false,
      commentLabel: config.commentLabel || 'Comment',
      commentPlaceholder: config.commentPlaceholder || '',
      initialComment: config.initialComment || '',
      onConfirm: config.onConfirm || null
    });
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
                attachments: noteInput.attachments || [],
                rejectionReason: null,
                rejectionByName: null,
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
      attachments: noteInput.attachments || [],
      rejectionReason: null,
      rejectionByName: null,
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

  const requestDeleteNote = (noteId, options = {}) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    openModal({
      variant: 'danger',
      title: 'Delete this note?',
      message: `This will permanently remove "${note.title}" from ClassSync.`,
      confirmLabel: 'Delete note',
      onConfirm: () => {
        handleDeleteNote(noteId);
        closeModal();
        options.onSuccess?.();
      }
    });
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
        note.id === noteId
          ? {
              ...note,
              status: 'approved',
              rejectionReason: null,
              rejectionByName: null,
              updatedAt: new Date().toISOString()
            }
          : note
      )
    );
  };

  const handleRejectNote = (noteId, rejectionReason) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              status: 'rejected',
              rejectionReason,
              rejectionByName: currentUser?.name || 'Admin',
              updatedAt: new Date().toISOString()
            }
          : note
      )
    );
  };

  const requestApproveNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    openModal({
      title: 'Approve this submission?',
      message: `"${note.title}" will become visible to all students once approved.`,
      confirmLabel: 'Approve note',
      onConfirm: () => {
        handleApproveNote(noteId);
        closeModal();
      }
    });
  };

  const requestRejectNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    openModal({
      variant: 'danger',
      title: 'Reject this submission?',
      message: `Add a revision comment for "${note.title}" so the student knows what to fix.`,
      confirmLabel: 'Reject with comment',
      requireComment: true,
      commentLabel: 'Rejection comment',
      commentPlaceholder: 'Example: Please fix formatting, improve clarity, or add the complete source details.',
      initialComment: note.rejectionReason || '',
      onConfirm: (comment) => {
        handleRejectNote(noteId, comment);
        closeModal();
      }
    });
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
                onDelete={requestDeleteNote}
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
                onDelete={requestDeleteNote}
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
                onDelete={requestDeleteNote}
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
                onDelete={requestDeleteNote}
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
                  onApprove={requestApproveNote}
                  onReject={requestRejectNote}
                  onDelete={requestDeleteNote}
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
      <Footer />
      <AppModal
        isOpen={modalState.isOpen}
        variant={modalState.variant}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        cancelLabel={modalState.cancelLabel}
        requireComment={modalState.requireComment}
        commentLabel={modalState.commentLabel}
        commentPlaceholder={modalState.commentPlaceholder}
        initialComment={modalState.initialComment}
        onCancel={closeModal}
        onConfirm={(comment) => modalState.onConfirm?.(comment)}
      />
    </div>
  );
}

export default App;
