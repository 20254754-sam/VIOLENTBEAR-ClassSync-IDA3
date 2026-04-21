import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ currentUser, onLogout, theme, onToggleTheme, pendingCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={handleLinkClick}>
        ClassSync
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`nav-mobile-overlay ${isMenuOpen ? 'nav-mobile-overlay-open' : ''}`}
        onClick={handleLinkClick}
      />

      <div className={`nav-desktop-group ${isMenuOpen ? 'nav-desktop-group-open' : ''}`}>
        <div className="nav-links">
          <Link to="/" onClick={handleLinkClick}>Home</Link>
          <Link to="/browse" onClick={handleLinkClick}>Browse</Link>
          <Link to="/upload" onClick={handleLinkClick}>Upload</Link>
          <Link to="/forum" onClick={handleLinkClick}>Forum</Link>
          <Link to="/profile" onClick={handleLinkClick}>Profile</Link>
          {currentUser.role === 'admin' && (
            <Link to="/admin" onClick={handleLinkClick}>
              Admin
              {pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}
            </Link>
          )}
          <Link to="/about" onClick={handleLinkClick}>About</Link>
        </div>

        <div className="nav-actions">
          <button type="button" className="nav-theme-button" onClick={onToggleTheme}>
            <span className="nav-theme-icon" aria-hidden="true">
              {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span className="nav-theme-label">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
          <div className="nav-user-chip">
            <span>{currentUser.name}</span>
            <small>{currentUser.role}</small>
          </div>
          <button type="button" className="nav-logout-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
