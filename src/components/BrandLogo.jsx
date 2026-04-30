import React from 'react';
import classSyncLogo from '../assets/classsync-logo.svg';

const BrandLogo = ({ size = 'md', showWordmark = true, className = '' }) => (
  <div className={`brand-logo brand-logo-${size} ${className}`.trim()}>
    <img src={classSyncLogo} alt="ClassSync logo" className="brand-logo-mark" />
    {showWordmark && (
      <div className="brand-logo-copy">
        <strong>ClassSync</strong>
        <span>Study smarter together</span>
      </div>
    )}
  </div>
);

export default BrandLogo;
