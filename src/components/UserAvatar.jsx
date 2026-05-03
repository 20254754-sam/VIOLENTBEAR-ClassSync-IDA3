import React from 'react';

const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const source = user?.profilePicture || '';
  const label = user?.name || 'ClassSync user';

  return (
    <img
      src={source}
      alt={`${label} profile`}
      className={`user-avatar user-avatar-${size} ${className}`.trim()}
    />
  );
};

export default UserAvatar;
