import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import UploadPage from './pages/UploadPage';
import NoteDetailsPage from './pages/NoteDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import './App.css';

function App() {
  const [notes, setNotes] = useState([
    { id: 1, title: "React Hooks Guide", subject: "Web Dev", content: "Complete guide to useState, useEffect, and custom hooks...", author: "Alice", date: "2024-01-15" },
    { id: 2, title: "Calculus Review Sheet", subject: "Math", content: "Derivatives, integrals, and limit formulas for exam prep...", author: "Bob", date: "2024-01-14" },
    { id: 3, title: "SQL Queries", subject: "Databases", content: "JOINs, subqueries, and optimization techniques...", author: "Carol", date: "2024-01-13" }
  ]);

  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage notes={notes} />} />
          <Route path="/browse" element={<BrowsePage notes={notes} />} />
          <Route path="/upload" element={<UploadPage notes={notes} setNotes={setNotes} />} />
          <Route path="/note/:id" element={<NoteDetailsPage notes={notes} />} />
          <Route path="/profile" element={<ProfilePage notes={notes} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;