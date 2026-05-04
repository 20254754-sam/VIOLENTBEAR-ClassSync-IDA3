import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { readDbValue, subscribeToDbCollection, writeDbValue } from '../lib/classsyncDb';

const GAME_BOARD_SIZE = 8;
const CLASSBLOCKS_LEADERBOARD_KEY = 'classblocks-leaderboard-v1';
const CLASSBLOCKS_DB_KEY = 'gameScores';
const BACKGROUND_UNLOCK_BOOK_LIMIT = 5;

const backgroundNotes = [
  { className: 'auth-note-one', x: 0.12, y: 0.2, color: 'rgba(78, 110, 216, 0.58)' },
  { className: 'auth-note-two', x: -0.14, y: 0.1, color: 'rgba(240, 139, 168, 0.58)' },
  { className: 'auth-note-three', x: 0.08, y: -0.12, color: 'rgba(106, 99, 210, 0.56)' },
  { className: 'auth-note-four', x: -0.12, y: -0.08, color: 'rgba(244, 211, 155, 0.62)' },
  { className: 'auth-note-five', x: 0.16, y: 0.06, color: 'rgba(91, 116, 214, 0.54)' },
  { className: 'auth-note-six', x: -0.08, y: 0.15, color: 'rgba(240, 139, 168, 0.54)' },
  { className: 'auth-note-seven', x: 0.1, y: -0.16, color: 'rgba(106, 99, 210, 0.52)' },
  { className: 'auth-note-eight', x: -0.15, y: 0.12, color: 'rgba(255, 240, 201, 0.64)' },
  { className: 'auth-note-nine', x: 0.15, y: -0.08, color: 'rgba(78, 110, 216, 0.44)' },
  { className: 'auth-note-ten', x: -0.1, y: 0.18, color: 'rgba(240, 139, 168, 0.46)' },
  { className: 'auth-note-eleven', x: 0.08, y: 0.14, color: 'rgba(106, 99, 210, 0.42)' },
  { className: 'auth-note-twelve', x: -0.16, y: -0.06, color: 'rgba(244, 211, 155, 0.5)' },
  { className: 'auth-note-thirteen', x: 0.12, y: -0.18, color: 'rgba(91, 116, 214, 0.42)' },
  { className: 'auth-note-fourteen', x: -0.1, y: 0.12, color: 'rgba(240, 139, 168, 0.44)' }
];

const cardBooks = [
  { className: 'auth-copy-book-one' },
  { className: 'auth-copy-book-two' },
  { className: 'auth-copy-book-three' },
  { className: 'auth-copy-book-four' },
  { className: 'auth-copy-book-five' },
  { className: 'auth-copy-book-six' },
  { className: 'auth-copy-book-seven' }
];

const getEmailPrefix = (value) => value.replace(/@classsync\.com$/i, '').replace(/\s+/g, '');

const getClassSyncEmail = (value) => {
  const prefix = getEmailPrefix(value || '').trim().toLowerCase();
  return prefix ? `${prefix}@classsync.com` : '';
};

const readClassBlocksLeaderboard = () => {
  try {
    const stored = window.localStorage.getItem(CLASSBLOCKS_LEADERBOARD_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeClassBlocksLeaderboard = (leaderboard) => {
  try {
    window.localStorage.setItem(CLASSBLOCKS_LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch {
    // Local storage can fail in private windows; the game still works without persistence.
  }
};

const normalizeClassBlocksLeaderboard = (leaderboard) => {
  const bestByPlayer = new Map();

  (Array.isArray(leaderboard) ? leaderboard : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const normalizedName = String(entry.name || 'Guest player').trim() || 'Guest player';
    const playerKey = entry.playerKey || getClassBlocksPlayerKey(normalizedName);
    const highScore = Number(entry.highScore ?? entry.score ?? 0);

    if (!Number.isFinite(highScore) || highScore <= 0) {
      return;
    }

    const existingEntry = bestByPlayer.get(playerKey);

    if (existingEntry && existingEntry.highScore >= highScore) {
      return;
    }

    bestByPlayer.set(playerKey, {
      id: playerKey,
      playerKey,
      name: normalizedName,
      highScore,
      createdAt: entry.createdAt || entry.updatedAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString()
    });
  });

  return Array.from(bestByPlayer.values());
};

const sortClassBlocksLeaderboard = (leaderboard) =>
  normalizeClassBlocksLeaderboard(leaderboard).sort((first, second) => {
    if (second.highScore !== first.highScore) {
      return second.highScore - first.highScore;
    }

    return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
  });

const getClassBlocksPlayer = ({ mode, credentials, registerForm, users }) => {
  const formEmail = mode === 'register' ? registerForm.email : credentials.email;
  const email = getClassSyncEmail(formEmail);
  const matchedUser = users.find((user) => user.email?.toLowerCase() === email);
  const fallbackName = mode === 'register' ? registerForm.name.trim() : '';

  if (!email) {
    return {
      id: 'guest',
      name: fallbackName || 'Guest player',
      email: 'guest@classblocks.local'
    };
  }

  return {
    id: matchedUser?.id || email,
    name: matchedUser?.name || fallbackName || getEmailPrefix(email) || 'ClassSync Player',
    email
  };
};

const getClassBlocksPlayerKey = (name) =>
  (name || 'Guest player')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'guest-player';

const blockPieces = [
  { id: 'single', tier: 'easy', cells: [[0, 0]], color: 'var(--accent)' },
  { id: 'line2-h', tier: 'easy', cells: [[0, 0], [1, 0]], color: 'var(--accent-strong)' },
  { id: 'line2-v', tier: 'easy', cells: [[0, 0], [0, 1]], color: 'var(--accent-strong)' },
  { id: 'line3-h', tier: 'easy', cells: [[0, 0], [1, 0], [2, 0]], color: 'var(--accent)' },
  { id: 'line3-v', tier: 'easy', cells: [[0, 0], [0, 1], [0, 2]], color: 'var(--accent)' },
  { id: 'line4-h', tier: 'medium', cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: 'var(--accent-warm)' },
  { id: 'line4-v', tier: 'medium', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 'var(--accent-warm)' },
  { id: 'line5-h', tier: 'hard', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], color: 'var(--accent-strong)' },
  { id: 'line5-v', tier: 'hard', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], color: 'var(--accent-strong)' },
  { id: 'square2', tier: 'easy', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: 'var(--accent-strong)' },
  {
    id: 'square3',
    tier: 'hard',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2]
    ],
    color: 'var(--accent-warm)'
  },
  { id: 'corner-small', tier: 'medium', cells: [[0, 0], [0, 1], [1, 1]], color: 'var(--accent-warm)' },
  { id: 'corner-small-r', tier: 'medium', cells: [[1, 0], [0, 1], [1, 1]], color: 'var(--accent-warm)' },
  { id: 'corner-large', tier: 'medium', cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], color: 'var(--accent)' },
  { id: 'corner-large-r', tier: 'medium', cells: [[2, 0], [2, 1], [0, 2], [1, 2], [2, 2]], color: 'var(--accent)' },
  { id: 'l-2x3', tier: 'medium', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], color: 'var(--accent-strong)' },
  { id: 'l-3x2', tier: 'medium', cells: [[0, 0], [1, 0], [2, 0], [0, 1]], color: 'var(--accent-strong)' },
  { id: 't-up', tier: 'medium', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: 'var(--accent)' },
  { id: 't-down', tier: 'medium', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: 'var(--accent)' },
  { id: 'zigzag-s', tier: 'hard', cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: 'var(--accent-warm)' },
  { id: 'zigzag-z', tier: 'hard', cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: 'var(--accent-warm)' },
  { id: 'rect-2x3', tier: 'hard', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], color: 'var(--accent-strong)' },
  { id: 'rect-3x2', tier: 'hard', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]], color: 'var(--accent-strong)' }
];

const createEmptyBoard = () =>
  Array.from({ length: GAME_BOARD_SIZE }, () => Array.from({ length: GAME_BOARD_SIZE }, () => null));

const getPieceFootprint = (piece) => ({
  width: Math.max(...piece.cells.map(([x]) => x)) + 1,
  height: Math.max(...piece.cells.map(([, y]) => y)) + 1
});

const canPlacePiece = (board, piece, row, col) =>
  piece.cells.every(([x, y]) => {
    const targetRow = row + y;
    const targetCol = col + x;

    return (
      targetRow >= 0 &&
      targetRow < GAME_BOARD_SIZE &&
      targetCol >= 0 &&
      targetCol < GAME_BOARD_SIZE &&
      !board[targetRow][targetCol]
    );
  });

const placePieceOnBoard = (board, piece, row, col) => {
  const nextBoard = board.map((boardRow) => [...boardRow]);

  piece.cells.forEach(([x, y]) => {
    nextBoard[row + y][col + x] = piece.color;
  });

  return nextBoard;
};

const clearCompletedLines = (board) => {
  const rowsToClear = new Set();
  const colsToClear = new Set();

  board.forEach((row, rowIndex) => {
    if (row.every(Boolean)) {
      rowsToClear.add(rowIndex);
    }
  });

  for (let colIndex = 0; colIndex < GAME_BOARD_SIZE; colIndex += 1) {
    if (board.every((row) => row[colIndex])) {
      colsToClear.add(colIndex);
    }
  }

  if (!rowsToClear.size && !colsToClear.size) {
    return { board, cleared: 0, rowsToClear, colsToClear };
  }

  return {
    board: board.map((row, rowIndex) =>
      row.map((cell, colIndex) => (rowsToClear.has(rowIndex) || colsToClear.has(colIndex) ? null : cell))
    ),
    cleared: rowsToClear.size + colsToClear.size,
    rowsToClear,
    colsToClear
  };
};

const getLineClearBaseScore = (clearedLines) => (clearedLines * (clearedLines + 1) * 10) / 2;

const getPiecePlacements = (board, piece) => {
  const footprint = getPieceFootprint(piece);
  const placements = [];

  for (let row = 0; row <= GAME_BOARD_SIZE - footprint.height; row += 1) {
    for (let col = 0; col <= GAME_BOARD_SIZE - footprint.width; col += 1) {
      if (canPlacePiece(board, piece, row, col)) {
        placements.push({ row, col });
      }
    }
  }

  return placements;
};

const canAnyPieceFit = (board, pieces) => pieces.some((piece) => getPiecePlacements(board, piece).length > 0);

const canPieceClearLine = (board, piece) =>
  getPiecePlacements(board, piece).some(({ row, col }) => {
    const placedBoard = placePieceOnBoard(board, piece, row, col);
    return clearCompletedLines(placedBoard).cleared > 0;
  });

const getTierWeights = ({ score = 0, comboNumber = 0 }) => {
  const pressure = Math.min(4, Math.floor(score / 900) + Math.floor(comboNumber / 3));

  return {
    easy: Math.max(3, 8 - pressure),
    medium: 3 + Math.min(3, pressure),
    hard: 1 + Math.min(4, Math.floor(pressure / 2))
  };
};

const pickWeightedPiece = (pieces, weights, usedIds = new Set()) => {
  const uniquePieces = pieces.filter((piece) => !usedIds.has(piece.id));
  const pool = uniquePieces.length ? uniquePieces : pieces;
  const totalWeight = pool.reduce((total, piece) => total + (weights[piece.tier] || 1), 0);
  let pick = Math.random() * totalWeight;

  for (const piece of pool) {
    pick -= weights[piece.tier] || 1;

    if (pick <= 0) {
      return piece;
    }
  }

  return pool[0];
};

const generateNextPieces = (board, { score = 0, comboNumber = 0 } = {}) => {
  const eligiblePieces = blockPieces.filter((piece) => getPiecePlacements(board, piece).length > 0);

  if (!eligiblePieces.length) {
    return [];
  }

  const weights = getTierWeights({ score, comboNumber });
  const usedIds = new Set();
  const nextPieces = [];

  if (comboNumber >= 3) {
    const clearingPieces = eligiblePieces.filter((piece) => canPieceClearLine(board, piece));
    const comboSaver = clearingPieces.length ? pickWeightedPiece(clearingPieces, weights, usedIds) : null;

    if (comboSaver) {
      nextPieces.push(comboSaver);
      usedIds.add(comboSaver.id);
    }
  }

  while (nextPieces.length < 3) {
    const nextPiece = pickWeightedPiece(eligiblePieces, weights, usedIds);

    if (!nextPiece) {
      break;
    }

    nextPieces.push(nextPiece);
    usedIds.add(nextPiece.id);
  }

  return nextPieces;
};

const BookGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v11.5H8.2A2.2 2.2 0 0 0 6 20.7V4.5Zm0 0A2.5 2.5 0 0 0 3.5 7v10.5A2.5 2.5 0 0 0 6 20h12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M10.6 5.47A10.94 10.94 0 0 1 12 5.25c6.25 0 9.75 6.75 9.75 6.75a17.55 17.55 0 0 1-4.01 4.98M6.28 6.3C4.1 7.85 2.75 10 2.25 12c0 0 3.5 6.75 9.75 6.75 1.68 0 3.19-.49 4.52-1.23M9.88 9.88A3 3 0 0 0 9 12a3 3 0 0 0 4.24 2.73"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EmailField = ({ id, label, value, onChange, placeholder = 'username' }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <div className="email-shortcut-field">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(getEmailPrefix(event.target.value))}
      />
      <span>@classsync.com</span>
    </div>
  </div>
);

const ClassBlocksGame = ({ player, leaderboard, onRecordScore, onExit }) => {
  const [started, setStarted] = useState(false);
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [pieces, setPieces] = useState(() => generateNextPieces(createEmptyBoard()));
  const [draggedPieceId, setDraggedPieceId] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPreviewMetrics, setDragPreviewMetrics] = useState({ cellSize: 18, gapSize: 4 });
  const [clearingCells, setClearingCells] = useState(() => new Set());
  const [previewLineCells, setPreviewLineCells] = useState(() => new Set());
  const [isClearing, setIsClearing] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [comboNumber, setComboNumber] = useState(0);
  const [placementsSinceClear, setPlacementsSinceClear] = useState(0);
  const [message, setMessage] = useState('Press Start to begin.');
  const [playerName, setPlayerName] = useState(player.name === 'Guest player' ? '' : player.name);
  const [pendingScore, setPendingScore] = useState(null);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const draggedPiece = pieces.find((piece) => piece.id === draggedPieceId);
  const isComboActive = comboNumber >= 3;
  const sortedLeaderboard = sortClassBlocksLeaderboard(leaderboard);
  const playerKey = getClassBlocksPlayerKey(playerName || player.name);
  const playerRecord = sortedLeaderboard.find((entry) => (entry.playerKey || entry.email) === playerKey);
  const playerRank = playerRecord
    ? sortedLeaderboard.findIndex((entry) => (entry.playerKey || entry.email) === playerKey) + 1
    : null;
  const topLeaderboard = sortedLeaderboard.slice(0, 5);

  const resetDraggedPiece = () => {
    setDraggedPieceId(null);
    setDragPosition(null);
    setDragOffset({ x: 0, y: 0 });
    setDragPreviewMetrics({ cellSize: 18, gapSize: 4 });
    setPreviewLineCells(new Set());
  };

  const resetGame = () => {
    const freshBoard = createEmptyBoard();

    setStarted(true);
    setBoard(freshBoard);
    setPieces(generateNextPieces(freshBoard));
    resetDraggedPiece();
    setClearingCells(new Set());
    setPreviewLineCells(new Set());
    setIsClearing(false);
    setIsGameOver(false);
    setScore(0);
    setComboNumber(0);
    setPlacementsSinceClear(0);
    setPendingScore(null);
    setIsScoreSaved(false);
    setMessage('Drag a piece onto the board.');
  };

  const endGame = (gameOverBoard, gameOverPieces, finalScore = score) => {
    setBoard(gameOverBoard);
    setPieces(gameOverPieces);
    setIsGameOver(true);
    setPendingScore(finalScore);
    setIsScoreSaved(false);
    setMessage('Game over! No blocks can fit anymore.');
  };

  const finishPieceTurn = (remainingPieces, cleared, clearedBoard, nextMessage, nextScore, nextComboNumber) => {
    if (remainingPieces.length) {
      if (!canAnyPieceFit(clearedBoard, remainingPieces)) {
        endGame(clearedBoard, remainingPieces, nextScore);
        return;
      }

      setPieces(remainingPieces);
      setMessage(nextMessage || (cleared ? `Line cleared!` : 'Nice drop.'));
      return;
    }

    const nextPieces = generateNextPieces(clearedBoard, {
      score: nextScore,
      comboNumber: nextComboNumber
    });

    if (!nextPieces.length) {
      endGame(clearedBoard, [], nextScore);
      return;
    }

    setPieces(nextPieces);
    setMessage(nextMessage || (cleared ? `Fresh pieces. Cleared ${cleared} line${cleared > 1 ? 's' : ''}!` : 'Fresh pieces!'));
    setBoard(clearedBoard);
  };

  const handlePlacePiece = (piece, row, col) => {
    if (!started) {
      setMessage('Press Start to play.');
      return;
    }

    if (isGameOver) {
      setMessage('Game over. Start a new run.');
      return;
    }

    if (isClearing) {
      setMessage('Wait for the line to clear.');
      return;
    }

    if (!piece) {
      setMessage('Drag a piece onto the board.');
      return;
    }

    if (!canPlacePiece(board, piece, row, col)) {
      resetDraggedPiece();
      setMessage('That piece does not fit there.');
      return;
    }

    const placedBoard = placePieceOnBoard(board, piece, row, col);
    const { board: clearedBoard, cleared, rowsToClear, colsToClear } = clearCompletedLines(placedBoard);
    const remainingPieces = pieces.filter((currentPiece) => currentPiece.id !== piece.id);
    const placementScore = piece.cells.length;
    const clearBaseScore = cleared ? getLineClearBaseScore(cleared) : 0;
    const clearScore = cleared ? clearBaseScore * (comboNumber + 1) : 0;
    const moveScore = placementScore + clearScore;
    const missedClearWindow = !cleared && placementsSinceClear + 1 >= 3;
    const nextComboNumber = cleared ? comboNumber + 1 : missedClearWindow ? 0 : comboNumber;
    const nextPlacementsSinceClear = cleared || missedClearWindow ? 0 : placementsSinceClear + 1;
    const nextScore = score + moveScore;
    const scoringMessage = cleared
      ? `${cleared} line${cleared > 1 ? 's' : ''}! +${moveScore} (${clearBaseScore} x ${comboNumber + 1})`
      : missedClearWindow && comboNumber > 0
      ? `+${placementScore}. Combo reset after 3 moves without a clear.`
      : missedClearWindow
      ? `+${placementScore}. Find a line clear to start a combo.`
      : `+${placementScore}. Clear within ${3 - nextPlacementsSinceClear} move${
          3 - nextPlacementsSinceClear === 1 ? '' : 's'
        } to keep the combo.`;

    setScore(nextScore);
    setComboNumber(nextComboNumber);
    setPlacementsSinceClear(cleared ? 0 : nextPlacementsSinceClear);
    resetDraggedPiece();

    if (!cleared) {
      setBoard(clearedBoard);
      finishPieceTurn(remainingPieces, cleared, clearedBoard, scoringMessage, nextScore, nextComboNumber);
      return;
    }

    const nextClearingCells = new Set();
    rowsToClear.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < GAME_BOARD_SIZE; colIndex += 1) {
        nextClearingCells.add(`${rowIndex}-${colIndex}`);
      }
    });
    colsToClear.forEach((colIndex) => {
      for (let rowIndex = 0; rowIndex < GAME_BOARD_SIZE; rowIndex += 1) {
        nextClearingCells.add(`${rowIndex}-${colIndex}`);
      }
    });

    setBoard(placedBoard);
    setPieces(remainingPieces);
    setClearingCells(nextClearingCells);
    setIsClearing(true);
    setMessage(scoringMessage);

    window.setTimeout(() => {
      setBoard(clearedBoard);
      setClearingCells(new Set());
      setIsClearing(false);
      finishPieceTurn(remainingPieces, cleared, clearedBoard, scoringMessage, nextScore, nextComboNumber);
    }, 520);
  };

  const handlePiecePointerDown = (event, piece) => {
    if (!started || isClearing || isGameOver) {
      setMessage(!started ? 'Press Start to play.' : isGameOver ? 'Game over. Start a new run.' : 'Wait for the line to clear.');
      return;
    }

    event.preventDefault();
    const pieceRect = event.currentTarget.getBoundingClientRect();
    const boardCell = document.querySelector('.classblocks-cell');
    const boardElement = document.querySelector('.classblocks-board');
    const boardStyles = boardElement ? window.getComputedStyle(boardElement) : null;
    const footprint = getPieceFootprint(piece);
    const cellSize = boardCell?.getBoundingClientRect().width || 18;
    const gapSize = Number.parseFloat(boardStyles?.columnGap || boardStyles?.gap || '4') || 4;
    const previewWidth = footprint.width * cellSize + Math.max(0, footprint.width - 1) * gapSize;
    const previewHeight = footprint.height * cellSize + Math.max(0, footprint.height - 1) * gapSize;
    const grabRatioX = pieceRect.width ? (event.clientX - pieceRect.left) / pieceRect.width : 0.5;
    const grabRatioY = pieceRect.height ? (event.clientY - pieceRect.top) / pieceRect.height : 0.5;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraggedPieceId(piece.id);
    setDragPosition({ x: event.clientX, y: event.clientY });
    setDragOffset({
      x: grabRatioX * previewWidth,
      y: grabRatioY * previewHeight
    });
    setDragPreviewMetrics({ cellSize, gapSize });
    setMessage('Drop the piece onto the board.');
  };

  const handlePiecePointerMove = (event) => {
    if (!draggedPieceId) {
      return;
    }

    setDragPosition({ x: event.clientX, y: event.clientY });
    updateLinePreview(event.clientX, event.clientY);
  };

  const getFirstRenderedPieceCell = (piece) => {
    const footprint = getPieceFootprint(piece);

    for (let index = 0; index < footprint.width * footprint.height; index += 1) {
      const x = index % footprint.width;
      const y = Math.floor(index / footprint.width);

      if (piece.cells.some(([cellX, cellY]) => cellX === x && cellY === y)) {
        return { x, y };
      }
    }

    return { x: 0, y: 0 };
  };

  const getDropOriginFromPreview = (piece) => {
    const boardElement = document.querySelector('.classblocks-board');
    const previewFirstBlock = document.querySelector('.classblocks-drag-preview .classblocks-piece-dot');
    const boardCells = Array.from(document.querySelectorAll('.classblocks-cell'));

    if (!piece || !boardElement || !previewFirstBlock || !boardCells.length) {
      return null;
    }

    const boardRect = boardElement.getBoundingClientRect();
    const firstBlockRect = previewFirstBlock.getBoundingClientRect();
    const originX = firstBlockRect.left + firstBlockRect.width / 2;
    const originY = firstBlockRect.top + firstBlockRect.height / 2;

    if (
      originX < boardRect.left ||
      originX > boardRect.right ||
      originY < boardRect.top ||
      originY > boardRect.bottom
    ) {
      return null;
    }

    const closestCell = boardCells.reduce((closest, cell) => {
      const cellRect = cell.getBoundingClientRect();
      const cellCenterX = cellRect.left + cellRect.width / 2;
      const cellCenterY = cellRect.top + cellRect.height / 2;
      const distance = Math.hypot(originX - cellCenterX, originY - cellCenterY);

      if (!closest || distance < closest.distance) {
        return { cell, distance };
      }

      return closest;
    }, null)?.cell;

    if (!closestCell) {
      return null;
    }

    const firstRenderedCell = getFirstRenderedPieceCell(piece);

    return {
      row: Number(closestCell.dataset.row) - firstRenderedCell.y,
      col: Number(closestCell.dataset.col) - firstRenderedCell.x
    };
  };

  const getDropOriginFromCoordinates = (piece, originX, originY) => {
    const boardElement = document.querySelector('.classblocks-board');
    const boardCells = Array.from(document.querySelectorAll('.classblocks-cell'));

    if (!piece || !boardElement || !boardCells.length) {
      return null;
    }

    const boardRect = boardElement.getBoundingClientRect();

    if (
      originX < boardRect.left ||
      originX > boardRect.right ||
      originY < boardRect.top ||
      originY > boardRect.bottom
    ) {
      return null;
    }

    const closestCell = boardCells.reduce((closest, cell) => {
      const cellRect = cell.getBoundingClientRect();
      const cellCenterX = cellRect.left + cellRect.width / 2;
      const cellCenterY = cellRect.top + cellRect.height / 2;
      const distance = Math.hypot(originX - cellCenterX, originY - cellCenterY);

      if (!closest || distance < closest.distance) {
        return { cell, distance };
      }

      return closest;
    }, null)?.cell;

    if (!closestCell) {
      return null;
    }

    const firstRenderedCell = getFirstRenderedPieceCell(piece);

    return {
      row: Number(closestCell.dataset.row) - firstRenderedCell.y,
      col: Number(closestCell.dataset.col) - firstRenderedCell.x
    };
  };

  const updateLinePreview = (pointerX, pointerY) => {
    const piece = draggedPiece || pieces.find((currentPiece) => currentPiece.id === draggedPieceId);

    if (!piece) {
      setPreviewLineCells(new Set());
      return;
    }

    const firstRenderedCell = getFirstRenderedPieceCell(piece);
    const previewOriginX =
      pointerX - dragOffset.x + firstRenderedCell.x * (dragPreviewMetrics.cellSize + dragPreviewMetrics.gapSize) + dragPreviewMetrics.cellSize / 2;
    const previewOriginY =
      pointerY - dragOffset.y + firstRenderedCell.y * (dragPreviewMetrics.cellSize + dragPreviewMetrics.gapSize) + dragPreviewMetrics.cellSize / 2;
    const dropOrigin = getDropOriginFromCoordinates(piece, previewOriginX, previewOriginY);

    if (!dropOrigin || !canPlacePiece(board, piece, dropOrigin.row, dropOrigin.col)) {
      setPreviewLineCells(new Set());
      return;
    }

    const placedBoard = placePieceOnBoard(board, piece, dropOrigin.row, dropOrigin.col);
    const { cleared, rowsToClear, colsToClear } = clearCompletedLines(placedBoard);

    if (!cleared) {
      setPreviewLineCells(new Set());
      return;
    }

    const nextPreviewCells = new Set();
    rowsToClear.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < GAME_BOARD_SIZE; colIndex += 1) {
        nextPreviewCells.add(`${rowIndex}-${colIndex}`);
      }
    });
    colsToClear.forEach((colIndex) => {
      for (let rowIndex = 0; rowIndex < GAME_BOARD_SIZE; rowIndex += 1) {
        nextPreviewCells.add(`${rowIndex}-${colIndex}`);
      }
    });
    setPreviewLineCells(nextPreviewCells);
  };

  const handlePiecePointerUp = () => {
    if (!draggedPiece) {
      return;
    }

    const dropOrigin = getDropOriginFromPreview(draggedPiece);

    if (!dropOrigin) {
      resetDraggedPiece();
      setMessage('Drop it on the board.');
      return;
    }

    handlePlacePiece(draggedPiece, dropOrigin.row, dropOrigin.col);
  };

  const handleSaveScore = (event) => {
    event.preventDefault();
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setMessage('Add your player name to save the score.');
      return;
    }

    onRecordScore({ name: trimmedName, score: pendingScore ?? score });
    setIsScoreSaved(true);
    setShowLeaderboard(true);
    setMessage('Score saved to the leaderboard.');
  };

  return (
    <section
      className={`classblocks-panel ${isGameOver ? 'classblocks-panel-game-over' : ''}`}
      aria-label="ClassBlocks mini game"
    >
      <div className="classblocks-header">
        <div>
          <p className="auth-eyebrow">Unlocked mini game</p>
          <h2>ClassBlocks</h2>
        </div>
        <div className="classblocks-header-actions">
          <div className="classblocks-score-stack">
            <strong>{score}</strong>
            <span className={`classblocks-heart ${isComboActive ? 'classblocks-heart-active' : ''}`}>♥</span>
            <small>x{comboNumber + 1}</small>
          </div>
          <button type="button" className="classblocks-exit-button" onClick={onExit}>
            Back to login
          </button>
        </div>
      </div>
      <p className="classblocks-message">{message}</p>

      <div className="classblocks-board" aria-label="ClassBlocks board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              type="button"
              className={`classblocks-cell ${cell ? 'classblocks-cell-filled' : ''} ${
                clearingCells.has(`${rowIndex}-${colIndex}`) ? 'classblocks-cell-clearing' : ''
              } ${previewLineCells.has(`${rowIndex}-${colIndex}`) ? 'classblocks-cell-line-preview' : ''}`}
              data-row={rowIndex}
              data-col={colIndex}
              style={cell ? { '--block-color': cell } : undefined}
              aria-label={`Board square row ${rowIndex + 1}, column ${colIndex + 1}`}
            />
          ))
        )}
        {!started && (
          <div className="classblocks-start-hint" aria-hidden="true">
            <span>Click Start</span>
            <small>to play</small>
          </div>
        )}
      </div>

      {isGameOver && (
        <div className="classblocks-game-over" role="status" aria-live="polite">
          <span>Game over</span>
          <strong>{score}</strong>
          <small>No blocks can fit. Save your score with your player name.</small>
          <form className="classblocks-save-score" onSubmit={handleSaveScore}>
            <input
              value={playerName}
              onChange={(event) => {
                setPlayerName(event.target.value);
                setIsScoreSaved(false);
              }}
              placeholder="Player name"
              aria-label="Player name"
              maxLength="24"
            />
            <button type="submit" disabled={isScoreSaved}>
              {isScoreSaved ? 'Saved' : 'Save score'}
            </button>
          </form>
        </div>
      )}

      <div className="classblocks-pieces" aria-label="Available block pieces">
        {pieces.map((piece) => {
          const footprint = getPieceFootprint(piece);

          return (
            <button
              key={piece.id}
              type="button"
              className={`classblocks-piece ${draggedPieceId === piece.id ? 'classblocks-piece-active' : ''}`}
              style={{
                '--piece-color': piece.color,
                '--piece-cols': footprint.width,
                '--piece-rows': footprint.height
              }}
              onPointerDown={(event) => handlePiecePointerDown(event, piece)}
              onPointerMove={handlePiecePointerMove}
              onPointerUp={handlePiecePointerUp}
              onPointerCancel={() => {
                resetDraggedPiece();
              }}
              disabled={!started || isClearing || isGameOver}
              aria-label={`Select ${piece.id} piece`}
            >
              {Array.from({ length: footprint.width * footprint.height }).map((_, index) => {
                const x = index % footprint.width;
                const y = Math.floor(index / footprint.width);
                const isFilled = piece.cells.some(([cellX, cellY]) => cellX === x && cellY === y);

                return <span key={index} className={isFilled ? 'classblocks-piece-dot' : 'classblocks-piece-gap'} />;
              })}
            </button>
          );
        })}
      </div>

      {draggedPiece && dragPosition && (
        <div
          className="classblocks-drag-preview"
          style={{
            '--piece-color': draggedPiece.color,
            '--piece-cols': getPieceFootprint(draggedPiece).width,
            '--piece-rows': getPieceFootprint(draggedPiece).height,
            '--drag-cell-size': `${dragPreviewMetrics.cellSize}px`,
            '--drag-gap-size': `${dragPreviewMetrics.gapSize}px`,
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y
          }}
          aria-hidden="true"
        >
          {Array.from({ length: getPieceFootprint(draggedPiece).width * getPieceFootprint(draggedPiece).height }).map(
            (_, index) => {
              const footprint = getPieceFootprint(draggedPiece);
              const x = index % footprint.width;
              const y = Math.floor(index / footprint.width);
              const isFilled = draggedPiece.cells.some(([cellX, cellY]) => cellX === x && cellY === y);

              return <span key={index} className={isFilled ? 'classblocks-piece-dot' : 'classblocks-piece-gap'} />;
            }
          )}
        </div>
      )}

      <button type="button" className="auth-submit-button classblocks-start" onClick={resetGame}>
        {isGameOver ? 'Play again' : started ? 'Restart game' : 'Start game'}
      </button>

      <button
        type="button"
        className="classblocks-leaderboard-toggle"
        onClick={() => setShowLeaderboard((current) => !current)}
      >
        {showLeaderboard ? 'Hide leaderboards' : 'Leaderboards'}
      </button>

      {showLeaderboard && (
        <div className="classblocks-leaderboard" aria-label="ClassBlocks leaderboard">
          <div className="classblocks-leaderboard-head">
            <div>
              <p className="auth-eyebrow">Top 5</p>
              <h3>Leaderboards</h3>
            </div>
            <div className="classblocks-player-rank">
              <span>Your place</span>
              <strong>{playerRank ? `#${playerRank}` : '-'}</strong>
            </div>
          </div>

          <div className="classblocks-player-best">
            <span>{playerName.trim() || player.name}</span>
            <strong>{playerRecord?.highScore || 0}</strong>
            <small>Your high score</small>
          </div>

          {topLeaderboard.length > 0 ? (
            <ol className="classblocks-leaderboard-list">
              {topLeaderboard.map((entry, index) => (
                <li
                  key={entry.playerKey || entry.email}
                  className={(entry.playerKey || entry.email) === playerKey ? 'classblocks-leaderboard-current' : ''}
                >
                  <span>#{index + 1}</span>
                  <strong>{entry.name}</strong>
                  <em>{entry.highScore}</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="classblocks-leaderboard-empty">Finish a game and save your name to write the first score.</p>
          )}
        </div>
      )}
    </section>
  );
};

const LoginPage = ({
  onLogin,
  onRegister,
  onForgotPassword,
  onGetRecoveryQuestion,
  theme,
  onToggleTheme,
  securityQuestions,
  users = []
}) => {
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    securityQuestion: securityQuestions[0] || '',
    securityAnswer: '',
    additionalInfo: {
      bio: '',
      course: '',
      yearLevel: '',
      profileVisibility: 'public'
    }
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
    securityAnswer: '',
    newPassword: ''
  });
  const [feedback, setFeedback] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [poppedBooks, setPoppedBooks] = useState([]);
  const [isGameUnlocked, setIsGameUnlocked] = useState(false);
  const [gamePlayer, setGamePlayer] = useState(() =>
    getClassBlocksPlayer({ mode: 'login', credentials: { email: '' }, registerForm: { email: '', name: '' }, users })
  );
  const [classBlocksLeaderboard, setClassBlocksLeaderboard] = useState(() =>
    normalizeClassBlocksLeaderboard(readClassBlocksLeaderboard())
  );
  const shellRef = useRef(null);
  const cardRef = useRef(null);
  const panelsRef = useRef(null);
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);

  useEffect(() => {
    const shell = shellRef.current;
    const card = cardRef.current;

    if (!shell || !card) {
      return undefined;
    }

    const resetPull = () => {
      shell.style.setProperty('--cursor-pull-x', '0px');
      shell.style.setProperty('--cursor-pull-y', '0px');
    };

    const handlePointerMove = (event) => {
      const cardRect = card.getBoundingClientRect();
      const isInsideCard =
        event.clientX >= cardRect.left &&
        event.clientX <= cardRect.right &&
        event.clientY >= cardRect.top &&
        event.clientY <= cardRect.bottom;

      if (isInsideCard) {
        resetPull();
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const centerX = shellRect.left + shellRect.width / 2;
      const centerY = shellRect.top + shellRect.height / 2;
      const deltaX = (event.clientX - centerX) * 0.06;
      const deltaY = (event.clientY - centerY) * 0.06;

      shell.style.setProperty('--cursor-pull-x', `${deltaX.toFixed(2)}px`);
      shell.style.setProperty('--cursor-pull-y', `${deltaY.toFixed(2)}px`);
    };

    const handlePointerLeave = () => {
      resetPull();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      resetPull();
    };
  }, []);

  useEffect(() => {
    if (isGameUnlocked) {
      return undefined;
    }

    const panels = panelsRef.current;
    const activeForm = mode === 'login' ? loginFormRef.current : registerFormRef.current;

    if (!panels || !activeForm) {
      return undefined;
    }

    const updateHeight = () => {
      panels.style.height = `${activeForm.offsetHeight}px`;
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(activeForm);

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    mode,
    feedback,
    registerForm,
    credentials,
    showForgotPassword,
    showAdditionalInfo,
    forgotPasswordForm,
    recoveryQuestion,
    isGameUnlocked
  ]);

  useEffect(() => {
    let isActive = true;

    const syncLeaderboard = async () => {
      const cloudScores = await readDbValue(CLASSBLOCKS_DB_KEY, readClassBlocksLeaderboard());

      if (!isActive) {
        return;
      }

      const normalizedScores = normalizeClassBlocksLeaderboard(cloudScores);
      setClassBlocksLeaderboard(normalizedScores);
      writeClassBlocksLeaderboard(normalizedScores);
    };

    syncLeaderboard().catch(() => {
      const localScores = normalizeClassBlocksLeaderboard(readClassBlocksLeaderboard());
      setClassBlocksLeaderboard(localScores);
    });

    const unsubscribe = subscribeToDbCollection(CLASSBLOCKS_DB_KEY, () => {
      syncLeaderboard().catch(() => undefined);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const result = onLogin(credentials);
    setFeedback(result.message);
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    const result = onRegister(registerForm);
    setFeedback(result.message);
  };

  const handleFindQuestion = () => {
    const result = onGetRecoveryQuestion(forgotPasswordForm.email);
    setRecoveryQuestion(result.question || '');
    setFeedback(result.message);
  };

  const handleForgotPasswordSubmit = (event) => {
    event?.preventDefault?.();
    const result = onForgotPassword(forgotPasswordForm);
    setFeedback(result.message);

    if (result.success) {
      setShowForgotPassword(false);
      setForgotPasswordForm({
        email: '',
        securityAnswer: '',
        newPassword: ''
      });
      setRecoveryQuestion('');
      setMode('login');
    }
  };

  const handlePopBook = (bookClassName) => {
    setPoppedBooks((current) => {
      if (current.includes(bookClassName)) {
        return current;
      }

      const next = [...current, bookClassName];

      if (next.length >= 5) {
        window.setTimeout(() => {
          setGamePlayer(getClassBlocksPlayer({ mode, credentials, registerForm, users }));
          setIsGameUnlocked(true);
          setFeedback('');
        }, 260);
      }

      return next;
    });
  };

  const handleRecordClassBlocksScore = ({ name, score: finalScore }) => {
    if (!Number.isFinite(finalScore) || finalScore <= 0) {
      return;
    }

    const playerName = name.trim() || 'Guest player';
    const playerKey = getClassBlocksPlayerKey(playerName);

    setClassBlocksLeaderboard((current) => {
      const safeCurrent = normalizeClassBlocksLeaderboard(current);
      const existingRecord = safeCurrent.find((entry) => (entry.playerKey || entry.email) === playerKey);

      if (existingRecord && existingRecord.highScore >= finalScore) {
        return safeCurrent;
      }

      const nextRecord = {
        id: playerKey,
        playerKey,
        name: playerName,
        highScore: finalScore,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const nextLeaderboard = existingRecord
        ? safeCurrent.map((entry) => ((entry.playerKey || entry.email) === playerKey ? nextRecord : entry))
        : [...safeCurrent, nextRecord];

      writeClassBlocksLeaderboard(nextLeaderboard);
      writeDbValue(CLASSBLOCKS_DB_KEY, nextLeaderboard).catch(() => undefined);
      return nextLeaderboard;
    });
  };

  return (
    <div ref={shellRef} className="auth-shell">
      <button type="button" className="auth-theme-toggle auth-theme-toggle-compact" onClick={onToggleTheme}>
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="auth-background">
        <span className="auth-orb auth-orb-one" />
        <span className="auth-orb auth-orb-two" />
        <span className="auth-orb auth-orb-three" />
        {backgroundNotes.slice(0, BACKGROUND_UNLOCK_BOOK_LIMIT).map((note) => (
          <button
            type="button"
            key={note.className}
            className={`auth-note-layer ${note.className} ${
              poppedBooks.includes(note.className) ? 'auth-note-layer-popped' : ''
            }`}
            style={{
              '--note-pull-x': note.x,
              '--note-pull-y': note.y,
              '--note-color': note.color
            }}
            onClick={() => handlePopBook(note.className)}
            aria-label="Pop floating book"
            disabled={poppedBooks.includes(note.className) || isGameUnlocked}
          >
            <span className="auth-note auth-note-desktop">📘</span>
            <span className="auth-note auth-note-mobile">
              <BookGlyph />
            </span>
          </button>
        ))}
      </div>

      <div ref={cardRef} className="auth-card">
        <div className="auth-copy">
          <BrandLogo size="lg" className="auth-brand" />
          <p className="auth-eyebrow">ClassSync access</p>
          <h1>{mode === 'login' ? 'Login to continue' : 'Create your account'}</h1>
          <p>
            Students can upload notes and join discussions. Admin accounts review submissions
            before they become visible to everyone.
          </p>
          <div className="auth-copy-books" aria-label="Hidden ClassBlocks unlock books">
            {cardBooks.map((book) => {
              const bookId = `card-${book.className}`;

              return (
                <button
                  type="button"
                  key={book.className}
                  className={`auth-copy-book ${book.className} ${
                    poppedBooks.includes(bookId) ? 'auth-copy-book-popped' : ''
                  }`}
                  onClick={() => handlePopBook(bookId)}
                  aria-label="Pop card book"
                  disabled={poppedBooks.includes(bookId) || isGameUnlocked}
                >
                  <BookGlyph />
                </button>
              );
            })}
          </div>
        </div>

        <div className={`auth-panel-shell ${isGameUnlocked ? 'auth-panel-shell-game' : ''}`}>
          {isGameUnlocked && (
            <ClassBlocksGame
              player={gamePlayer}
              leaderboard={classBlocksLeaderboard}
              onRecordScore={handleRecordClassBlocksScore}
              onExit={() => {
                setIsGameUnlocked(false);
                setPoppedBooks([]);
              }}
            />
          )}

          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-mode-button ${mode === 'login' ? 'auth-mode-button-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-mode-button ${mode === 'register' ? 'auth-mode-button-active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <div ref={panelsRef} className="auth-panels">
            <form
              ref={loginFormRef}
              className={`auth-form auth-form-panel ${
                mode === 'login' ? 'auth-form-panel-active' : 'auth-form-panel-hidden-left'
              }`}
              onSubmit={handleLoginSubmit}
              aria-hidden={mode !== 'login'}
            >
              <div className="auth-form-body">
                <EmailField
                  id="login-email"
                  label="ClassSync email"
                  value={credentials.email}
                  onChange={(value) => setCredentials((current) => ({ ...current, email: value }))}
                />

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="password-field">
                    <input
                      id="login-password"
                      className={credentials.password ? 'password-input-has-toggle' : ''}
                      type={showLoginPassword ? 'text' : 'password'}
                      value={credentials.password}
                      placeholder="Enter your password"
                      onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    />
                    {credentials.password && (
                      <button
                        type="button"
                        className="password-toggle password-toggle-inline"
                        onClick={() => setShowLoginPassword((current) => !current)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeIcon /> : <EyeClosedIcon />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="auth-form-actions">
                <button type="submit" className="auth-submit-button">Login</button>
              </div>
              <button
                type="button"
                className="auth-inline-link"
                onClick={() => {
                  setShowForgotPassword((current) => !current);
                  setFeedback('');
                }}
              >
                Forgot password?
              </button>

              {showForgotPassword && (
                <div className="auth-recovery-box">
                  <h3>Recover password</h3>
                  <p>Use your ClassSync email and personal answer to set a new password.</p>
                  <div className="auth-recovery-form">
                    <EmailField
                      id="recover-email"
                      label="ClassSync email"
                      value={forgotPasswordForm.email}
                      onChange={(value) => setForgotPasswordForm((current) => ({ ...current, email: value }))}
                    />
                    <button type="button" className="recovery-secondary-button" onClick={handleFindQuestion}>
                      Show my question
                    </button>
                    {recoveryQuestion && (
                      <div className="auth-recovery-question">
                        <strong>{recoveryQuestion}</strong>
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="recover-answer">Answer</label>
                      <input
                        id="recover-answer"
                        value={forgotPasswordForm.securityAnswer}
                        onChange={(event) =>
                          setForgotPasswordForm((current) => ({ ...current, securityAnswer: event.target.value }))
                        }
                        placeholder="Type your answer"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="recover-new-password">New password</label>
                      <input
                        id="recover-new-password"
                        type="password"
                        value={forgotPasswordForm.newPassword}
                        onChange={(event) =>
                          setForgotPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                        placeholder="Create a new password"
                      />
                    </div>
                    <button type="button" className="auth-submit-button" onClick={handleForgotPasswordSubmit}>
                      Reset password
                    </button>
                  </div>
                </div>
              )}

              {feedback && mode === 'login' && <p className="auth-feedback">{feedback}</p>}
            </form>

            <form
              ref={registerFormRef}
              className={`auth-form auth-form-panel ${
                mode === 'register' ? 'auth-form-panel-active' : 'auth-form-panel-hidden-right'
              }`}
              onSubmit={handleRegisterSubmit}
              aria-hidden={mode !== 'register'}
            >
              <div className="auth-form-body">
                <div className="form-group">
                  <label htmlFor="register-name">Full name</label>
                  <input
                    id="register-name"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>

                <EmailField
                  id="register-email"
                  label="ClassSync email"
                  value={registerForm.email}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, email: value }))}
                />

                <div className="form-group">
                  <label htmlFor="register-password">Password</label>
                  <div className="password-field">
                    <input
                      id="register-password"
                      className={registerForm.password ? 'password-input-has-toggle' : ''}
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      placeholder="Create a password"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    {registerForm.password && (
                      <button
                        type="button"
                        className="password-toggle password-toggle-inline"
                        onClick={() => setShowRegisterPassword((current) => !current)}
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? <EyeIcon /> : <EyeClosedIcon />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-security-question">Personal recovery question</label>
                  <select
                    id="register-security-question"
                    value={registerForm.securityQuestion}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, securityQuestion: event.target.value }))
                    }
                  >
                    {securityQuestions.map((question) => (
                      <option key={question} value={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="register-security-answer">Your answer</label>
                  <input
                    id="register-security-answer"
                    value={registerForm.securityAnswer}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, securityAnswer: event.target.value }))
                    }
                    placeholder="Only you should know this answer"
                  />
                </div>

                <button
                  type="button"
                  className="auth-inline-link"
                  onClick={() => setShowAdditionalInfo((current) => !current)}
                >
                  {showAdditionalInfo ? 'Hide additional information' : 'Add optional profile details'}
                </button>

                {showAdditionalInfo && (
                  <div className="auth-extra-grid">
                    <div className="form-group">
                      <label htmlFor="register-course">Course</label>
                      <input
                        id="register-course"
                        value={registerForm.additionalInfo.course}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, course: event.target.value }
                          }))
                        }
                        placeholder="Example: BSIT"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-year-level">Year level</label>
                      <input
                        id="register-year-level"
                        value={registerForm.additionalInfo.yearLevel}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, yearLevel: event.target.value }
                          }))
                        }
                        placeholder="Example: 2nd Year"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-bio">Short bio</label>
                      <textarea
                        id="register-bio"
                        rows="3"
                        value={registerForm.additionalInfo.bio}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, bio: event.target.value }
                          }))
                        }
                        placeholder="Tell classmates a bit about you"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-visibility">Profile visibility</label>
                      <select
                        id="register-visibility"
                        value={registerForm.additionalInfo.profileVisibility}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, profileVisibility: event.target.value }
                          }))
                        }
                      >
                        <option value="public">Public profile</option>
                        <option value="private">Private profile</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="auth-form-actions">
                <button type="submit" className="auth-submit-button">Create account</button>
              </div>
              {feedback && mode === 'register' && <p className="auth-feedback">{feedback}</p>}
            </form>
          </div>

          <div className="demo-credentials">
            <h3>Demo accounts</h3>
            <div className="demo-credential-card">
              <strong>For student</strong>
              <p>Email: student@classsync.com</p>
            </div>
            <div className="recovery-entry-card">
              <strong>Missing old data?</strong>
              <p>Open the recovery scanner on this browser to check if accounts and forum posts are still cached here.</p>
              <Link to="/recovery" className="recovery-entry-link">
                Open recovery scanner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
