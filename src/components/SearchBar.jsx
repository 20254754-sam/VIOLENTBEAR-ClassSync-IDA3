import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="search-container">
      <input 
        type="text" 
        placeholder="🔍 Search notes by title, subject..." 
        value={query}
        onChange={handleChange}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;