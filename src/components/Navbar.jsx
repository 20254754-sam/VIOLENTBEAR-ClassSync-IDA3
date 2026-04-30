import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Navbar = ({ currentUser, onLogout, theme, onToggleTheme, pendingCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('nav-scroll-locked', isMenuOpen);
    document.body.classList.toggle('nav-menu-open', isMenuOpen);
    document.documentElement.classList.toggle('nav-scroll-locked', isMenuOpen);

    return () => {
      document.body.classList.remove('nav-scroll-locked');
      document.body.classList.remove('nav-menu-open');
      document.documentElement.classList.remove('nav-scroll-locked');
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      if (menuRef.current?.contains(target) || toggleRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" onClick={handleLinkClick}>
        <BrandLogo size="sm" />
      </Link>

      <button
        ref={toggleRef}
        type="button"
        className={`nav-toggle ${isMenuOpen ? 'nav-toggle-open' : ''}`}
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

      <div
        ref={menuRef}
        className={`nav-desktop-group ${isMenuOpen ? 'nav-desktop-group-open' : ''}`}
      >
        <div className="nav-links">
          <Link to="/" onClick={handleLinkClick}>Home</Link>
          <Link to="/browse" onClick={handleLinkClick}>Browse</Link>
          <Link to="/rooms" onClick={handleLinkClick}>Rooms</Link>
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
