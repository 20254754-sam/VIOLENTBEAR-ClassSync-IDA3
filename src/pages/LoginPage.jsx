import React, { useState } from 'react';

const LoginPage = ({ onLogin, onRegister, theme, onToggleTheme }) => {
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({
    email: 'student@classsync.demo',
    password: 'student123'
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [feedback, setFeedback] = useState('');

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

  return (
    <div className="auth-shell">
      <button type="button" className="auth-theme-toggle auth-theme-toggle-compact" onClick={onToggleTheme}>
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="auth-card">
        <div className="auth-copy">
          <p className="auth-eyebrow">ClassSync access</p>
          <h1>{mode === 'login' ? 'Login to continue' : 'Create your account'}</h1>
          <p>
            Students can upload notes and join discussions. Admin accounts review submissions
            before they become visible to everyone.
          </p>
        </div>

        <div>
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

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
              </div>

              <button type="submit">Login</button>
              {feedback && <p className="auth-feedback">{feedback}</p>}
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="register-name">Full name</label>
                <input
                  id="register-name"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                />
              </div>

              <button type="submit">Create account</button>
              {feedback && <p className="auth-feedback">{feedback}</p>}
            </form>
          )}

          <div className="demo-credentials">
            <h3>Demo accounts</h3>
            <div className="demo-credential-card">
              <strong>Student</strong>
              <p>Email: student@classsync.demo</p>
              <p>Password: student123</p>
            </div>
            <div className="demo-credential-card">
              <strong>Admin</strong>
              <p>Email: admin@classsync.demo</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
