import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NoteList from '../components/NoteList';
import UserAvatar from '../components/UserAvatar';

const ProfilePage = ({
  notes,
  users,
  currentUser,
  onToggleLike,
  onDelete,
  onEdit,
  onUpdateProfile,
  onPreviewProfilePicture,
  onChangePassword
}) => {
  const { userId } = useParams();
  const isOwnProfile = !userId || userId === currentUser.id;
  const profileUser = useMemo(
    () => users.find((user) => user.id === (userId || currentUser.id)) || currentUser,
    [currentUser, userId, users]
  );
  const visibleNotes = useMemo(() => {
    if (isOwnProfile) {
      return notes;
    }

    return notes.filter((note) => note.uploaderId === profileUser.id && note.status === 'approved');
  }, [isOwnProfile, notes, profileUser.id]);
  const approvedNotes = visibleNotes.filter((note) => note.status === 'approved');
  const pendingNotes = visibleNotes.filter((note) => note.status === 'pending');
  const rejectedNotes = visibleNotes.filter((note) => note.status === 'rejected');
  const isAdmin = profileUser.role === 'admin';
  const isPrivateToViewer = !isOwnProfile && profileUser.profileVisibility === 'private';
  const [profileForm, setProfileForm] = useState({
    name: profileUser.name,
    bio: profileUser.bio,
    course: profileUser.course || '',
    yearLevel: profileUser.yearLevel || '',
    profileVisibility: profileUser.profileVisibility || 'public',
    profilePicture: profileUser.profilePicture || ''
  });
  const [profileFeedback, setProfileFeedback] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState(profileUser.profilePicture || '');
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: profileUser.name,
      bio: profileUser.bio,
      course: profileUser.course || '',
      yearLevel: profileUser.yearLevel || '',
      profileVisibility: profileUser.profileVisibility || 'public',
      profilePicture: profileUser.profilePicture || ''
    });
    setProfileImagePreview(profileUser.profilePicture || '');
  }, [profileUser]);

  const handleProfilePictureChange = (event) => {
    const [selectedFile] = Array.from(event.target.files || []);

    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setProfileForm((currentForm) => ({
        ...currentForm,
        profilePicture: dataUrl
      }));
      setProfileImagePreview(dataUrl);
      if (isOwnProfile) {
        onPreviewProfilePicture(dataUrl);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    const result = onUpdateProfile(profileForm);
    setProfileFeedback(result.message);
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    const result = onChangePassword(passwordForm);
    setPasswordFeedback(result.message);

    if (result.success) {
      setPasswordForm({
        currentPassword: '',
        newPassword: ''
      });
    }
  };

  if (!profileUser) {
    return (
      <div className="page">
        <h1>Profile not found</h1>
        <Link to="/browse" className="inline-link">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{isOwnProfile ? 'Your Profile' : `${profileUser.name}'s Profile`}</h1>

      <div className="profile-hero profile-hero-expanded">
        <div className="profile-hero-main">
          <UserAvatar user={{ ...profileUser, profilePicture: profileImagePreview }} size="xl" />
          <div>
            <h2>{profileUser.name}</h2>
            <p>{isPrivateToViewer ? 'This profile is private, but shared notes remain visible.' : profileUser.bio}</p>
            <div className="profile-role-badge">{profileUser.role}</div>
            {!isOwnProfile && (
              <div className="profile-public-actions">
                <Link to={`/messages?user=${profileUser.id}`} className="card-link-button">Message</Link>
              </div>
            )}
          </div>
        </div>
        <div className="profile-details-panel">
          <p><strong>ClassSync email:</strong> {profileUser.email}</p>
          <p><strong>Course:</strong> {isPrivateToViewer ? 'Private' : profileUser.course || 'Not set yet'}</p>
          <p><strong>Year level:</strong> {isPrivateToViewer ? 'Private' : profileUser.yearLevel || 'Not set yet'}</p>
          <p><strong>Visibility:</strong> {profileUser.profileVisibility}</p>
          <p><strong>Role:</strong> {profileUser.role}</p>
        </div>
      </div>

      <div className="profile-stat-grid">
        <div className="summary-card">
          <h3>Total uploads</h3>
          <p>{visibleNotes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Approved</h3>
          <p>{approvedNotes.length}</p>
        </div>
        {isOwnProfile && (
          <div className="summary-card">
            <h3>Waiting for review</h3>
            <p>{pendingNotes.length}</p>
          </div>
        )}
        {isOwnProfile && !isAdmin && (
          <div className="summary-card">
            <h3>Needs revision</h3>
            <p>{rejectedNotes.length}</p>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <div className="profile-management-grid">
          <section className="profile-edit-panel">
            <h2>Edit profile</h2>
            <form onSubmit={handleProfileSubmit} className="profile-form-grid">
              <div className="profile-picture-editor">
                <UserAvatar user={{ ...profileUser, profilePicture: profileImagePreview }} size="lg" />
                <label className="attachment-picker">
                  <span className="attachment-picker-title">Change profile picture</span>
                  <input type="file" className="attachment-input" accept="image/*" onChange={handleProfilePictureChange} />
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-course">Course</label>
                <input
                  id="profile-course"
                  value={profileForm.course}
                  onChange={(event) => setProfileForm((current) => ({ ...current, course: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-year">Year level</label>
                <input
                  id="profile-year"
                  value={profileForm.yearLevel}
                  onChange={(event) => setProfileForm((current) => ({ ...current, yearLevel: event.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-visibility">Profile visibility</label>
                <select
                  id="profile-visibility"
                  value={profileForm.profileVisibility}
                  onChange={(event) => setProfileForm((current) => ({ ...current, profileVisibility: event.target.value }))}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="form-group profile-form-grid-full">
                <label htmlFor="profile-bio">Bio</label>
                <textarea
                  id="profile-bio"
                  rows="4"
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                />
              </div>
              <div className="profile-form-grid-full">
                <button type="submit">Save profile</button>
              </div>
              <div className="profile-form-grid-full profile-inline-action-row">
                <button
                  type="button"
                  className="profile-secondary-action"
                  onClick={() => setIsPasswordEditorOpen((currentValue) => !currentValue)}
                >
                  {isPasswordEditorOpen ? 'Hide password form' : 'Change password'}
                </button>
              </div>
              {profileFeedback && <p className="auth-feedback profile-form-grid-full">{profileFeedback}</p>}
              {isPasswordEditorOpen && (
                <div className="profile-password-drawer profile-form-grid-full">
                  <div className="profile-password-drawer-header">
                    <h3>Change password</h3>
                    <p>Use your current password first, then set a new one.</p>
                  </div>
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label htmlFor="current-password">Current password</label>
                      <input
                        id="current-password"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-password">New password</label>
                      <input
                        id="new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                      />
                    </div>
                    <div className="profile-form-grid-full">
                      <button type="button" onClick={handlePasswordSubmit}>Update password</button>
                    </div>
                    {passwordFeedback && <p className="auth-feedback profile-form-grid-full">{passwordFeedback}</p>}
                  </div>
                </div>
              )}
            </form>
          </section>
        </div>
      )}

      {isOwnProfile && (
        <>
          <h2>Waiting for review</h2>
          {pendingNotes.length > 0 ? (
            <NoteList
              notes={pendingNotes}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              onDelete={onDelete}
              onEdit={onEdit}
              showStatus
            />
          ) : (
            <div className="profile-empty-state">
              <h3>Nothing is waiting for review</h3>
              <p>Your new uploads will appear here while the admin is checking them.</p>
            </div>
          )}
        </>
      )}

      <h2>{isOwnProfile ? 'Approved uploads' : 'Public uploads'}</h2>
      {approvedNotes.length > 0 ? (
        <NoteList
          notes={approvedNotes}
          currentUser={currentUser}
          onToggleLike={onToggleLike}
          onDelete={onDelete}
          onEdit={onEdit}
          showStatus={isOwnProfile}
        />
      ) : (
        <div className="profile-empty-state">
          <h3>{isOwnProfile ? 'No approved uploads yet' : 'No public uploads yet'}</h3>
          <p>{isOwnProfile ? <Link to="/upload">Upload your first note</Link> : 'This user has not shared any public notes yet.'}</p>
        </div>
      )}

      {isOwnProfile && !isAdmin && (
        <>
          <h2>Needs revision</h2>
          {rejectedNotes.length > 0 ? (
            <>
              <NoteList
                notes={rejectedNotes}
                currentUser={currentUser}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                onEdit={onEdit}
                showStatus
              />
              <div className="profile-rejection-list">
                {rejectedNotes.map((note) => (
                  <div key={`rejection-${note.id}`} className="profile-empty-state profile-revision-card">
                    <h3>{note.title}</h3>
                    <p>{note.rejectionReason || 'The admin requested a few revisions before approval.'}</p>
                    <small>Commented by {note.rejectionByName || 'Admin'}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="profile-empty-state">
              <h3>No revisions needed</h3>
              <p>Your notes have not been sent back for revision. Keep it up.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
