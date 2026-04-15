import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">📚 ClassSync</Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/browse">Browse</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/about">About</Link>
      </div>
    </nav>
  );
};

export default Navbar;