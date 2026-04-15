import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="page">
      <h1>ℹ️ About ClassSync</h1>
      
      <section className="about-section">
        <h2>What is ClassSync?</h2>
        <p>A web app where students share and access class notes and reviewers across different courses and subjects.</p>
      </section>

      <section className="about-section">
        <h2>How it works:</h2>
        <ol>
          <li><Link to="/upload">Upload</Link> your notes with title, subject, and content</li>
          <li><Link to="/browse">Browse</Link> all available notes</li>
          <li>Click any note card to view <Link to="/note/1">full details</Link></li>
          <li>Track your contributions on <Link to="/profile">Profile</Link></li>
        </ol>
      </section>

      <section>
        <h2>React Concepts Used:</h2>
        <ul>
          <li><code>useState</code> - Form inputs & filtering</li>
          <li><code>onChange, onSubmit</code> - User interactions</li>
          <li><code>Routes</code> - Multi-page navigation</li>
          <li>Reusable components</li>
        </ul>
      </section>
    </div>
  );
};

export default AboutPage;