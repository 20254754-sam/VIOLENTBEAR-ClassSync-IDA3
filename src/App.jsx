import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import RecoveryPage from './pages/RecoveryPage';
import AdminPage from './pages/AdminPage';
import ForumPage from './pages/ForumPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import RoomNoteDetailsPage from './pages/RoomNoteDetailsPage';
import { deleteDbItem, isCloudSyncEnabled, readDbValue, readManyDbSnapshots, writeDbValue } from './lib/classsyncDb';
import './App.css';

const STORAGE_KEYS = {
  notes: 'classsync-notes-v2',
  forum: 'classsync-forum-v2',
  rooms: 'classsync-rooms-v1',
  user: 'classsync-user-v2',
  theme: 'classsync-theme-v2',
  users: 'classsync-users-v1'
};

const DB_KEYS = {
  notes: 'notes',
  forum: 'forum',
  rooms: 'rooms',
  users: 'users'
};

const DEMO_USERS = [
  {
    id: 'student-1',
    name: 'Sample Student',
    email: 'student@classsync.com',
    password: 'student123',
    role: 'student',
    bio: 'BSIT student who shares concise reviewers and practical study notes.'
  },
  {
    id: 'admin-1',
    name: 'ClassSync Admin',
    email: 'admin@classsync.com',
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

const INITIAL_ROOMS = [
  {
    id: 'room-web-dev',
    code: 'DEV728',
    name: 'Web Dev Review Circle',
    subject: 'Web Development',
    description: 'A simple study room for web development notes, reminders, and quick reviewer sharing.',
    ownerId: 'admin-1',
    ownerName: 'ClassSync Admin',
    createdAt: '2026-04-20T08:45:00.000Z',
    adminIds: ['admin-1'],
    memberIds: ['admin-1', 'student-1']
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

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

const getItemTimestamp = (item) => {
  if (!item || typeof item !== 'object') {
    return 0;
  }

  return new Date(item.updatedAt || item.createdAt || 0).getTime() || 0;
};

const mergeCollections = (...collections) => {
  const mergedItems = new Map();

  collections.forEach((collection) => {
    if (!Array.isArray(collection)) {
      return;
    }

    collection.forEach((item) => {
      if (!item || typeof item !== 'object' || item.id === undefined || item.id === null) {
        return;
      }

      const itemKey = String(item.id);
      const existingItem = mergedItems.get(itemKey);

      if (!existingItem) {
        mergedItems.set(itemKey, item);
        return;
      }

      const nextTimestamp = getItemTimestamp(item);
      const existingTimestamp = getItemTimestamp(existingItem);

      if (nextTimestamp > existingTimestamp) {
        mergedItems.set(itemKey, { ...existingItem, ...item });
        return;
      }

      mergedItems.set(itemKey, { ...item, ...existingItem });
    });
  });

  return Array.from(mergedItems.values());
};

const sortById = (items) =>
  [...items].sort((firstItem, secondItem) => String(firstItem.id).localeCompare(String(secondItem.id)));

const areCollectionsEqual = (firstItems, secondItems) =>
  JSON.stringify(sortById(firstItems)) === JSON.stringify(sortById(secondItems));

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
      roomId: post.roomId || null,
      upvotes: uniqueUpvotes,
      downvotes: uniqueDownvotes
    };
  });

const normalizeNotes = (notes) =>
  (notes || []).map((note) => ({
    ...note,
    roomId: note.roomId || null,
    visibility: note.visibility || (note.roomId ? 'room' : 'public'),
    attachments: note.attachments || [],
    likes: note.likes || [],
    reviews: note.reviews || []
  }));

const normalizeRooms = (rooms) =>
  (rooms || []).map((room) => ({
    ...room,
    adminIds: [...new Set(room.adminIds || [room.ownerId].filter(Boolean))],
    memberIds: [...new Set(room.memberIds || [])]
  }));

const buildInitialUsers = (storedUsers) => {
  const nextUsers = Array.isArray(storedUsers) && storedUsers.length > 0 ? storedUsers : DEMO_USERS;
  return nextUsers;
};

const buildInitialNotes = (storedNotes) =>
  normalizeNotes(mergeSeedNotes(Array.isArray(storedNotes) && storedNotes.length > 0 ? storedNotes : INITIAL_NOTES));

const buildInitialForumPosts = (storedPosts) =>
  normalizeForumPosts(Array.isArray(storedPosts) && storedPosts.length > 0 ? storedPosts : INITIAL_FORUM_POSTS);

const buildInitialRooms = (storedRooms) =>
  normalizeRooms(Array.isArray(storedRooms) && storedRooms.length > 0 ? storedRooms : INITIAL_ROOMS);

const resolveUsersState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialUsers(mergeCollections(DEMO_USERS, localStorageValue, localDbValue, cloudValue));

const resolveNotesState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialNotes(mergeCollections(INITIAL_NOTES, localStorageValue, localDbValue, cloudValue));

const resolveForumState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialForumPosts(mergeCollections(INITIAL_FORUM_POSTS, localStorageValue, localDbValue, cloudValue));

const resolveRoomsState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialRooms(mergeCollections(INITIAL_ROOMS, localStorageValue, localDbValue, cloudValue));

const generateRoomCode = (existingRooms) => {
  const existingCodes = new Set(existingRooms.map((room) => room.code));
  let nextCode = '';

  while (!nextCode || existingCodes.has(nextCode)) {
    nextCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  return nextCode;
};

const normalizeClassSyncEmail = (value) => {
  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    return '';
  }

  if (!trimmedValue.includes('@')) {
    return `${trimmedValue}@classsync.com`;
  }

  return trimmedValue;
};

function App() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [notes, setNotes] = useState(() => normalizeNotes(INITIAL_NOTES));
  const [forumPosts, setForumPosts] = useState(() => normalizeForumPosts(INITIAL_FORUM_POSTS));
  const [rooms, setRooms] = useState(() => normalizeRooms(INITIAL_ROOMS));
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.user, null));
  const [theme, setTheme] = useState(() => readStorage(STORAGE_KEYS.theme, 'light'));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const hasSkippedInitialSync = useRef({
    forum: false,
    notes: false,
    rooms: false,
    users: false
  });
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
    let isActive = true;

    const hydrateDatabase = async () => {
      const localUsers = readStorage(STORAGE_KEYS.users, DEMO_USERS);
      const localNotes = readStorage(STORAGE_KEYS.notes, INITIAL_NOTES);
      const localForum = readStorage(STORAGE_KEYS.forum, INITIAL_FORUM_POSTS);
      const localRooms = readStorage(STORAGE_KEYS.rooms, INITIAL_ROOMS);

      const storedSnapshots = await readManyDbSnapshots([
        { key: DB_KEYS.users },
        { key: DB_KEYS.notes },
        { key: DB_KEYS.forum },
        { key: DB_KEYS.rooms }
      ]);

      const nextUsers = resolveUsersState({
        cloudValue: storedSnapshots[DB_KEYS.users].cloudValue,
        localDbValue: storedSnapshots[DB_KEYS.users].localValue,
        localStorageValue: localUsers
      });
      const nextNotes = resolveNotesState({
        cloudValue: storedSnapshots[DB_KEYS.notes].cloudValue,
        localDbValue: storedSnapshots[DB_KEYS.notes].localValue,
        localStorageValue: localNotes
      });
      const nextForumPosts = resolveForumState({
        cloudValue: storedSnapshots[DB_KEYS.forum].cloudValue,
        localDbValue: storedSnapshots[DB_KEYS.forum].localValue,
        localStorageValue: localForum
      });
      const nextRooms = resolveRoomsState({
        cloudValue: storedSnapshots[DB_KEYS.rooms].cloudValue,
        localDbValue: storedSnapshots[DB_KEYS.rooms].localValue,
        localStorageValue: localRooms
      });

      const pendingWrites = [
        {
          key: DB_KEYS.users,
          nextValue: nextUsers,
          snapshot: storedSnapshots[DB_KEYS.users]
        },
        {
          key: DB_KEYS.notes,
          nextValue: nextNotes,
          snapshot: storedSnapshots[DB_KEYS.notes]
        },
        {
          key: DB_KEYS.forum,
          nextValue: nextForumPosts,
          snapshot: storedSnapshots[DB_KEYS.forum]
        },
        {
          key: DB_KEYS.rooms,
          nextValue: nextRooms,
          snapshot: storedSnapshots[DB_KEYS.rooms]
        }
      ]
        .filter(({ nextValue, snapshot }) => {
          if (!snapshot.hasCloudAccess) {
            return false;
          }

          if (!isNonEmptyArray(snapshot.cloudValue)) {
            return isNonEmptyArray(snapshot.localValue) || nextValue.length > 0;
          }

          return !areCollectionsEqual(snapshot.cloudValue, nextValue);
        })
        .map(({ key, nextValue }) => writeDbValue(key, nextValue));

      if (pendingWrites.length > 0) {
        await Promise.all(pendingWrites);
      }

      if (!isActive) {
        return;
      }

      setUsers(nextUsers);
      setNotes(nextNotes);
      setForumPosts(nextForumPosts);
      setRooms(nextRooms);
      setIsHydrating(false);
    };

    hydrateDatabase().catch(() => {
      if (!isActive) {
        return;
      }

      setUsers(buildInitialUsers(readStorage(STORAGE_KEYS.users, DEMO_USERS)));
      setNotes(buildInitialNotes(readStorage(STORAGE_KEYS.notes, INITIAL_NOTES)));
      setForumPosts(buildInitialForumPosts(readStorage(STORAGE_KEYS.forum, INITIAL_FORUM_POSTS)));
      setRooms(buildInitialRooms(readStorage(STORAGE_KEYS.rooms, INITIAL_ROOMS)));
      setIsHydrating(false);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.notes) {
      hasSkippedInitialSync.current.notes = true;
      return;
    }

    writeDbValue(DB_KEYS.notes, notes).catch(() => {
      window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    });
  }, [isHydrating, notes]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.users) {
      hasSkippedInitialSync.current.users = true;
      return;
    }

    writeDbValue(DB_KEYS.users, users).catch(() => {
      window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    });
  }, [isHydrating, users]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.forum) {
      hasSkippedInitialSync.current.forum = true;
      return;
    }

    writeDbValue(DB_KEYS.forum, forumPosts).catch(() => {
      window.localStorage.setItem(STORAGE_KEYS.forum, JSON.stringify(forumPosts));
    });
  }, [isHydrating, forumPosts]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.rooms) {
      hasSkippedInitialSync.current.rooms = true;
      return;
    }

    writeDbValue(DB_KEYS.rooms, rooms).catch(() => {
      window.localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
    });
  }, [isHydrating, rooms]);

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
    () => sortNewest(notes.filter((note) => note.status === 'approved' && !note.roomId)),
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

  const joinedRooms = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return sortNewest(rooms.filter((room) => room.memberIds.includes(currentUser.id)));
  }, [currentUser, rooms]);

  const editingNote = useMemo(
    () => notes.find((note) => note.id === editingNoteId) || null,
    [editingNoteId, notes]
  );

  const loadLatestRooms = async (fallbackRooms = rooms) => {
    const latestRooms = await readDbValue(DB_KEYS.rooms, fallbackRooms);
    const normalizedRooms = buildInitialRooms(latestRooms);
    setRooms(normalizedRooms);
    return normalizedRooms;
  };

  const handleLogin = ({ email, password }) => {
    const normalizedEmail = normalizeClassSyncEmail(email);
    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Invalid email or password. Check the account details and try again.'
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
    const normalizedEmail = normalizeClassSyncEmail(email);

    if (!name.trim() || !normalizedEmail || !password.trim()) {
      return {
        success: false,
        message: 'Please complete your name, email, and password.'
      };
    }

    if (!normalizedEmail.endsWith('@classsync.com')) {
      return {
        success: false,
        message: 'Please use a ClassSync email that ends with @classsync.com.'
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

  const handleSaveNote = (noteInput, options = {}) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before submitting a note.'
      };
    }

    const now = new Date().toISOString();
    const nextStatus = options.roomId ? 'approved' : currentUser.role === 'admin' ? 'approved' : 'pending';
    const nextVisibility = options.roomId ? 'room' : 'public';

    if (editingNoteId) {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === editingNoteId
            ? {
                ...note,
                ...noteInput,
                status: nextStatus,
                roomId: options.roomId ?? note.roomId ?? null,
                visibility: options.roomId ? 'room' : note.visibility || nextVisibility,
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
          options.roomId
            ? 'Room note updated successfully.'
            : currentUser.role === 'admin'
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
      roomId: options.roomId || null,
      visibility: nextVisibility,
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
        options.roomId
          ? 'Room note shared successfully. Only room members can see it.'
          : currentUser.role === 'admin'
          ? 'Note published successfully.'
          : 'Note submitted successfully. It is now waiting for admin approval.'
    };
  };

  const handleDeleteNote = (noteId) => {
    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }

    deleteDbItem(DB_KEYS.notes, noteId).catch(() => {
      // The notes effect keeps local cache in sync; this prevents cloud deletes from blocking the UI.
    });
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

  const handleCreateForumPost = (postInput, options = {}) => {
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
      roomId: options.roomId || null,
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

  const buildRoomLink = (room) => {
    const basePath = `${window.location.origin}${window.location.pathname}`;
    return `${basePath}#/rooms/${room.id}?invite=${room.code}`;
  };

  const handleCreateRoom = async (roomInput) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before creating a room.'
      };
    }

    const latestRooms = await loadLatestRooms();

    const nextRoom = {
      id: `room-${Date.now()}`,
      code: generateRoomCode(latestRooms),
      name: roomInput.name.trim(),
      subject: roomInput.subject.trim(),
      description: roomInput.description.trim(),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: new Date().toISOString(),
      adminIds: [currentUser.id],
      memberIds: [currentUser.id]
    };

    const nextRooms = [nextRoom, ...latestRooms];
    setRooms(nextRooms);
    await writeDbValue(DB_KEYS.rooms, nextRooms);

    return {
      success: true,
      room: nextRoom,
      shareLink: buildRoomLink(nextRoom),
      message: 'Room created successfully. Share the link or room code with classmates.'
    };
  };

  const handleJoinRoom = async ({ roomId, code }) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before joining a room.'
      };
    }

    const latestRooms = await loadLatestRooms();
    const normalizedCode = code?.trim().toUpperCase();
    const matchedRoom = latestRooms.find((room) => {
      if (roomId && room.id === roomId) {
        return !normalizedCode || room.code === normalizedCode;
      }

      return normalizedCode ? room.code === normalizedCode : false;
    });

    if (!matchedRoom) {
      return {
        success: false,
        message: 'We could not find a room with that invite code.'
      };
    }

    if (matchedRoom.memberIds.includes(currentUser.id)) {
      return {
        success: true,
        room: matchedRoom,
        shareLink: buildRoomLink(matchedRoom),
        message: `You are already in ${matchedRoom.name}.`
      };
    }

    const updatedRoom = {
      ...matchedRoom,
      memberIds: [...matchedRoom.memberIds, currentUser.id]
    };

    const nextRooms = latestRooms.map((room) => (room.id === matchedRoom.id ? updatedRoom : room));
    setRooms(nextRooms);
    await writeDbValue(DB_KEYS.rooms, nextRooms);

    return {
      success: true,
      room: updatedRoom,
      shareLink: buildRoomLink(updatedRoom),
      message: `You joined ${updatedRoom.name}.`
    };
  };

  const handlePromoteRoomMember = (roomId, memberId) => {
    setRooms((previousRooms) =>
      previousRooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              adminIds: [...new Set([...(room.adminIds || []), memberId])]
            }
          : room
      )
    );
  };

  const handleKickRoomMember = (roomId, memberId) => {
    setRooms((previousRooms) =>
      previousRooms.map((room) => {
        if (room.id !== roomId || memberId === room.ownerId) {
          return room;
        }

        return {
          ...room,
          adminIds: (room.adminIds || []).filter((adminId) => adminId !== memberId),
          memberIds: room.memberIds.filter((currentMemberId) => currentMemberId !== memberId)
        };
      })
    );
  };

  const sortedForumPosts = useMemo(
    () =>
      normalizeForumPosts(forumPosts)
      .filter((post) => !post.roomId)
      .sort((firstPost, secondPost) => {
        const firstScore = firstPost.upvotes.length - firstPost.downvotes.length;
        const secondScore = secondPost.upvotes.length - secondPost.downvotes.length;

        if (firstScore !== secondScore) {
          return secondScore - firstScore;
        }

        return new Date(secondPost.createdAt) - new Date(firstPost.createdAt);
      }),
    [forumPosts]
  );

  const handleSubmitRoomNote = (roomId, noteInput) => handleSaveNote(noteInput, { roomId });

  const handleCreateRoomPost = (roomId, postInput) => handleCreateForumPost(postInput, { roomId });

  if (isHydrating) {
    return (
      <div className="app app-loading-shell">
        <div className="app-loading-card">
          <p className="auth-eyebrow">ClassSync</p>
          <h1>Loading your study space...</h1>
          <p>
            {isCloudSyncEnabled
              ? 'Preparing notes, rooms, forum posts, and shared accounts from the Supabase database.'
              : 'Preparing notes, rooms, forum posts, and saved accounts from the local database.'}
          </p>
        </div>
      </div>
    );
  }

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
          <Route
            path="/recovery"
            element={
              <RecoveryPage
                storageKeys={STORAGE_KEYS}
                dbKeys={DB_KEYS}
                seedUsers={DEMO_USERS}
                seedForumPosts={INITIAL_FORUM_POSTS}
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
            path="/rooms"
            element={
              <RoomsPage
                currentUser={currentUser}
                rooms={joinedRooms}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                getRoomLink={buildRoomLink}
              />
            }
          />
          <Route
            path="/rooms/:roomId"
            element={
              <RoomDetailsPage
                currentUser={currentUser}
                users={users}
                rooms={rooms}
                roomNotes={sortNewest(notes.filter((note) => note.roomId))}
                roomPosts={normalizeForumPosts(forumPosts).filter((post) => post.roomId)}
                editingNote={editingNote}
                onEdit={startEditingNote}
                onCancelEdit={cancelEditingNote}
                onSubmitRoomNote={handleSubmitRoomNote}
                onCreateRoomPost={handleCreateRoomPost}
                onVotePost={handleVoteForumPost}
                onCommentPost={handleCommentOnPost}
                onToggleLike={handleToggleLike}
                onDeleteNote={requestDeleteNote}
                onJoinRoom={handleJoinRoom}
                onPromoteMember={handlePromoteRoomMember}
                onKickMember={handleKickRoomMember}
                getRoomLink={buildRoomLink}
              />
            }
          />
          <Route
            path="/rooms/:roomId/note/:id"
            element={
              <RoomNoteDetailsPage
                notes={notes.filter((note) => note.roomId)}
                rooms={rooms}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
                onSubmitReview={handleSubmitReview}
              />
            }
          />
          <Route
            path="/admin"
            element={
              currentUser.role === 'admin' ? (
                <AdminPage
                  pendingNotes={pendingNotes}
                  allNotes={sortNewest(notes.filter((note) => !note.roomId))}
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
