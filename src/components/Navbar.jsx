import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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

      <div className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`}>
        <Link to="/" onClick={handleLinkClick}>Home</Link>
        <Link to="/browse" onClick={handleLinkClick}>Browse</Link>
        <Link to="/upload" onClick={handleLinkClick}>Upload</Link>
        <Link to="/profile" onClick={handleLinkClick}>Profile</Link>
        <Link to="/about" onClick={handleLinkClick}>About</Link>
      </div>
    </nav>
  );
};

export default Navbar;
