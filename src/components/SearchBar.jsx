import React, { useState } from 'react';

const SearchBar = ({ onSearch, value, onClear, sticky = false, placeholder = 'Search notes or users by title, subject, keyword, or name' }) => {
  const [internalQuery, setInternalQuery] = useState('');
  const query = value ?? internalQuery;

  const handleChange = (event) => {
    const nextValue = event.target.value;

    if (value === undefined) {
      setInternalQuery(nextValue);
    }

    onSearch(nextValue);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalQuery('');
    }

    onClear?.();
    onSearch('');
  };

  return (
    <div className={`search-container ${sticky ? 'search-container-sticky' : ''}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="search-input"
      />
      {query && (
        <button type="button" className="search-clear-button" onClick={handleClear} aria-label="Clear search">
          x
        </button>
      )}
    </div>
  );
};

export default SearchBar;
