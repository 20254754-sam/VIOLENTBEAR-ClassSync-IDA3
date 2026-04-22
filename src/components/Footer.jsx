import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <strong>ClassSync</strong>
          <p>Share notes and study smarter.</p>
        </div>
        <button type="button" className="footer-top-button" onClick={handleBackToTop}>
          Back to top
        </button>
        <div className="app-footer-meta">
          <small>&copy; {currentYear} ClassSync. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
