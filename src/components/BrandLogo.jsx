import React from 'react';
import luminoteLogo from '../assets/luminote-logo.svg';

const BrandLogo = ({ size = 'md', showWordmark = true, className = '' }) => (
  <div className={`brand-logo brand-logo-${size} ${className}`.trim()}>
    <img src={luminoteLogo} alt="Luminote logo" className="brand-logo-mark" />
    {showWordmark && (
      <div className="brand-logo-copy">
        <strong>Luminote</strong>
        <span>Study smarter together</span>
      </div>
    )}
  </div>
);

export default BrandLogo;
