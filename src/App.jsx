import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import RoomNoteDetailsPage from './pages/RoomNoteDetailsPage';
import {
  deleteDbItem,
  getAttachmentUploadErrorMessage,
  isCloudSyncEnabled,
  readDbValue,
  readManyDbSnapshots,
  subscribeToDbCollection,
  uploadAttachmentsToStorage,
  writeDbItem,
  writeDbValue
} from './lib/classsyncDb';
import './App.css';

const STORAGE_KEYS = {
  notes: 'classsync-notes-v2',
  forum: 'classsync-forum-v2',
  messages: 'classsync-messages-v1',
  notifications: 'classsync-notifications-v1',
  reports: 'classsync-reports-v1',
  rooms: 'classsync-rooms-v1',
  user: 'classsync-user-v2',
  theme: 'classsync-theme-v2',
  users: 'classsync-users-v1'
};

const DB_KEYS = {
  notes: 'notes',
  forum: 'forum',
  messages: 'messages',
  notifications: 'notifications',
  reports: 'reports',
  rooms: 'rooms',
  users: 'users'
};

const COLLECTION_STORAGE_KEYS = {
  [DB_KEYS.notes]: STORAGE_KEYS.notes,
  [DB_KEYS.forum]: STORAGE_KEYS.forum,
  [DB_KEYS.messages]: STORAGE_KEYS.messages,
  [DB_KEYS.notifications]: STORAGE_KEYS.notifications,
  [DB_KEYS.reports]: STORAGE_KEYS.reports,
  [DB_KEYS.rooms]: STORAGE_KEYS.rooms,
  [DB_KEYS.users]: STORAGE_KEYS.users
};

const COLLECTION_READ_LIMITS = {
  [DB_KEYS.notes]: 120,
  [DB_KEYS.forum]: 80,
  [DB_KEYS.messages]: 200,
  [DB_KEYS.notifications]: 120,
  [DB_KEYS.reports]: 120
};

const getCollectionReadOptions = (key) => ({
  preferLocal: true,
  ...(COLLECTION_READ_LIMITS[key] ? { limit: COLLECTION_READ_LIMITS[key] } : {})
});

const getRouteCloudKeys = (pathname = '/') => {
  const routePath = pathname || '/';
  const keys = new Set([DB_KEYS.users, DB_KEYS.rooms]);

  if (routePath.startsWith('/admin')) {
    keys.add(DB_KEYS.notes);
    keys.add(DB_KEYS.forum);
    keys.add(DB_KEYS.messages);
    keys.add(DB_KEYS.notifications);
    keys.add(DB_KEYS.reports);
    return keys;
  }

  if (routePath.startsWith('/messages')) {
    keys.add(DB_KEYS.messages);
    keys.add(DB_KEYS.notifications);
    return keys;
  }

  if (routePath.startsWith('/forum')) {
    keys.add(DB_KEYS.forum);
    keys.add(DB_KEYS.notifications);
    return keys;
  }

  if (routePath.startsWith('/rooms/')) {
    keys.add(DB_KEYS.notes);
    keys.add(DB_KEYS.forum);
    keys.add(DB_KEYS.messages);
    keys.add(DB_KEYS.notifications);
    return keys;
  }

  if (routePath.startsWith('/notifications')) {
    keys.add(DB_KEYS.notifications);
    keys.add(DB_KEYS.reports);
    return keys;
  }

  if (
    routePath === '/' ||
    routePath.startsWith('/browse') ||
    routePath.startsWith('/note/') ||
    routePath.startsWith('/profile') ||
    routePath.startsWith('/upload')
  ) {
    keys.add(DB_KEYS.notes);
  }

  return keys;
};

const APP_EMAIL_DOMAIN = 'luminote.com';
const CANONICAL_ADMIN_EMAIL = `admin@${APP_EMAIL_DOMAIN}`;
const LEGACY_CANONICAL_ADMIN_EMAIL = 'admin@classsync.com';
const LEGACY_ADMIN_EMAIL = 'admin@classsync.demo';
const LEGACY_CLASS_SYNC_EMAIL_DOMAIN = '@classsync.com';
const LEGACY_DEMO_EMAIL_DOMAIN = '@classsync.demo';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const DEMO_USERS = [
  {
    id: 'student-1',
    name: 'Sample Student',
    email: `student@${APP_EMAIL_DOMAIN}`,
    password: 'student123',
    role: 'student',
    bio: 'BSIT student who shares concise reviewers and practical study notes.',
    course: 'BSIT',
    yearLevel: '2nd Year',
    profileVisibility: 'public',
    profilePicture: '',
    securityQuestion: 'What is your favorite study snack?',
    securityAnswer: 'chips',
    joinedAt: '2026-04-01T08:30:00.000Z'
  },
  {
    id: 'admin-1',
    name: 'Luminote Admin',
    email: CANONICAL_ADMIN_EMAIL,
    password: 'admin123',
    role: 'admin',
    bio: 'Reviews submitted notes before they become visible to the whole community.',
    course: 'Administration',
    yearLevel: 'Faculty',
    profileVisibility: 'public',
    profilePicture: '',
    securityQuestion: 'What city were you born in?',
    securityAnswer: 'manila',
    joinedAt: '2026-04-01T08:00:00.000Z'
  }
];

const PROFILE_VISIBILITY_OPTIONS = ['public', 'private'];

const SECURITY_QUESTIONS = [
  'What is your favorite study snack?',
  'What city were you born in?',
  'What was the name of your first school?',
  'What subject do you enjoy the most?',
  'What is your dream job?'
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    uploaderName: 'Luminote Admin',
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
    ownerName: 'Luminote Admin',
    createdAt: '2026-04-20T08:45:00.000Z',
    adminIds: ['admin-1'],
    memberIds: ['admin-1', 'student-1']
  }
];

const INITIAL_NOTIFICATIONS = [];
const INITIAL_REPORTS = [];
const INITIAL_MESSAGES = [];

const readStorage = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const writeCollectionStorage = ({ users, notes, forumPosts, messages, notifications, reports, rooms }) => {
  writeStorage(STORAGE_KEYS.users, users);
  writeStorage(STORAGE_KEYS.notes, notes);
  writeStorage(STORAGE_KEYS.forum, forumPosts);
  writeStorage(STORAGE_KEYS.messages, messages);
  writeStorage(STORAGE_KEYS.notifications, notifications);
  writeStorage(STORAGE_KEYS.reports, reports);
  writeStorage(STORAGE_KEYS.rooms, rooms);
};

const escapeSvgText = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildDefaultProfilePicture = (name, role = 'student') => {
  const label = (name || 'Luminote')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'LN';
  const palette =
    role === 'admin'
      ? { background: '#1d4ed8', accent: '#dbeafe', text: '#f8fbff' }
      : { background: '#7c3aed', accent: '#fce7f3', text: '#ffffff' };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.background}" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="40" fill="url(#avatarGradient)" />
      <circle cx="80" cy="58" r="26" fill="${palette.accent}" opacity="0.3" />
      <path d="M34 132c8-28 28-42 46-42s38 14 46 42" fill="${palette.accent}" opacity="0.22" />
      <text x="80" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="${palette.text}">
        ${escapeSvgText(label)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

const removeCollectionItem = (items, itemId) =>
  (items || []).filter((item) => String(item?.id) !== String(itemId));

const normalizeLegacyDisplayName = (value) => (value === 'ClassSync Admin' ? 'Luminote Admin' : value);

const getRealtimePayloadItem = (change) => change?.new?.payload || change?.old?.payload || null;

const applyRealtimeCollectionChange = (setCollection, normalizeCollection) => (change) => {
  const payloadItem = getRealtimePayloadItem(change);
  const rowId = change?.old?.id || change?.new?.id || payloadItem?.id;

  if (!rowId && !payloadItem) {
    return;
  }

  setCollection((previousItems) => {
    const nextItems =
      change.eventType === 'DELETE'
        ? removeCollectionItem(previousItems, rowId)
        : normalizeCollection(mergeCollections(previousItems, [payloadItem]));

    return areCollectionsEqual(previousItems, nextItems) ? previousItems : nextItems;
  });
};

const mergeSeedNotes = (storedNotes) => {
  const existingNotes = Array.isArray(storedNotes) ? storedNotes : [];
  const existingIds = new Set(existingNotes.map((note) => note.id));
  const missingSeedNotes = INITIAL_NOTES.filter((note) => !existingIds.has(note.id));

  return [...existingNotes, ...missingSeedNotes];
};

const sortNewest = (items) =>
  [...items].sort(
    (a, b) =>
      new Date(b.approvedAt || b.updatedAt || b.createdAt) -
      new Date(a.approvedAt || a.updatedAt || a.createdAt)
  );

const normalizeForumPosts = (posts) =>
  (posts || []).map((post) => {
    const uniqueUpvotes = [...new Set(post.upvotes || [])];
    const uniqueDownvotes = [...new Set(post.downvotes || [])].filter(
      (userId) => !uniqueUpvotes.includes(userId)
    );

    return {
      ...post,
      roomId: post.roomId || null,
      upvotes: uniqueUpvotes,
      downvotes: uniqueDownvotes,
      comments: (post.comments || []).map((comment) => ({
        ...comment,
        parentId: comment.parentId || null,
        mentions: Array.isArray(comment.mentions) ? comment.mentions : [],
        createdAt: comment.createdAt || new Date().toISOString()
      }))
    };
  });

const normalizeNotes = (notes) =>
  (notes || []).map((note) => ({
    ...note,
    uploaderName: normalizeLegacyDisplayName(note.uploaderName),
    rejectionByName: normalizeLegacyDisplayName(note.rejectionByName),
    approvedAt: note.approvedAt || (note.status === 'approved' ? note.updatedAt || note.createdAt : null),
    roomId: note.roomId || null,
    visibility: note.visibility || (note.roomId ? 'room' : 'public'),
    attachments: (note.attachments || []).map((attachment) => ({
      ...attachment,
      attachedAt: attachment.attachedAt || note.updatedAt || note.createdAt || new Date().toISOString()
    })),
    likes: note.likes || [],
    reviews: note.reviews || []
  }));

const normalizeRooms = (rooms) =>
  (rooms || []).map((room) => ({
    ...room,
    ownerName: normalizeLegacyDisplayName(room.ownerName),
    adminIds: [...new Set(room.adminIds || [room.ownerId].filter(Boolean))],
    memberIds: [...new Set(room.memberIds || [])]
  }));

const normalizeReports = (reports) =>
  (reports || []).map((report) => ({
    ...report,
    status: report.status || 'open',
    createdAt: report.createdAt || new Date().toISOString()
  }));

const sanitizeNotificationIdPart = (value) =>
  String(value ?? 'item')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const buildLikeNotificationId = (noteId, userId) =>
  `notification-like-${sanitizeNotificationIdPart(noteId)}-${sanitizeNotificationIdPart(userId)}`;

const buildLikeNotificationPayload = (note, user) => {
  const link = note.roomId ? `/rooms/${note.roomId}/note/${note.id}` : `/note/${note.id}`;

  return {
    id: buildLikeNotificationId(note.id, user.id),
    dedupeKey: `note-like:${note.id}:${user.id}`,
    targetUserId: note.uploaderId,
    title: 'Someone liked your note',
    message: `${user.name} liked "${note.title}".`,
    type: 'note-like',
    link,
    actorId: user.id,
    sourceId: note.id,
    sourceType: 'note'
  };
};

const isMatchingLikeNotification = (notification, payload) => {
  if (notification.id === payload.id || notification.dedupeKey === payload.dedupeKey) {
    return true;
  }

  if (notification.type !== 'note-like' || String(notification.targetUserId) !== String(payload.targetUserId)) {
    return false;
  }

  const matchesStoredMeta =
    notification.actorId &&
    notification.sourceId &&
    String(notification.actorId) === String(payload.actorId) &&
    String(notification.sourceId) === String(payload.sourceId);
  const matchesLegacyCopy =
    !notification.actorId && !notification.sourceId && notification.link === payload.link && notification.message === payload.message;

  return matchesStoredMeta || matchesLegacyCopy;
};

const getNotificationDedupeKey = (notification) => {
  if (notification.dedupeKey) {
    return notification.dedupeKey;
  }

  if (notification.type === 'note-like') {
    if (notification.actorId && notification.sourceId) {
      return `note-like:${notification.sourceId}:${notification.actorId}`;
    }

    return `legacy-note-like:${notification.targetUserId}:${notification.link}:${notification.message}`;
  }

  return notification.id;
};

const normalizeNotifications = (notifications) =>
  (notifications || [])
    .map((notification) => ({
      ...notification,
      actorId: notification.actorId || '',
      sourceId: notification.sourceId || '',
      sourceType: notification.sourceType || '',
      dedupeKey: notification.dedupeKey || '',
      createdAt: notification.createdAt || new Date().toISOString(),
      readAt: notification.readAt || null
    }))
    .filter((notification, index, normalizedNotifications) => {
      const dedupeKey = getNotificationDedupeKey(notification);

      return normalizedNotifications.findIndex((item) => getNotificationDedupeKey(item) === dedupeKey) === index;
    });

const normalizeMessages = (messages) =>
  (messages || []).map((message) => ({
    ...message,
    type: message.type || 'direct',
    roomId: message.roomId || null,
    text: message.text || '',
    voice: message.voice || null,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    mentions: Array.isArray(message.mentions) ? message.mentions : [],
    participants: [...new Set(message.participants || [])],
    readBy: [...new Set(message.readBy || [message.senderId].filter(Boolean))],
    deletedFor: [...new Set(message.deletedFor || [])],
    conversationKey:
      message.conversationKey ||
      (message.type === 'room'
        ? `room:${message.roomId || 'unknown'}`
        : `direct:${[...(message.participants || [])].map(String).sort().join(':')}`),
    createdAt: message.createdAt || new Date().toISOString(),
    updatedAt: message.updatedAt || message.createdAt || new Date().toISOString()
  }));

const normalizeLuminoteEmailAddress = (value = '') => {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue === LEGACY_ADMIN_EMAIL || normalizedValue === LEGACY_CANONICAL_ADMIN_EMAIL) {
    return CANONICAL_ADMIN_EMAIL;
  }

  if (normalizedValue.endsWith(LEGACY_CLASS_SYNC_EMAIL_DOMAIN)) {
    return `${normalizedValue.slice(0, -LEGACY_CLASS_SYNC_EMAIL_DOMAIN.length)}@${APP_EMAIL_DOMAIN}`;
  }

  return normalizedValue;
};

const normalizeUserRecord = (user) => {
  const normalizedName = normalizeLegacyDisplayName(user?.name?.trim()) || 'Luminote User';
  const normalizedRole = user?.role || 'student';
  const normalizedEmail = normalizeLuminoteEmailAddress(user?.email || '');

  return {
    ...user,
    name: normalizedName,
    email: normalizedEmail,
    role: normalizedEmail === CANONICAL_ADMIN_EMAIL ? 'admin' : normalizedRole,
    bio:
      user?.bio?.trim() ||
      (normalizedRole === 'admin'
        ? 'Keeps the Luminote space organized for everyone.'
        : 'Luminote member who shares notes and learns with classmates.'),
    course: user?.course?.trim() || '',
    yearLevel: user?.yearLevel?.trim() || '',
    profileVisibility: PROFILE_VISIBILITY_OPTIONS.includes(user?.profileVisibility) ? user.profileVisibility : 'public',
    joinedAt: user?.joinedAt || user?.createdAt || new Date().toISOString(),
    profilePicture: user?.profilePicture || buildDefaultProfilePicture(normalizedName, normalizedRole),
    securityQuestion: user?.securityQuestion || SECURITY_QUESTIONS[0],
    securityAnswer: user?.securityAnswer?.trim()?.toLowerCase() || '',
    isActive: user?.isActive !== false,
    deactivatedAt: user?.deactivatedAt || null,
    deactivatedByName: user?.deactivatedByName || ''
  };
};

const normalizeUserCollection = (users) => {
  const normalizedUsers = users.map(normalizeUserRecord);
  const hasCanonicalAdmin = normalizedUsers.some((user) => user.email === CANONICAL_ADMIN_EMAIL);

  return normalizedUsers.filter((user, index) => {
    if (
      user.email.endsWith(LEGACY_DEMO_EMAIL_DOMAIN) &&
      user.email !== LEGACY_ADMIN_EMAIL &&
      user.email !== CANONICAL_ADMIN_EMAIL
    ) {
      return false;
    }

    if (user.email !== CANONICAL_ADMIN_EMAIL) {
      return true;
    }

    if (!hasCanonicalAdmin) {
      return true;
    }

    return normalizedUsers.findIndex((candidate) => candidate.email === CANONICAL_ADMIN_EMAIL) === index;
  });
};

const getLegacyAdminIds = (...collections) =>
  [
    ...new Set(
      collections
        .flatMap((collection) => (Array.isArray(collection) ? collection : []))
        .filter((user) => {
          const email = user?.email?.trim()?.toLowerCase();
          return email === LEGACY_ADMIN_EMAIL || email === LEGACY_CANONICAL_ADMIN_EMAIL;
        })
        .map((user) => String(user.id || ''))
        .filter((id) => id && id !== 'admin-1')
    )
  ];

const buildSessionUser = (user) => {
  if (!user) {
    return null;
  }

  const normalizedUser = normalizeUserRecord(user);

  return {
    bio: normalizedUser.bio,
    course: normalizedUser.course,
    email: normalizedUser.email,
    id: normalizedUser.id,
    joinedAt: normalizedUser.joinedAt,
    name: normalizedUser.name,
    profilePicture: normalizedUser.profilePicture,
    profileVisibility: normalizedUser.profileVisibility,
    role: normalizedUser.role,
    isActive: normalizedUser.isActive,
    updatedAt: normalizedUser.updatedAt || normalizedUser.joinedAt,
    yearLevel: normalizedUser.yearLevel
  };
};

const buildInitialUsers = (storedUsers) => {
  const nextUsers = Array.isArray(storedUsers) && storedUsers.length > 0 ? storedUsers : DEMO_USERS;
  return normalizeUserCollection(nextUsers);
};

const buildInitialNotes = (storedNotes, includeSeedNotes = true) => {
  const nextNotes = Array.isArray(storedNotes) && storedNotes.length > 0 ? storedNotes : INITIAL_NOTES;
  return normalizeNotes(includeSeedNotes ? mergeSeedNotes(nextNotes) : nextNotes);
};

const buildInitialForumPosts = (storedPosts) =>
  normalizeForumPosts(Array.isArray(storedPosts) && storedPosts.length > 0 ? storedPosts : INITIAL_FORUM_POSTS);

const buildInitialRooms = (storedRooms) =>
  normalizeRooms(Array.isArray(storedRooms) && storedRooms.length > 0 ? storedRooms : INITIAL_ROOMS);

const buildInitialReports = (storedReports) =>
  normalizeReports(Array.isArray(storedReports) && storedReports.length > 0 ? storedReports : INITIAL_REPORTS);

const buildInitialNotifications = (storedNotifications) =>
  normalizeNotifications(
    Array.isArray(storedNotifications) && storedNotifications.length > 0 ? storedNotifications : INITIAL_NOTIFICATIONS
  );

const buildInitialMessages = (storedMessages) =>
  normalizeMessages(Array.isArray(storedMessages) && storedMessages.length > 0 ? storedMessages : INITIAL_MESSAGES);

const preferCloudCollection = (cloudValue) => (isNonEmptyArray(cloudValue) ? cloudValue : null);

const resolveUsersState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialUsers(
    mergeCollections(
      DEMO_USERS,
      localStorageValue,
      localDbValue,
      preferCloudCollection(cloudValue) || []
    )
  );

const resolveNotesState = ({ cloudValue, localDbValue, localStorageValue }) =>
  preferCloudCollection(cloudValue)
    ? buildInitialNotes(cloudValue, false)
    : buildInitialNotes(mergeCollections(INITIAL_NOTES, localStorageValue, localDbValue));

const resolveForumState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialForumPosts(preferCloudCollection(cloudValue) || mergeCollections(INITIAL_FORUM_POSTS, localStorageValue, localDbValue));

const resolveRoomsState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialRooms(preferCloudCollection(cloudValue) || mergeCollections(INITIAL_ROOMS, localStorageValue, localDbValue));

const resolveReportsState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialReports(preferCloudCollection(cloudValue) || mergeCollections(INITIAL_REPORTS, localStorageValue, localDbValue));

const resolveNotificationsState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialNotifications(preferCloudCollection(cloudValue) || mergeCollections(INITIAL_NOTIFICATIONS, localStorageValue, localDbValue));

const resolveMessagesState = ({ cloudValue, localDbValue, localStorageValue }) =>
  buildInitialMessages(preferCloudCollection(cloudValue) || mergeCollections(INITIAL_MESSAGES, localStorageValue, localDbValue));

const resolveCollectionState = (key, snapshot = {}, localStorageValues = {}) => {
  const resolverInput = {
    cloudValue: snapshot.cloudValue,
    localDbValue: snapshot.localValue,
    localStorageValue: localStorageValues[key]
  };

  if (key === DB_KEYS.users) {
    return resolveUsersState(resolverInput);
  }

  if (key === DB_KEYS.notes) {
    return resolveNotesState(resolverInput);
  }

  if (key === DB_KEYS.forum) {
    return resolveForumState(resolverInput);
  }

  if (key === DB_KEYS.messages) {
    return resolveMessagesState(resolverInput);
  }

  if (key === DB_KEYS.notifications) {
    return resolveNotificationsState(resolverInput);
  }

  if (key === DB_KEYS.reports) {
    return resolveReportsState(resolverInput);
  }

  if (key === DB_KEYS.rooms) {
    return resolveRoomsState(resolverInput);
  }

  return [];
};

const generateRoomCode = (existingRooms) => {
  const existingCodes = new Set(existingRooms.map((room) => room.code));
  let nextCode = '';

  while (!nextCode || existingCodes.has(nextCode)) {
    nextCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  return nextCode;
};

const normalizeLuminoteEmail = (value) => {
  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    return '';
  }

  if (!trimmedValue.includes('@')) {
    return `${trimmedValue}@${APP_EMAIL_DOMAIN}`;
  }

  return normalizeLuminoteEmailAddress(trimmedValue);
};

function App() {
  const { pathname } = useLocation();
  const initialPathnameRef = useRef(pathname);
  const [users, setUsers] = useState(DEMO_USERS);
  const [notes, setNotes] = useState(() => normalizeNotes(INITIAL_NOTES));
  const [forumPosts, setForumPosts] = useState(() => normalizeForumPosts(INITIAL_FORUM_POSTS));
  const [messages, setMessages] = useState(() => normalizeMessages(INITIAL_MESSAGES));
  const [notifications, setNotifications] = useState(() => normalizeNotifications(INITIAL_NOTIFICATIONS));
  const [reports, setReports] = useState(() => normalizeReports(INITIAL_REPORTS));
  const [rooms, setRooms] = useState(() => normalizeRooms(INITIAL_ROOMS));
  const [currentUser, setCurrentUser] = useState(() => buildSessionUser(readStorage(STORAGE_KEYS.user, null)));
  const [theme, setTheme] = useState(() => readStorage(STORAGE_KEYS.theme, 'light'));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [cloudSyncError, setCloudSyncError] = useState('');
  const [hydrationProgress, setHydrationProgress] = useState(12);
  const hasSkippedInitialSync = useRef({
    forum: false,
    messages: false,
    notes: false,
    notifications: false,
    reports: false,
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
    let progressTimer = null;
    const finishHydration = async (
      nextUsers,
      nextNotes,
      nextForumPosts,
      nextMessages,
      nextNotifications,
      nextReports,
      nextRooms
    ) => {
      if (!isActive) {
        return;
      }

      setUsers(nextUsers);
      setNotes(nextNotes);
      setForumPosts(nextForumPosts);
      setMessages(nextMessages);
      setNotifications(nextNotifications);
      setReports(nextReports);
      setRooms(nextRooms);
      setHydrationProgress(100);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 220);
      });

      if (!isActive) {
        return;
      }

      setIsHydrating(false);
    };

    setHydrationProgress(12);

    progressTimer = window.setInterval(() => {
      setHydrationProgress((currentValue) => (currentValue >= 88 ? currentValue : currentValue + 6));
    }, 160);

    const hydrateDatabase = async () => {
      const localUsers = readStorage(STORAGE_KEYS.users, undefined);
      const localNotes = readStorage(STORAGE_KEYS.notes, undefined);
      const localForum = readStorage(STORAGE_KEYS.forum, undefined);
      const localMessages = readStorage(STORAGE_KEYS.messages, undefined);
      const localNotifications = readStorage(STORAGE_KEYS.notifications, undefined);
      const localReports = readStorage(STORAGE_KEYS.reports, undefined);
      const localRooms = readStorage(STORAGE_KEYS.rooms, undefined);
      const localStorageValues = {
        [DB_KEYS.users]: localUsers,
        [DB_KEYS.notes]: localNotes,
        [DB_KEYS.forum]: localForum,
        [DB_KEYS.messages]: localMessages,
        [DB_KEYS.notifications]: localNotifications,
        [DB_KEYS.reports]: localReports,
        [DB_KEYS.rooms]: localRooms
      };
      const activeCloudKeys = getRouteCloudKeys(initialPathnameRef.current);

      const storedSnapshots = await readManyDbSnapshots(
        Object.values(DB_KEYS).map((key) => ({
          key,
          ...getCollectionReadOptions(key),
          skipCloud: !activeCloudKeys.has(key)
        }))
      );
      const snapshotValues = Object.values(storedSnapshots);
      const activeSnapshotValues = Array.from(activeCloudKeys)
        .map((key) => storedSnapshots[key])
        .filter(Boolean);
      const hasAnyCloudAccess = activeSnapshotValues.some((snapshot) => snapshot.hasCloudAccess);
      const hasAnyLocalData =
        snapshotValues.some((snapshot) => isNonEmptyArray(snapshot.localValue)) ||
        [localUsers, localNotes, localForum, localMessages, localNotifications, localReports, localRooms].some(isNonEmptyArray);

      if (isCloudSyncEnabled && !hasAnyCloudAccess && !hasAnyLocalData) {
        const firstCloudError = activeSnapshotValues.find((snapshot) => snapshot.cloudError)?.cloudError;

        setCloudSyncError(
          firstCloudError?.message ||
            'Luminote could not read the Supabase tables. Run supabase/luminote-schema.sql in the correct Supabase project.'
        );
      } else {
        setCloudSyncError('');
      }

      const nextUsers = resolveCollectionState(DB_KEYS.users, storedSnapshots[DB_KEYS.users], localStorageValues);
      const nextNotes = resolveCollectionState(DB_KEYS.notes, storedSnapshots[DB_KEYS.notes], localStorageValues);
      const nextForumPosts = resolveCollectionState(DB_KEYS.forum, storedSnapshots[DB_KEYS.forum], localStorageValues);
      const nextMessages = resolveCollectionState(DB_KEYS.messages, storedSnapshots[DB_KEYS.messages], localStorageValues);
      const nextNotifications = resolveCollectionState(
        DB_KEYS.notifications,
        storedSnapshots[DB_KEYS.notifications],
        localStorageValues
      );
      const nextReports = resolveCollectionState(DB_KEYS.reports, storedSnapshots[DB_KEYS.reports], localStorageValues);
      const nextRooms = resolveCollectionState(DB_KEYS.rooms, storedSnapshots[DB_KEYS.rooms], localStorageValues);
      const legacyAdminIds = getLegacyAdminIds(
        localUsers,
        storedSnapshots[DB_KEYS.users].localValue,
        storedSnapshots[DB_KEYS.users].cloudValue
      );

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
          key: DB_KEYS.messages,
          nextValue: nextMessages,
          snapshot: storedSnapshots[DB_KEYS.messages]
        },
        {
          key: DB_KEYS.notifications,
          nextValue: nextNotifications,
          snapshot: storedSnapshots[DB_KEYS.notifications]
        },
        {
          key: DB_KEYS.reports,
          nextValue: nextReports,
          snapshot: storedSnapshots[DB_KEYS.reports]
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
            return isNonEmptyArray(snapshot.localValue) || isNonEmptyArray(nextValue);
          }

          return !areCollectionsEqual(snapshot.cloudValue, nextValue);
        })
        .map(({ key, nextValue }) => writeDbValue(key, nextValue));

      if (pendingWrites.length > 0) {
        await Promise.all(pendingWrites.map((write) => write.catch(() => undefined)));
      }

      writeCollectionStorage({
        users: nextUsers,
        notes: nextNotes,
        forumPosts: nextForumPosts,
        messages: nextMessages,
        notifications: nextNotifications,
        reports: nextReports,
        rooms: nextRooms
      });

      if (legacyAdminIds.length > 0) {
        await Promise.all(legacyAdminIds.map((userId) => deleteDbItem(DB_KEYS.users, userId).catch(() => undefined)));
      }

      await finishHydration(nextUsers, nextNotes, nextForumPosts, nextMessages, nextNotifications, nextReports, nextRooms);
    };

    hydrateDatabase().catch(async () => {
      if (!isActive) {
        return;
      }

      await finishHydration(
        buildInitialUsers(readStorage(STORAGE_KEYS.users, DEMO_USERS)),
        buildInitialNotes(readStorage(STORAGE_KEYS.notes, INITIAL_NOTES)),
        buildInitialForumPosts(readStorage(STORAGE_KEYS.forum, INITIAL_FORUM_POSTS)),
        buildInitialMessages(readStorage(STORAGE_KEYS.messages, INITIAL_MESSAGES)),
        buildInitialNotifications(readStorage(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)),
        buildInitialReports(readStorage(STORAGE_KEYS.reports, INITIAL_REPORTS)),
        buildInitialRooms(readStorage(STORAGE_KEYS.rooms, INITIAL_ROOMS))
      );
    });

    return () => {
      isActive = false;
      if (progressTimer) {
        window.clearInterval(progressTimer);
      }
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

    writeStorage(STORAGE_KEYS.notes, notes);
  }, [isHydrating, notes]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.users) {
      hasSkippedInitialSync.current.users = true;
      return;
    }

    writeStorage(STORAGE_KEYS.users, users);
  }, [isHydrating, users]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.forum) {
      hasSkippedInitialSync.current.forum = true;
      return;
    }

    writeStorage(STORAGE_KEYS.forum, forumPosts);
  }, [isHydrating, forumPosts]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.messages) {
      hasSkippedInitialSync.current.messages = true;
      return;
    }

    writeStorage(STORAGE_KEYS.messages, messages);
  }, [isHydrating, messages]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.notifications) {
      hasSkippedInitialSync.current.notifications = true;
      return;
    }

    writeStorage(STORAGE_KEYS.notifications, notifications);
  }, [isHydrating, notifications]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.reports) {
      hasSkippedInitialSync.current.reports = true;
      return;
    }

    writeStorage(STORAGE_KEYS.reports, reports);
  }, [isHydrating, reports]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!hasSkippedInitialSync.current.rooms) {
      hasSkippedInitialSync.current.rooms = true;
      return;
    }

    writeStorage(STORAGE_KEYS.rooms, rooms);
  }, [isHydrating, rooms]);

  useEffect(() => {
    if (isHydrating) {
      return undefined;
    }

    let isActive = true;
    const routeKeys = Array.from(getRouteCloudKeys(pathname));

    const applySnapshot = (key, snapshot) => {
      const nextValue = resolveCollectionState(key, snapshot, {
        [key]: readStorage(COLLECTION_STORAGE_KEYS[key], undefined)
      });

      if (key === DB_KEYS.users) {
        setUsers(nextValue);
      } else if (key === DB_KEYS.notes) {
        setNotes(nextValue);
      } else if (key === DB_KEYS.forum) {
        setForumPosts(nextValue);
      } else if (key === DB_KEYS.messages) {
        setMessages(nextValue);
      } else if (key === DB_KEYS.notifications) {
        setNotifications(nextValue);
      } else if (key === DB_KEYS.reports) {
        setReports(nextValue);
      } else if (key === DB_KEYS.rooms) {
        setRooms(nextValue);
      }
    };

    const loadRouteCollections = async () => {
      const snapshots = await readManyDbSnapshots(
        routeKeys.map((key) => ({
          key,
          ...getCollectionReadOptions(key)
        }))
      );

      if (!isActive) {
        return;
      }

      routeKeys.forEach((key) => applySnapshot(key, snapshots[key]));
    };

    loadRouteCollections().catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [isHydrating, pathname]);

  useEffect(() => {
    if (isHydrating || !isCloudSyncEnabled) {
      return undefined;
    }

    const subscriptionConfig = {
      [DB_KEYS.users]: [setUsers, normalizeUserCollection],
      [DB_KEYS.notes]: [setNotes, normalizeNotes],
      [DB_KEYS.forum]: [setForumPosts, normalizeForumPosts],
      [DB_KEYS.messages]: [setMessages, normalizeMessages],
      [DB_KEYS.notifications]: [setNotifications, normalizeNotifications],
      [DB_KEYS.reports]: [setReports, normalizeReports],
      [DB_KEYS.rooms]: [setRooms, normalizeRooms]
    };

    const unsubscribeHandlers = Array.from(getRouteCloudKeys(pathname)).map((key) => {
      const [setCollection, normalizeCollection] = subscriptionConfig[key];
      return (
        subscribeToDbCollection(key, applyRealtimeCollectionChange(setCollection, normalizeCollection))
      );
    });

    return () => {
      unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isHydrating, pathname]);

  useEffect(() => {
    if (currentUser) {
      writeStorage(STORAGE_KEYS.user, currentUser);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [currentUser]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const matchedUser = users.find((user) => user.id === currentUser.id);

    if (!matchedUser) {
      return;
    }

    const nextSessionUser = buildSessionUser(matchedUser);

    if (JSON.stringify(nextSessionUser) !== JSON.stringify(currentUser)) {
      setCurrentUser(nextSessionUser);
    }
  }, [currentUser, users]);

  const currentUserRecord = useMemo(
    () => users.find((user) => user.id === currentUser?.id) || null,
    [currentUser, users]
  );

  const currentUserForDisplay = useMemo(
    () => (currentUserRecord ? buildSessionUser(currentUserRecord) : currentUser),
    [currentUser, currentUserRecord]
  );

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

  const userNotifications = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return sortNewest(notifications.filter((notification) => notification.targetUserId === currentUser.id));
  }, [currentUser, notifications]);

  const adminInboxReports = useMemo(
    () =>
      sortNewest(reports.filter((report) => report.status === 'open')).map((report) => ({
        id: `report-${report.id}`,
        kind: 'report',
        title: `Open report: ${report.targetTitle}`,
        message: `Reported by ${report.reporterName}. ${report.reason}`,
        createdAt: report.createdAt,
        readAt: null,
        link: '/admin'
      })),
    [reports]
  );

  const unreadNotificationCount = useMemo(
    () => userNotifications.filter((notification) => !notification.readAt).length,
    [userNotifications]
  );

  const openReportCount = useMemo(
    () => reports.filter((report) => report.status === 'open').length,
    [reports]
  );

  const navInboxCount = currentUser?.role === 'admin'
    ? unreadNotificationCount + openReportCount
    : unreadNotificationCount;

  const inboxItems = currentUser?.role === 'admin'
    ? sortNewest([
        ...userNotifications.map((notification) => ({ ...notification, kind: 'notification' })),
        ...adminInboxReports
      ])
    : userNotifications.map((notification) => ({ ...notification, kind: 'notification' }));

  const joinedRooms = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return sortNewest(rooms.filter((room) => room.memberIds.includes(currentUser.id)));
  }, [currentUser, rooms]);

  const directConversations = useMemo(
    () =>
      sortNewest(
        messages.filter(
          (message) =>
            message.type === 'direct' &&
            message.participants.includes(currentUser?.id)
        )
      ),
    [currentUser?.id, messages]
  );

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
    const normalizedEmail = normalizeLuminoteEmail(email);
    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Invalid email or password. Check the account details and try again.'
      };
    }

    if (matchedUser.isActive === false) {
      return {
        success: false,
        message: 'This account has been deactivated by an admin.'
      };
    }

    setCurrentUser(buildSessionUser(matchedUser));
    return {
      success: true,
      message: `Welcome back, ${matchedUser.name}.`
    };
  };

  const handleRegister = ({ name, email, password, additionalInfo = {}, securityQuestion, securityAnswer }) => {
    const normalizedEmail = normalizeLuminoteEmail(email);

    if (!name.trim() || !normalizedEmail || !password.trim()) {
      return {
        success: false,
        message: 'Please complete your name, email, and password.'
      };
    }

    if (!normalizedEmail.endsWith(`@${APP_EMAIL_DOMAIN}`)) {
      return {
        success: false,
        message: `Please use a Luminote email that ends with @${APP_EMAIL_DOMAIN}.`
      };
    }

    if (!securityQuestion?.trim() || !securityAnswer?.trim()) {
      return {
        success: false,
        message: 'Please complete your security question and answer.'
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
      bio: additionalInfo.bio?.trim() || 'New Luminote member ready to share helpful notes.',
      course: additionalInfo.course?.trim() || '',
      yearLevel: additionalInfo.yearLevel?.trim() || '',
      profileVisibility: additionalInfo.profileVisibility || 'public',
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim().toLowerCase(),
      joinedAt: new Date().toISOString(),
      profilePicture: additionalInfo.profilePicture || buildDefaultProfilePicture(name.trim(), 'student')
    };

    setUsers((previousUsers) => [...previousUsers, normalizeUserRecord(newUser)]);
    setCurrentUser(buildSessionUser(newUser));
    writeDbItem(DB_KEYS.users, normalizeUserRecord(newUser)).catch(() => undefined);

    return {
      success: true,
      message: `Account created. Welcome to Luminote, ${newUser.name}.`
    };
  };

  const getRecoveryQuestion = (email) => {
    const normalizedEmail = normalizeLuminoteEmail(email);
    const matchedUser = users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      return {
        success: false,
        message: 'We could not find that Luminote email.',
        question: ''
      };
    }

    return {
      success: true,
      message: 'Security question found.',
      question: matchedUser.securityQuestion
    };
  };

  const handleForgotPassword = ({ email, securityAnswer, newPassword }) => {
    const normalizedEmail = normalizeLuminoteEmail(email);
    const normalizedAnswer = securityAnswer.trim().toLowerCase();
    const trimmedPassword = newPassword.trim();
    const matchedUser = users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!matchedUser) {
      return {
        success: false,
        message: 'We could not find that Luminote email.'
      };
    }

    if (!normalizedAnswer || matchedUser.securityAnswer !== normalizedAnswer) {
      return {
        success: false,
        message: 'The security answer did not match our records.'
      };
    }

    if (!trimmedPassword) {
      return {
        success: false,
        message: 'Please enter a new password.'
      };
    }

    const updatedAt = new Date().toISOString();
    const nextUsers = users.map((user) =>
      user.id === matchedUser.id
        ? normalizeUserRecord({
            ...user,
            password: trimmedPassword,
            updatedAt
          })
        : user
    );

    setUsers(nextUsers);
    writeStorage(STORAGE_KEYS.users, nextUsers);
    writeDbItem(DB_KEYS.users, nextUsers.find((user) => user.id === matchedUser.id)).catch(() => undefined);

    if (currentUser?.id === matchedUser.id) {
      const nextSessionUser = nextUsers.find((user) => user.id === matchedUser.id);
      setCurrentUser(buildSessionUser(nextSessionUser));
    }

    return {
      success: true,
      message: 'Your password has been updated. You can log in now.'
    };
  };

  const handleUpdateProfile = (profileInput) => {
    if (!currentUserRecord) {
      return {
        success: false,
        message: 'Please log in again before updating your profile.'
      };
    }

    const updatedAt = new Date().toISOString();
    const nextUser = normalizeUserRecord({
      ...currentUserRecord,
      name: profileInput.name?.trim() || currentUserRecord.name,
      bio: profileInput.bio ?? currentUserRecord.bio,
      course: profileInput.course ?? currentUserRecord.course,
      yearLevel: profileInput.yearLevel ?? currentUserRecord.yearLevel,
      profileVisibility: profileInput.profileVisibility || currentUserRecord.profileVisibility,
      profilePicture: profileInput.profilePicture || currentUserRecord.profilePicture,
      updatedAt
    });

    const nextUsers = users.map((user) => (user.id === nextUser.id ? nextUser : user));

    setUsers(nextUsers);
    writeStorage(STORAGE_KEYS.users, nextUsers);
    writeDbItem(DB_KEYS.users, nextUser).catch(() => undefined);
    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.uploaderId === nextUser.id
          ? {
              ...note,
              uploaderName: nextUser.name
            }
          : note
      )
    );
    setForumPosts((previousPosts) =>
      previousPosts.map((post) => ({
        ...post,
        authorName: post.authorId === nextUser.id ? nextUser.name : post.authorName,
        comments: (post.comments || []).map((comment) =>
          comment.userId === nextUser.id
            ? {
                ...comment,
                userName: nextUser.name
              }
          : comment
        )
      }))
    );
    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.senderId === nextUser.id
          ? {
              ...message,
              senderName: nextUser.name,
              updatedAt: message.updatedAt || message.createdAt
            }
          : message
      )
    );
    setCurrentUser(buildSessionUser(nextUser));

    return {
      success: true,
      message: 'Your profile was updated.'
    };
  };

  const handlePreviewProfilePicture = (profilePicture) => {
    if (!currentUser) {
      return;
    }

    const updatedAt = new Date().toISOString();

    setCurrentUser((previousUser) =>
      previousUser
        ? {
            ...previousUser,
            profilePicture,
            updatedAt
          }
        : previousUser
    );

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === currentUser.id
          ? normalizeUserRecord({
              ...user,
              profilePicture,
              updatedAt
            })
          : user
      )
    );
  };

  const handleChangePassword = ({ currentPassword, newPassword }) => {
    if (!currentUserRecord) {
      return {
        success: false,
        message: 'Please log in again before changing your password.'
      };
    }

    if (currentUserRecord.password !== currentPassword) {
      return {
        success: false,
        message: 'Your current password is incorrect.'
      };
    }

    if (!newPassword.trim()) {
      return {
        success: false,
        message: 'Please enter a new password.'
      };
    }

    const updatedAt = new Date().toISOString();
    const nextUser = normalizeUserRecord({
      ...currentUserRecord,
      password: newPassword.trim(),
      updatedAt
    });
    const nextUsers = users.map((user) => (user.id === currentUserRecord.id ? nextUser : user));

    setUsers(nextUsers);
    writeStorage(STORAGE_KEYS.users, nextUsers);
    writeDbItem(DB_KEYS.users, nextUser).catch(() => undefined);
    setCurrentUser(buildSessionUser(nextUser));

    return {
      success: true,
      message: 'Your password was updated successfully.'
    };
  };

  const handleAdminToggleUserStatus = async (targetUserId, shouldActivate) => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'Only admins can manage account status.'
      };
    }

    if (targetUserId === currentUser.id) {
      return {
        success: false,
        message: 'You cannot deactivate your own admin account.'
      };
    }

    const targetUser = users.find((user) => user.id === targetUserId);

    if (!targetUser) {
      return {
        success: false,
        message: 'That account could not be found.'
      };
    }

    const updatedAt = new Date().toISOString();
    const nextUser = normalizeUserRecord({
      ...targetUser,
      isActive: shouldActivate,
      deactivatedAt: shouldActivate ? null : updatedAt,
      deactivatedByName: shouldActivate ? '' : currentUser.name,
      updatedAt
    });
    const nextUsers = users.map((user) => (user.id === targetUserId ? nextUser : user));

    try {
      await writeDbItem(DB_KEYS.users, nextUser);
    } catch {
      const message = `Luminote could not ${shouldActivate ? 'reactivate' : 'deactivate'} ${targetUser.name} in Supabase. Please refresh and try again.`;
      setCloudSyncError(message);

      return {
        success: false,
        message
      };
    }

    setUsers(nextUsers);
    writeStorage(STORAGE_KEYS.users, nextUsers);
    setCloudSyncError('');

    return {
      success: true,
      message: shouldActivate ? `${targetUser.name} can log in again.` : `${targetUser.name} has been deactivated.`
    };
  };

  const handleAdminDeleteUser = async (targetUserId) => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'Only admins can delete accounts.'
      };
    }

    if (targetUserId === currentUser.id) {
      return {
        success: false,
        message: 'You cannot delete your own admin account.'
      };
    }

    const targetUser = users.find((user) => user.id === targetUserId);

    if (!targetUser) {
      return {
        success: false,
        message: 'That account could not be found.'
      };
    }

    const nextUsers = users.filter((user) => user.id !== targetUserId);
    const nextRooms = rooms.map((room) => ({
      ...room,
      adminIds: (room.adminIds || []).filter((adminId) => adminId !== targetUserId),
      memberIds: (room.memberIds || []).filter((memberId) => memberId !== targetUserId),
      updatedAt: new Date().toISOString()
    }));
    const nextNotifications = notifications.filter((notification) => notification.targetUserId !== targetUserId);
    const nextMessages = messages.filter((message) => !(message.participants || []).includes(targetUserId));
    const removedNotifications = notifications.filter((notification) => notification.targetUserId === targetUserId);
    const removedMessages = messages.filter((message) => (message.participants || []).includes(targetUserId));

    try {
      await Promise.all([
        deleteDbItem(DB_KEYS.users, targetUserId),
        ...nextRooms.map((room) => writeDbItem(DB_KEYS.rooms, room)),
        ...removedNotifications.map((notification) => deleteDbItem(DB_KEYS.notifications, notification.id)),
        ...removedMessages.map((message) => deleteDbItem(DB_KEYS.messages, message.id))
      ]);
    } catch {
      const message = `Luminote could not delete ${targetUser.name}'s account in Supabase. Please refresh and try again.`;
      setCloudSyncError(message);

      return {
        success: false,
        message
      };
    }

    setUsers(nextUsers);
    setRooms(nextRooms);
    setNotifications(nextNotifications);
    setMessages(nextMessages);
    writeCollectionStorage({
      users: nextUsers,
      notes,
      forumPosts,
      messages: nextMessages,
      notifications: nextNotifications,
      reports,
      rooms: nextRooms
    });
    setCloudSyncError('');

    return {
      success: true,
      message: `${targetUser.name}'s account has been deleted.`
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

  const getAdminAccountActionGuard = (targetUserId, action) => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: action === 'delete' ? 'Only admins can delete accounts.' : 'Only admins can manage account status.'
      };
    }

    if (targetUserId === currentUser.id) {
      return {
        success: false,
        message:
          action === 'delete'
            ? 'You cannot delete your own admin account.'
            : 'You cannot deactivate your own admin account.'
      };
    }

    const targetUser = users.find((user) => user.id === targetUserId);

    if (!targetUser) {
      return {
        success: false,
        message: 'That account could not be found.'
      };
    }

    return {
      success: true,
      targetUser
    };
  };

  const requestAdminToggleUserStatus = (targetUserId, shouldActivate, options = {}) => {
    const guardResult = getAdminAccountActionGuard(targetUserId, 'status');

    if (!guardResult.success) {
      return guardResult;
    }

    const { targetUser } = guardResult;

    openModal({
      variant: shouldActivate ? 'default' : 'danger',
      title: shouldActivate ? `Reactivate ${targetUser.name}?` : `Deactivate ${targetUser.name}?`,
      message: shouldActivate
        ? `${targetUser.name} will be able to log in to Luminote again.`
        : `${targetUser.name} will not be able to log in, but their profile and shared content will remain in Luminote.`,
      confirmLabel: shouldActivate ? 'Reactivate account' : 'Deactivate account',
      onConfirm: async () => {
        const result = await handleAdminToggleUserStatus(targetUserId, shouldActivate);
        closeModal();
        options.onComplete?.(result);
      }
    });

    return {
      success: true
    };
  };

  const requestAdminDeleteUser = (targetUserId, options = {}) => {
    const guardResult = getAdminAccountActionGuard(targetUserId, 'delete');

    if (!guardResult.success) {
      return guardResult;
    }

    const { targetUser } = guardResult;

    openModal({
      variant: 'danger',
      title: `Delete ${targetUser.name}'s account?`,
      message: `This permanently removes the account from Luminote and cleans up room memberships. This cannot be undone.`,
      confirmLabel: 'Delete account',
      onConfirm: async () => {
        const result = await handleAdminDeleteUser(targetUserId);
        closeModal();
        options.onComplete?.(result);
      }
    });

    return {
      success: true
    };
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

  const handleSaveNote = async (noteInput, options = {}) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before submitting a note.'
      };
    }

    const now = new Date().toISOString();
    const nextStatus = options.roomId ? 'approved' : currentUser.role === 'admin' ? 'approved' : 'pending';
    const nextVisibility = options.roomId ? 'room' : 'public';
    const noteId = editingNoteId || Date.now();
    let uploadedAttachments = [];

    try {
      uploadedAttachments = await uploadAttachmentsToStorage(noteInput.attachments || [], {
        collection: 'notes',
        itemId: noteId,
        ownerId: currentUser.id
      });
    } catch (error) {
      return {
        success: false,
        message: getAttachmentUploadErrorMessage(error)
      };
    }

    if (editingNoteId) {
      let updatedNote = null;
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === editingNoteId
            ? (updatedNote = {
                ...note,
                ...noteInput,
                status: nextStatus,
                roomId: options.roomId ?? note.roomId ?? null,
                visibility: options.roomId ? 'room' : note.visibility || nextVisibility,
                attachments: uploadedAttachments,
                rejectionReason: null,
                rejectionByName: null,
                updatedAt: now
              })
            : note
        )
      );

      setEditingNoteId(null);
      if (updatedNote) {
        writeDbItem(DB_KEYS.notes, updatedNote).catch(() => undefined);
      }

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
      id: noteId,
      ...noteInput,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      status: nextStatus,
      roomId: options.roomId || null,
      visibility: nextVisibility,
      attachments: uploadedAttachments,
      rejectionReason: null,
      rejectionByName: null,
      createdAt: now,
      updatedAt: now,
      likes: [],
      reviews: []
    };

    setNotes((previousNotes) => [newNote, ...previousNotes]);
    writeDbItem(DB_KEYS.notes, newNote).catch(() => undefined);

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

  const handleDeleteNote = async (noteId) => {
    const deletedNote = notes.find((note) => note.id === noteId);

    if (!deletedNote) {
      return {
        success: false,
        message: 'That note could not be found.'
      };
    }

    try {
      await deleteDbItem(DB_KEYS.notes, noteId);
    } catch {
      const message = `Luminote could not delete "${deletedNote.title}" in Supabase. Please refresh and try again.`;
      setCloudSyncError(message);

      return {
        success: false,
        message
      };
    }

    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }
    setCloudSyncError('');

    return {
      success: true,
      message: `"${deletedNote.title}" was deleted.`
    };
  };

  const requestDeleteNote = (noteId, options = {}) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    openModal({
      variant: 'danger',
      title: 'Delete this note?',
      message: `This will permanently remove "${note.title}" from Luminote.`,
      confirmLabel: 'Delete note',
      onConfirm: async () => {
        const result = await handleDeleteNote(noteId);
        closeModal();
        if (result.success) {
          options.onSuccess?.();
        }
      }
    });
  };

  const handleToggleLike = (noteId) => {
    if (!currentUser) {
      return;
    }

    const targetNote = notes.find((note) => note.id === noteId);

    if (!targetNote) {
      return;
    }

    const alreadyLiked = targetNote.likes.includes(currentUser.id);
    const updatedNote = {
      ...targetNote,
      likes: alreadyLiked
        ? targetNote.likes.filter((userId) => userId !== currentUser.id)
        : [...targetNote.likes, currentUser.id]
    };

    setNotes((previousNotes) => previousNotes.map((note) => (note.id === noteId ? updatedNote : note)));
    if (updatedNote) {
      writeDbItem(DB_KEYS.notes, updatedNote).catch(() => undefined);
    }

    if (targetNote.uploaderId !== currentUser.id) {
      const likeNotification = buildLikeNotificationPayload(targetNote, currentUser);
      const matchesLikeNotification = (notification) => isMatchingLikeNotification(notification, likeNotification);

      if (alreadyLiked) {
        removeNotificationsMatching(matchesLikeNotification, likeNotification.id);
      } else {
        createNotification(likeNotification, matchesLikeNotification);
      }
    }
  };

  const handleSubmitReview = (noteId, reviewInput) => {
    if (!currentUser) {
      return;
    }

    const reviewedNote = notes.find((note) => note.id === noteId);

    if (!reviewedNote) {
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
    const existingReview = reviewedNote.reviews.find((review) => review.userId === currentUser.id);
    const updatedNote = {
      ...reviewedNote,
      reviews: existingReview
        ? reviewedNote.reviews.map((review) =>
            review.userId === currentUser.id ? { ...review, ...reviewPayload, id: review.id } : review
          )
        : [reviewPayload, ...reviewedNote.reviews]
    };

    setNotes((previousNotes) => previousNotes.map((note) => (note.id === noteId ? updatedNote : note)));
    writeDbItem(DB_KEYS.notes, updatedNote).catch(() => undefined);

    if (reviewedNote && reviewedNote.uploaderId !== currentUser.id) {
      createNotification({
        targetUserId: reviewedNote.uploaderId,
        title: 'New review on your note',
        message: `${currentUser.name} reviewed "${reviewedNote.title}" with ${reviewInput.rating}/5 stars.`,
        type: 'note-review',
        link: reviewedNote.roomId ? `/rooms/${reviewedNote.roomId}/note/${reviewedNote.id}` : `/note/${reviewedNote.id}`
      });
    }
  };

  const handleApproveNote = async (noteId) => {
    const approvedNote = notes.find((note) => note.id === noteId);

    if (!approvedNote) {
      return {
        success: false,
        message: 'That note could not be found.'
      };
    }

    const approvedAt = new Date().toISOString();
    const updatedNote = {
      ...approvedNote,
      status: 'approved',
      approvedAt,
      rejectionReason: null,
      rejectionByName: null,
      updatedAt: approvedAt
    };

    try {
      await writeDbItem(DB_KEYS.notes, updatedNote);
    } catch {
      const message = `Luminote could not approve "${approvedNote.title}" in Supabase. Please refresh and try again.`;
      setCloudSyncError(message);

      return {
        success: false,
        message
      };
    }

    setNotes((previousNotes) => previousNotes.map((note) => (note.id === noteId ? updatedNote : note)));
    setCloudSyncError('');

    if (approvedNote && approvedNote.uploaderId !== currentUser?.id) {
      createNotification({
        targetUserId: approvedNote.uploaderId,
        title: 'Your note was approved',
        message: `"${approvedNote.title}" is now visible to other students.`,
        type: 'note-approved',
        link: approvedNote.roomId ? `/rooms/${approvedNote.roomId}/note/${approvedNote.id}` : `/note/${approvedNote.id}`
      });
    }

    return {
      success: true,
      message: `"${approvedNote.title}" was approved.`
    };
  };

  const handleRejectNote = async (noteId, rejectionReason) => {
    const rejectedNote = notes.find((note) => note.id === noteId);

    if (!rejectedNote) {
      return {
        success: false,
        message: 'That note could not be found.'
      };
    }

    const updatedNote = {
      ...rejectedNote,
      status: 'rejected',
      rejectionReason,
      rejectionByName: currentUser?.name || 'Admin',
      updatedAt: new Date().toISOString()
    };

    try {
      await writeDbItem(DB_KEYS.notes, updatedNote);
    } catch {
      const message = `Luminote could not reject "${rejectedNote.title}" in Supabase. Please refresh and try again.`;
      setCloudSyncError(message);

      return {
        success: false,
        message
      };
    }

    setNotes((previousNotes) => previousNotes.map((note) => (note.id === noteId ? updatedNote : note)));
    setCloudSyncError('');

    if (rejectedNote && rejectedNote.uploaderId !== currentUser?.id) {
      createNotification({
        targetUserId: rejectedNote.uploaderId,
        title: 'Your note needs revision',
        message: rejectionReason || `The admin requested changes for "${rejectedNote.title}".`,
        type: 'note-rejected',
        link: '/profile'
      });
    }

    return {
      success: true,
      message: `"${rejectedNote.title}" was rejected.`
    };
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
      onConfirm: async () => {
        await handleApproveNote(noteId);
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
      onConfirm: async (comment) => {
        await handleRejectNote(noteId, comment);
        closeModal();
      }
    });
  };

  const createNotification = (
    {
      actorId = '',
      dedupeKey = '',
      id = '',
      link = '',
      message,
      sourceId = '',
      sourceType = '',
      targetUserId,
      title,
      type = 'system'
    },
    matchesExisting = null
  ) => {
    if (!targetUserId) {
      return;
    }

    const nextNotification = {
      id: id || `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      targetUserId,
      title,
      message,
      type,
      link,
      actorId,
      sourceId,
      sourceType,
      dedupeKey,
      createdAt: new Date().toISOString(),
      readAt: null
    };
    const duplicateIds = notifications
      .filter((notification) => notification.id !== nextNotification.id && matchesExisting?.(notification))
      .map((notification) => notification.id);

    setNotifications((previousNotifications) => [
      nextNotification,
      ...previousNotifications.filter(
        (notification) => notification.id !== nextNotification.id && !matchesExisting?.(notification)
      )
    ]);
    writeDbItem(DB_KEYS.notifications, nextNotification).catch(() => undefined);
    Promise.all(duplicateIds.map((notificationId) => deleteDbItem(DB_KEYS.notifications, notificationId))).catch(
      () => undefined
    );
  };

  const removeNotificationsMatching = (matchesNotification, fallbackNotificationId = '') => {
    const idsToDelete = new Set(fallbackNotificationId ? [fallbackNotificationId] : []);

    notifications.forEach((notification) => {
      if (notification.id === fallbackNotificationId || matchesNotification(notification)) {
        idsToDelete.add(notification.id);
      }
    });

    setNotifications((previousNotifications) =>
      previousNotifications.filter(
        (notification) => notification.id !== fallbackNotificationId && !matchesNotification(notification)
      )
    );
    Promise.all([...idsToDelete].map((notificationId) => deleteDbItem(DB_KEYS.notifications, notificationId))).catch(
      () => undefined
    );
  };

  const uploadVoiceDraftToStorage = async (voice, messageId) => {
    if (!voice?.dataUrl || !isCloudSyncEnabled) {
      return voice || null;
    }

    const [uploadedVoice] = await uploadAttachmentsToStorage(
      [
        {
          id: `voice-${messageId}`,
          name: `voice-${messageId}.webm`,
          type: voice.mimeType || 'audio/webm',
          size: voice.size || 0,
          dataUrl: voice.dataUrl,
          isImage: false,
          attachedAt: new Date().toISOString()
        }
      ],
      {
        collection: 'message-voices',
        itemId: messageId,
        ownerId: currentUser?.id || 'anonymous'
      }
    );
    const voiceMetadata = { ...voice };
    delete voiceMetadata.dataUrl;

    return {
      ...voiceMetadata,
      url: uploadedVoice.url,
      storagePath: uploadedVoice.storagePath,
      bucket: uploadedVoice.bucket
    };
  };

  const handleSendDirectMessage = async (targetUserId, text, options = {}) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before sending a message.'
      };
    }

    const trimmedText = text.trim();
    const voice = options.voice || null;
    const attachments = Array.isArray(options.attachments) ? options.attachments : [];
    const targetUser = users.find((user) => user.id === targetUserId);

    if ((!trimmedText && !voice && attachments.length === 0) || !targetUser || targetUser.id === currentUser.id) {
      return {
        success: false,
        message: 'Choose a valid recipient and enter a message, file, image, or voice note first.'
      };
    }

    const now = new Date().toISOString();
    const participants = [currentUser.id, targetUser.id].sort();
    const conversationKey = `direct:${participants.join(':')}`;
    const messageId = `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let uploadedAttachments = [];
    let uploadedVoice = voice;

    try {
      uploadedAttachments = await uploadAttachmentsToStorage(attachments, {
        collection: 'message-attachments',
        itemId: messageId,
        ownerId: currentUser.id
      });
      uploadedVoice = await uploadVoiceDraftToStorage(voice, messageId);
    } catch (error) {
      return {
        success: false,
        message: getAttachmentUploadErrorMessage(error, 'message attachment')
      };
    }

    const nextMessage = {
      id: messageId,
      type: 'direct',
      roomId: null,
      participants,
      conversationKey,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: trimmedText,
      voice: uploadedVoice,
      attachments: uploadedAttachments,
      createdAt: now,
      updatedAt: now,
      readBy: [currentUser.id],
      deletedFor: []
    };

    setMessages((previousMessages) => [nextMessage, ...previousMessages]);
    writeDbItem(DB_KEYS.messages, nextMessage).catch(() => undefined);

    const attachmentPreview =
      attachments.length > 0
        ? `Sent ${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`
        : '';
    const notificationPreview = voice
      ? 'Sent a voice note'
      : trimmedText
        ? trimmedText.slice(0, 90)
        : attachmentPreview;

    createNotification({
      targetUserId: targetUser.id,
      title: 'New direct message',
      message: `${currentUser.name}: ${notificationPreview}`,
      type: 'direct-message',
      link: `/messages?user=${currentUser.id}`
    });

    return {
      success: true,
      message: 'Message sent.'
    };
  };

  const handleSendRoomMessage = (roomId, text, options = {}) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before sending a room message.'
      };
    }

    const trimmedText = text.trim();
    const room = rooms.find((item) => item.id === roomId);
    const mentions = Array.isArray(options.mentions) ? options.mentions : [];

    if (!trimmedText || !room || !room.memberIds.includes(currentUser.id)) {
      return {
        success: false,
        message: 'Only room members can send messages here.'
      };
    }

    const now = new Date().toISOString();
    const nextMessage = {
      id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'room',
      roomId,
      participants: [...room.memberIds],
      conversationKey: `room:${roomId}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: trimmedText,
      mentions,
      createdAt: now,
      updatedAt: now,
      readBy: [currentUser.id],
      deletedFor: []
    };

    setMessages((previousMessages) => [nextMessage, ...previousMessages]);
    writeDbItem(DB_KEYS.messages, nextMessage).catch(() => undefined);

    mentions
      .filter((mention) => mention.id !== currentUser.id && room.memberIds.includes(mention.id))
      .forEach((mention) => {
        createNotification({
          targetUserId: mention.id,
          title: 'You were mentioned in room chat',
          message: `${currentUser.name} mentioned you in ${room.name}.`,
          type: 'room-message',
          link: `/rooms/${room.id}`
        });
      });

    return {
      success: true,
      message: 'Room message sent.'
    };
  };

  const handleMarkConversationRead = (conversationKey) => {
    if (!currentUser) {
      return;
    }

    const updatedMessages = [];
    setMessages((previousMessages) => {
      let hasChanged = false;

      const nextMessages = previousMessages.map((message) => {
        const readBy = Array.isArray(message.readBy) ? message.readBy : [];

        if (message.conversationKey !== conversationKey || readBy.includes(currentUser.id)) {
          return message;
        }

        hasChanged = true;

        const updatedMessage = {
          ...message,
          readBy: [...readBy, currentUser.id],
          updatedAt: new Date().toISOString()
        };
        updatedMessages.push(updatedMessage);

        return updatedMessage;
      });

      return hasChanged ? nextMessages : previousMessages;
    });
    Promise.all(updatedMessages.map((message) => writeDbItem(DB_KEYS.messages, message).catch(() => undefined)));
  };

  const handleDeleteDirectConversation = (conversationKey) => {
    if (!currentUser || !conversationKey) {
      return {
        success: false,
        message: 'Please choose a conversation first.'
      };
    }

    const now = new Date().toISOString();

    const updatedMessages = [];
    setMessages((previousMessages) =>
      previousMessages.map((message) => {
        if (
          message.type !== 'direct' ||
          message.conversationKey !== conversationKey ||
          !(message.participants || []).includes(currentUser.id)
        ) {
          return message;
        }

        if ((message.deletedFor || []).includes(currentUser.id)) {
          return message;
        }

        const updatedMessage = {
          ...message,
          deletedFor: [...(message.deletedFor || []), currentUser.id],
          readBy: (message.readBy || []).includes(currentUser.id)
            ? message.readBy || []
            : [...(message.readBy || []), currentUser.id],
          updatedAt: now
        };
        updatedMessages.push(updatedMessage);

        return updatedMessage;
      })
    );
    Promise.all(updatedMessages.map((message) => writeDbItem(DB_KEYS.messages, message).catch(() => undefined)));

    return {
      success: true,
      message: 'Conversation deleted.'
    };
  };

  const requestDeleteDirectConversation = (conversationKey, options = {}) => {
    if (!currentUser || !conversationKey) {
      return {
        success: false,
        message: 'Please choose a conversation first.'
      };
    }

    const conversationName = options.conversationName ? ` with ${options.conversationName}` : '';

    openModal({
      variant: 'danger',
      title: `Delete conversation${conversationName}?`,
      message: 'This removes the conversation from your inbox on this account.',
      confirmLabel: 'Delete conversation',
      onConfirm: () => {
        const result = handleDeleteDirectConversation(conversationKey);
        closeModal();
        options.onComplete?.(result);
      }
    });

    return {
      success: true
    };
  };

  const handleMarkRoomMessagesRead = (roomId) => {
    handleMarkConversationRead(`room:${roomId}`);
  };

  const createAnnouncementNotifications = ({ audience, message, targetUserId = '', title }) => {
    const targets =
      audience === 'all'
        ? users.filter((user) => user.id !== currentUser?.id)
        : users.filter((user) => user.id === targetUserId);

    if (targets.length === 0) {
      return {
        success: false,
        message: 'No matching users were found for this announcement.'
      };
    }

    const createdAt = new Date().toISOString();
    const announcementNotifications = targets.map((user, index) => ({
      id: `notification-${Date.now()}-${index}-${user.id}`,
      targetUserId: user.id,
      title,
      message,
      type: 'announcement',
      link: '/notifications',
      createdAt,
      readAt: null
    }));

    setNotifications((previousNotifications) => [...announcementNotifications, ...previousNotifications]);
    Promise.all(
      announcementNotifications.map((notification) =>
        writeDbItem(DB_KEYS.notifications, notification).catch(() => undefined)
      )
    );

    return {
      success: true,
      message: audience === 'all' ? 'Announcement sent to all users.' : 'Announcement sent successfully.'
    };
  };

  const handleMarkNotificationRead = (notificationId) => {
    let updatedNotification = null;
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === notificationId && !notification.readAt
          ? (updatedNotification = {
              ...notification,
              readAt: new Date().toISOString()
            })
          : notification
      )
    );
    if (updatedNotification) {
      writeDbItem(DB_KEYS.notifications, updatedNotification).catch(() => undefined);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const updatedNotifications = [];
    const readAt = new Date().toISOString();

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => {
        if (notification.targetUserId !== currentUser?.id || notification.readAt) {
          return notification;
        }

        const updatedNotification = {
          ...notification,
          readAt
        };

        updatedNotifications.push(updatedNotification);
        return updatedNotification;
      })
    );
    Promise.all(
      updatedNotifications.map((notification) =>
        writeDbItem(DB_KEYS.notifications, notification).catch(() => undefined)
      )
    );
  };

  const handleCreateReport = ({ targetId, targetType, targetTitle, roomId = null, reason }) => {
    if (!currentUser) {
      return;
    }

    const nextReport = {
      id: `report-${Date.now()}`,
      targetId: String(targetId),
      targetType,
      targetTitle,
      roomId,
      reason,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'open'
    };

    setReports((previousReports) => [nextReport, ...previousReports]);
    writeDbItem(DB_KEYS.reports, nextReport).catch(() => undefined);
  };

  const requestReportItem = ({ targetId, targetType, targetTitle, roomId = null }) => {
    if (!currentUser) {
      return;
    }

    openModal({
      variant: 'danger',
      title: `Report this ${targetType === 'forum-post' ? 'forum post' : 'note'}?`,
      message: `Tell the admin what is wrong with "${targetTitle}".`,
      confirmLabel: 'Submit report',
      requireComment: true,
      commentLabel: 'Report reason',
      commentPlaceholder: 'Example: Spam, inappropriate content, copied material, or misleading information.',
      onConfirm: (comment) => {
        handleCreateReport({
          targetId,
          targetType,
          targetTitle,
          roomId,
          reason: comment
        });
        closeModal();
      }
    });
  };

  const handleResolveReport = (reportId) => {
    let updatedReport = null;
    setReports((previousReports) =>
      previousReports.map((report) =>
        report.id === reportId
          ? (updatedReport = {
              ...report,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedByName: currentUser?.name || 'Admin'
            })
          : report
      )
    );
    if (updatedReport) {
      writeDbItem(DB_KEYS.reports, updatedReport).catch(() => undefined);
    }
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
    writeDbItem(DB_KEYS.forum, newPost).catch(() => undefined);
  };

  const handleDeleteForumPost = (postId) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before deleting a forum post.'
      };
    }

    const targetPost = forumPosts.find((post) => String(post.id) === String(postId));

    if (!targetPost) {
      return {
        success: false,
        message: 'That forum post could not be found.'
      };
    }

    const canDeletePost = currentUser.role === 'admin' || targetPost.authorId === currentUser.id;

    if (!canDeletePost) {
      return {
        success: false,
        message: 'Only admins and post authors can delete this forum post.'
      };
    }

    setForumPosts((previousPosts) => previousPosts.filter((post) => String(post.id) !== String(postId)));
    deleteDbItem(DB_KEYS.forum, postId).catch(() => undefined);

    return {
      success: true,
      message: 'Forum post deleted.'
    };
  };

  const requestDeleteForumPost = (postId, options = {}) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Please log in before deleting a forum post.'
      };
    }

    const targetPost = forumPosts.find((post) => String(post.id) === String(postId));

    if (!targetPost) {
      return {
        success: false,
        message: 'That forum post could not be found.'
      };
    }

    const canDeletePost = currentUser.role === 'admin' || targetPost.authorId === currentUser.id;

    if (!canDeletePost) {
      return {
        success: false,
        message: 'Only admins and post authors can delete this forum post.'
      };
    }

    const postLocation = targetPost.roomId || options.context === 'room' ? 'this room forum' : 'the forum';

    openModal({
      variant: 'danger',
      title: `Delete "${targetPost.title}"?`,
      message: `This removes the post from ${postLocation}.`,
      confirmLabel: 'Delete post',
      onConfirm: () => {
        const result = handleDeleteForumPost(postId);
        closeModal();
        options.onComplete?.(result);
      }
    });

    return {
      success: true
    };
  };

  const handleVoteForumPost = (postId, direction) => {
    if (!currentUser) {
      return;
    }

    let updatedPost = null;
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
            updatedPost = {
              ...post,
              upvotes: [...upvoteSet],
              downvotes: [...downvoteSet]
            };

            return updatedPost;
          }

          downvoteSet.delete(currentUser.id);
          upvoteSet.add(currentUser.id);

          updatedPost = {
            ...post,
            upvotes: [...upvoteSet],
            downvotes: [...downvoteSet]
          };

          return updatedPost;
        }

        if (hasDownvoted) {
          downvoteSet.delete(currentUser.id);
          updatedPost = {
            ...post,
            upvotes: [...upvoteSet],
            downvotes: [...downvoteSet]
          };

          return updatedPost;
        }

        upvoteSet.delete(currentUser.id);
        downvoteSet.add(currentUser.id);

        updatedPost = {
          ...post,
          upvotes: [...upvoteSet],
          downvotes: [...downvoteSet]
        };

        return updatedPost;
      })
    );
    if (updatedPost) {
      writeDbItem(DB_KEYS.forum, updatedPost).catch(() => undefined);
    }
  };

  const handleCommentOnPost = (postId, commentText, options = {}) => {
    if (!currentUser) {
      return;
    }

    const commentedPost = forumPosts.find((post) => post.id === postId);
    let updatedPost = null;
    const mentions = Array.isArray(options.mentions) ? options.mentions : [];
    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      parentId: options.parentId || null,
      mentions,
      createdAt: new Date().toISOString()
    };

    setForumPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === postId ? (updatedPost = { ...post, comments: [...(post.comments || []), newComment] }) : post
      )
    );
    if (updatedPost) {
      writeDbItem(DB_KEYS.forum, updatedPost).catch(() => undefined);
    }

    if (commentedPost && commentedPost.authorId !== currentUser.id) {
      createNotification({
        targetUserId: commentedPost.authorId,
        title: 'New comment on your forum post',
        message: `${currentUser.name} commented on "${commentedPost.title}".`,
        type: 'forum-comment',
        link: commentedPost.roomId ? `/rooms/${commentedPost.roomId}` : '/forum'
      });
    }

    if (commentedPost) {
      const alreadyNotified = new Set([currentUser.id, commentedPost.authorId]);

      mentions
        .filter((mention) => mention.id && !alreadyNotified.has(mention.id))
        .forEach((mention) => {
          alreadyNotified.add(mention.id);
          createNotification({
            targetUserId: mention.id,
            title: 'You were mentioned in a comment',
            message: `${currentUser.name} mentioned you on "${commentedPost.title}".`,
            type: 'forum-mention',
            link: commentedPost.roomId ? `/rooms/${commentedPost.roomId}` : '/forum'
          });
        });
    }
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
      updatedAt: new Date().toISOString(),
      adminIds: [currentUser.id],
      memberIds: [currentUser.id]
    };

    const nextRooms = [nextRoom, ...latestRooms];
    setRooms(nextRooms);
    await writeDbItem(DB_KEYS.rooms, nextRoom);

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
      memberIds: [...new Set([...matchedRoom.memberIds, currentUser.id])],
      updatedAt: new Date().toISOString()
    };

    const nextRooms = latestRooms.map((room) => (room.id === matchedRoom.id ? updatedRoom : room));
    setRooms(nextRooms);
    await writeDbItem(DB_KEYS.rooms, updatedRoom);

    return {
      success: true,
      room: updatedRoom,
      shareLink: buildRoomLink(updatedRoom),
      message: `You joined ${updatedRoom.name}.`
    };
  };

  const handlePromoteRoomMember = (roomId, memberId) => {
    const nextRooms = rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              adminIds: [...new Set([...(room.adminIds || []), memberId])],
              updatedAt: new Date().toISOString()
            }
          : room
      );

    setRooms(nextRooms);
    writeStorage(STORAGE_KEYS.rooms, nextRooms);
    writeDbItem(DB_KEYS.rooms, nextRooms.find((room) => room.id === roomId)).catch(() => undefined);
  };

  const handleKickRoomMember = (roomId, memberId) => {
    const nextRooms = rooms.map((room) => {
        if (room.id !== roomId || memberId === room.ownerId) {
          return room;
        }

        return {
          ...room,
          adminIds: (room.adminIds || []).filter((adminId) => adminId !== memberId),
          memberIds: room.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
          updatedAt: new Date().toISOString()
        };
      });

    setRooms(nextRooms);
    writeStorage(STORAGE_KEYS.rooms, nextRooms);
    writeDbItem(DB_KEYS.rooms, nextRooms.find((room) => room.id === roomId)).catch(() => undefined);
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
          <p className="auth-eyebrow">Luminote</p>
          <h1>Loading your study space...</h1>
          <p>
            {isCloudSyncEnabled
              ? 'Preparing notes, rooms, forum posts, and shared accounts from the Supabase database.'
              : 'Preparing notes, rooms, forum posts, and saved accounts from the local database.'}
          </p>
          <div className="app-loading-progress" aria-label="Loading progress">
            <div className="app-loading-progress-bar" style={{ width: `${hydrationProgress}%` }} />
          </div>
          <small>{hydrationProgress}% completed</small>
        </div>
      </div>
    );
  }

  if (cloudSyncError) {
    return (
      <div className="app">
        <div className="app-loading-screen">
          <div className="app-loading-card app-cloud-error-card">
            <div className="brand-logo">
              <span className="brand-mark">LN</span>
              <span>Luminote</span>
            </div>
            <p className="auth-eyebrow">Cloud sync needs setup</p>
            <h1>Supabase is not returning the Luminote tables.</h1>
            <p>
              Fresh devices will only see built-in/demo data until the SQL schema exists in the same Supabase
              project used by this deployed app.
            </p>
            <p className="app-cloud-error-detail">{cloudSyncError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Retry connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="app">
        <ScrollToTop />
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={handleLogin}
                onRegister={handleRegister}
                onForgotPassword={handleForgotPassword}
                onGetRecoveryQuestion={getRecoveryQuestion}
                theme={theme}
                onToggleTheme={toggleTheme}
                securityQuestions={SECURITY_QUESTIONS}
                users={users}
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
      <ScrollToTop />
      <Navbar
        currentUser={currentUserForDisplay}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        pendingCount={pendingNotes.length}
        inboxCount={navInboxCount}
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
                users={users}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
              />
            }
          />
          <Route
            path="/messages"
            element={
              <MessagesPage
                currentUser={currentUser}
                users={users}
                messages={messages}
                onSendDirectMessage={handleSendDirectMessage}
                onMarkConversationRead={handleMarkConversationRead}
                onDeleteDirectConversation={requestDeleteDirectConversation}
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
                users={users}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
                onSubmitReview={handleSubmitReview}
                onReport={requestReportItem}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                notes={userNotes}
                users={users}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
                onUpdateProfile={handleUpdateProfile}
                onPreviewProfilePicture={handlePreviewProfilePicture}
                onChangePassword={handleChangePassword}
                onAdminToggleUserStatus={requestAdminToggleUserStatus}
                onAdminDeleteUser={requestAdminDeleteUser}
              />
            }
          />
          <Route
            path="/users/:userId"
            element={
              <ProfilePage
                notes={publicNotes}
                users={users}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
                onUpdateProfile={handleUpdateProfile}
                onPreviewProfilePicture={handlePreviewProfilePicture}
                onChangePassword={handleChangePassword}
                onAdminToggleUserStatus={requestAdminToggleUserStatus}
                onAdminDeleteUser={requestAdminDeleteUser}
              />
            }
          />
          <Route
            path="/notifications"
            element={
              <NotificationsPage
                currentUser={currentUser}
                items={inboxItems}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
            }
          />
          <Route
            path="/forum"
            element={
              <ForumPage
                currentUser={currentUser}
                users={users}
                posts={sortedForumPosts}
                onCreatePost={handleCreateForumPost}
                onVote={handleVoteForumPost}
                onComment={handleCommentOnPost}
                onReport={requestReportItem}
                onDeletePost={requestDeleteForumPost}
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
                roomMessages={messages.filter((message) => message.type === 'room')}
                editingNote={editingNote}
                onEdit={startEditingNote}
                onCancelEdit={cancelEditingNote}
                onSubmitRoomNote={handleSubmitRoomNote}
                onCreateRoomPost={handleCreateRoomPost}
                onSendRoomMessage={handleSendRoomMessage}
                onMarkRoomMessagesRead={handleMarkRoomMessagesRead}
                onVotePost={handleVoteForumPost}
                onCommentPost={handleCommentOnPost}
                onDeletePost={requestDeleteForumPost}
                onReportPost={requestReportItem}
                onToggleLike={handleToggleLike}
                onDeleteNote={requestDeleteNote}
                onJoinRoom={handleJoinRoom}
                onRefreshRooms={loadLatestRooms}
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
                users={users}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onDelete={requestDeleteNote}
                onEdit={startEditingNote}
                onSubmitReview={handleSubmitReview}
                onReport={requestReportItem}
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
                  reports={sortNewest(reports)}
                  users={users}
                  onApprove={requestApproveNote}
                  onReject={requestRejectNote}
                  onDelete={requestDeleteNote}
                  onResolveReport={handleResolveReport}
                  onCreateAnnouncement={createAnnouncementNotifications}
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
