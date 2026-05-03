import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

const backgroundNotes = [
  { className: 'auth-note-one', x: 0.12, y: 0.2, color: 'rgba(91, 116, 214, 0.62)' },
  { className: 'auth-note-two', x: -0.14, y: 0.1, color: 'rgba(240, 139, 168, 0.6)' },
  { className: 'auth-note-three', x: 0.08, y: -0.12, color: 'rgba(123, 99, 210, 0.58)' },
  { className: 'auth-note-four', x: -0.12, y: -0.08, color: 'rgba(125, 145, 230, 0.62)' },
  { className: 'auth-note-five', x: 0.16, y: 0.06, color: 'rgba(91, 116, 214, 0.58)' },
  { className: 'auth-note-six', x: -0.08, y: 0.15, color: 'rgba(240, 139, 168, 0.56)' },
  { className: 'auth-note-seven', x: 0.1, y: -0.16, color: 'rgba(123, 99, 210, 0.54)' },
  { className: 'auth-note-eight', x: -0.15, y: 0.12, color: 'rgba(125, 145, 230, 0.58)' }
];

const getEmailPrefix = (value) => value.replace(/@classsync\.com$/i, '').replace(/\s+/g, '');

const BookGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v11.5H8.2A2.2 2.2 0 0 0 6 20.7V4.5Zm0 0A2.5 2.5 0 0 0 3.5 7v10.5A2.5 2.5 0 0 0 6 20h12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M10.6 5.47A10.94 10.94 0 0 1 12 5.25c6.25 0 9.75 6.75 9.75 6.75a17.55 17.55 0 0 1-4.01 4.98M6.28 6.3C4.1 7.85 2.75 10 2.25 12c0 0 3.5 6.75 9.75 6.75 1.68 0 3.19-.49 4.52-1.23M9.88 9.88A3 3 0 0 0 9 12a3 3 0 0 0 4.24 2.73"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EmailField = ({ id, label, value, onChange, placeholder = 'username' }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <div className="email-shortcut-field">
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(getEmailPrefix(event.target.value))}
      />
      <span>@classsync.com</span>
    </div>
  </div>
);

const LoginPage = ({
  onLogin,
  onRegister,
  onForgotPassword,
  onGetRecoveryQuestion,
  theme,
  onToggleTheme,
  securityQuestions
}) => {
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    securityQuestion: securityQuestions[0] || '',
    securityAnswer: '',
    additionalInfo: {
      bio: '',
      course: '',
      yearLevel: '',
      profileVisibility: 'public'
    }
  });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
    securityAnswer: '',
    newPassword: ''
  });
  const [feedback, setFeedback] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const shellRef = useRef(null);
  const cardRef = useRef(null);
  const panelsRef = useRef(null);
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);

  useEffect(() => {
    const shell = shellRef.current;
    const card = cardRef.current;

    if (!shell || !card) {
      return undefined;
    }

    const resetPull = () => {
      shell.style.setProperty('--cursor-pull-x', '0px');
      shell.style.setProperty('--cursor-pull-y', '0px');
    };

    const handlePointerMove = (event) => {
      const cardRect = card.getBoundingClientRect();
      const isInsideCard =
        event.clientX >= cardRect.left &&
        event.clientX <= cardRect.right &&
        event.clientY >= cardRect.top &&
        event.clientY <= cardRect.bottom;

      if (isInsideCard) {
        resetPull();
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const centerX = shellRect.left + shellRect.width / 2;
      const centerY = shellRect.top + shellRect.height / 2;
      const deltaX = (event.clientX - centerX) * 0.06;
      const deltaY = (event.clientY - centerY) * 0.06;

      shell.style.setProperty('--cursor-pull-x', `${deltaX.toFixed(2)}px`);
      shell.style.setProperty('--cursor-pull-y', `${deltaY.toFixed(2)}px`);
    };

    const handlePointerLeave = () => {
      resetPull();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      resetPull();
    };
  }, []);

  useEffect(() => {
    const panels = panelsRef.current;
    const activeForm = mode === 'login' ? loginFormRef.current : registerFormRef.current;

    if (!panels || !activeForm) {
      return undefined;
    }

    const updateHeight = () => {
      panels.style.height = `${activeForm.offsetHeight}px`;
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(activeForm);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mode, feedback, registerForm, credentials, showForgotPassword, showAdditionalInfo, forgotPasswordForm, recoveryQuestion]);

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    const result = onLogin(credentials);
    setFeedback(result.message);
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    const result = onRegister(registerForm);
    setFeedback(result.message);
  };

  const handleFindQuestion = () => {
    const result = onGetRecoveryQuestion(forgotPasswordForm.email);
    setRecoveryQuestion(result.question || '');
    setFeedback(result.message);
  };

  const handleForgotPasswordSubmit = (event) => {
    event?.preventDefault?.();
    const result = onForgotPassword(forgotPasswordForm);
    setFeedback(result.message);

    if (result.success) {
      setShowForgotPassword(false);
      setForgotPasswordForm({
        email: '',
        securityAnswer: '',
        newPassword: ''
      });
      setRecoveryQuestion('');
      setMode('login');
    }
  };

  return (
    <div ref={shellRef} className="auth-shell">
      <button type="button" className="auth-theme-toggle auth-theme-toggle-compact" onClick={onToggleTheme}>
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="auth-background" aria-hidden="true">
        <span className="auth-orb auth-orb-one" />
        <span className="auth-orb auth-orb-two" />
        <span className="auth-orb auth-orb-three" />
        {backgroundNotes.map((note) => (
          <span
            key={note.className}
            className={`auth-note-layer ${note.className}`}
            style={{
              '--note-pull-x': note.x,
              '--note-pull-y': note.y,
              '--note-color': note.color
            }}
          >
            <span className="auth-note auth-note-desktop">📘</span>
            <span className="auth-note auth-note-mobile">
              <BookGlyph />
            </span>
          </span>
        ))}
      </div>

      <div ref={cardRef} className="auth-card">
        <div className="auth-copy">
          <BrandLogo size="lg" className="auth-brand" />
          <p className="auth-eyebrow">ClassSync access</p>
          <h1>{mode === 'login' ? 'Login to continue' : 'Create your account'}</h1>
          <p>
            Students can upload notes and join discussions. Admin accounts review submissions
            before they become visible to everyone.
          </p>
          <div className="auth-copy-books" aria-hidden="true">
            <span className="auth-copy-book auth-copy-book-one">
              <BookGlyph />
            </span>
            <span className="auth-copy-book auth-copy-book-two">
              <BookGlyph />
            </span>
            <span className="auth-copy-book auth-copy-book-three">
              <BookGlyph />
            </span>
          </div>
        </div>

        <div className="auth-panel-shell">
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-mode-button ${mode === 'login' ? 'auth-mode-button-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-mode-button ${mode === 'register' ? 'auth-mode-button-active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <div ref={panelsRef} className="auth-panels">
            <form
              ref={loginFormRef}
              className={`auth-form auth-form-panel ${
                mode === 'login' ? 'auth-form-panel-active' : 'auth-form-panel-hidden-left'
              }`}
              onSubmit={handleLoginSubmit}
              aria-hidden={mode !== 'login'}
            >
              <div className="auth-form-body">
                <EmailField
                  id="login-email"
                  label="ClassSync email"
                  value={credentials.email}
                  onChange={(value) => setCredentials((current) => ({ ...current, email: value }))}
                />

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="password-field">
                    <input
                      id="login-password"
                      className={credentials.password ? 'password-input-has-toggle' : ''}
                      type={showLoginPassword ? 'text' : 'password'}
                      value={credentials.password}
                      placeholder="Enter your password"
                      onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    />
                    {credentials.password && (
                      <button
                        type="button"
                        className="password-toggle password-toggle-inline"
                        onClick={() => setShowLoginPassword((current) => !current)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeIcon /> : <EyeClosedIcon />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="auth-form-actions">
                <button type="submit" className="auth-submit-button">Login</button>
              </div>
              <button
                type="button"
                className="auth-inline-link"
                onClick={() => {
                  setShowForgotPassword((current) => !current);
                  setFeedback('');
                }}
              >
                Forgot password?
              </button>

              {showForgotPassword && (
                <div className="auth-recovery-box">
                  <h3>Recover password</h3>
                  <p>Use your ClassSync email and personal answer to set a new password.</p>
                  <div className="auth-recovery-form">
                    <EmailField
                      id="recover-email"
                      label="ClassSync email"
                      value={forgotPasswordForm.email}
                      onChange={(value) => setForgotPasswordForm((current) => ({ ...current, email: value }))}
                    />
                    <button type="button" className="recovery-secondary-button" onClick={handleFindQuestion}>
                      Show my question
                    </button>
                    {recoveryQuestion && (
                      <div className="auth-recovery-question">
                        <strong>{recoveryQuestion}</strong>
                      </div>
                    )}
                    <div className="form-group">
                      <label htmlFor="recover-answer">Answer</label>
                      <input
                        id="recover-answer"
                        value={forgotPasswordForm.securityAnswer}
                        onChange={(event) =>
                          setForgotPasswordForm((current) => ({ ...current, securityAnswer: event.target.value }))
                        }
                        placeholder="Type your answer"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="recover-new-password">New password</label>
                      <input
                        id="recover-new-password"
                        type="password"
                        value={forgotPasswordForm.newPassword}
                        onChange={(event) =>
                          setForgotPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                        placeholder="Create a new password"
                      />
                    </div>
                    <button type="button" className="auth-submit-button" onClick={handleForgotPasswordSubmit}>
                      Reset password
                    </button>
                  </div>
                </div>
              )}

              {feedback && mode === 'login' && <p className="auth-feedback">{feedback}</p>}
            </form>

            <form
              ref={registerFormRef}
              className={`auth-form auth-form-panel ${
                mode === 'register' ? 'auth-form-panel-active' : 'auth-form-panel-hidden-right'
              }`}
              onSubmit={handleRegisterSubmit}
              aria-hidden={mode !== 'register'}
            >
              <div className="auth-form-body">
                <div className="form-group">
                  <label htmlFor="register-name">Full name</label>
                  <input
                    id="register-name"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>

                <EmailField
                  id="register-email"
                  label="ClassSync email"
                  value={registerForm.email}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, email: value }))}
                />

                <div className="form-group">
                  <label htmlFor="register-password">Password</label>
                  <div className="password-field">
                    <input
                      id="register-password"
                      className={registerForm.password ? 'password-input-has-toggle' : ''}
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      placeholder="Create a password"
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    {registerForm.password && (
                      <button
                        type="button"
                        className="password-toggle password-toggle-inline"
                        onClick={() => setShowRegisterPassword((current) => !current)}
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegisterPassword ? <EyeIcon /> : <EyeClosedIcon />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-security-question">Personal recovery question</label>
                  <select
                    id="register-security-question"
                    value={registerForm.securityQuestion}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, securityQuestion: event.target.value }))
                    }
                  >
                    {securityQuestions.map((question) => (
                      <option key={question} value={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="register-security-answer">Your answer</label>
                  <input
                    id="register-security-answer"
                    value={registerForm.securityAnswer}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, securityAnswer: event.target.value }))
                    }
                    placeholder="Only you should know this answer"
                  />
                </div>

                <button
                  type="button"
                  className="auth-inline-link"
                  onClick={() => setShowAdditionalInfo((current) => !current)}
                >
                  {showAdditionalInfo ? 'Hide additional information' : 'Add optional profile details'}
                </button>

                {showAdditionalInfo && (
                  <div className="auth-extra-grid">
                    <div className="form-group">
                      <label htmlFor="register-course">Course</label>
                      <input
                        id="register-course"
                        value={registerForm.additionalInfo.course}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, course: event.target.value }
                          }))
                        }
                        placeholder="Example: BSIT"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-year-level">Year level</label>
                      <input
                        id="register-year-level"
                        value={registerForm.additionalInfo.yearLevel}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, yearLevel: event.target.value }
                          }))
                        }
                        placeholder="Example: 2nd Year"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-bio">Short bio</label>
                      <textarea
                        id="register-bio"
                        rows="3"
                        value={registerForm.additionalInfo.bio}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, bio: event.target.value }
                          }))
                        }
                        placeholder="Tell classmates a bit about you"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="register-visibility">Profile visibility</label>
                      <select
                        id="register-visibility"
                        value={registerForm.additionalInfo.profileVisibility}
                        onChange={(event) =>
                          setRegisterForm((current) => ({
                            ...current,
                            additionalInfo: { ...current.additionalInfo, profileVisibility: event.target.value }
                          }))
                        }
                      >
                        <option value="public">Public profile</option>
                        <option value="private">Private profile</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="auth-form-actions">
                <button type="submit" className="auth-submit-button">Create account</button>
              </div>
              {feedback && mode === 'register' && <p className="auth-feedback">{feedback}</p>}
            </form>
          </div>

          <div className="demo-credentials">
            <h3>Demo accounts</h3>
            <div className="demo-credential-card">
              <strong>For student</strong>
              <p>Email: student@classsync.com</p>
            </div>
            <div className="recovery-entry-card">
              <strong>Missing old data?</strong>
              <p>Open the recovery scanner on this browser to check if accounts and forum posts are still cached here.</p>
              <Link to="/recovery" className="recovery-entry-link">
                Open recovery scanner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
