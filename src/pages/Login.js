/**
 * Login.js — v5 Live Backend Auth + SSO Ready
 * Restored original two-panel layout from v4.
 *
 * CHANGES from v4:
 * - login() now calls live API via AuthContext (no more mock)
 * - Added "Sign in with Microsoft" SSO button (hidden when disabled)
 * - Added specialist + admin demo credentials
 * - ★ v5.1: Added initializeMsal() before ssoLoginPopup() to fix
 *   uninitialized_public_client_application error
 * - ★ v5.2: Fixed SSO redirect-to-login bug — removed exchangeTokenWithBackend
 *   double-call, now goes directly to AuthContext.ssoLogin (single backend call)
 *
 * @version 5.2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const SSO_ENABLED = process.env.REACT_APP_SSO_ENABLED === 'true';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, ssoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // ─── Local Login ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }
    try {
      const result = await login(username, password);
      if (result.success) { navigate(from, { replace: true }); }
      else { setError(result.error || 'Login failed'); }
    } catch (err) { setError('An error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  // ─── SSO Login ──────────────────────────────────────────────────────
  // ★ v5.2: Single backend call via AuthContext.ssoLogin (fixed double-call bug)
  //
  // OLD (broken) flow:
  //   ssoLoginPopup → exchangeTokenWithBackend (call #1) → ssoLogin (call #2)
  //   exchangeTokenWithBackend was in mock mode (USE_MOCK defaulted true),
  //   so call #1 returned fake success, call #2 hit real backend and failed.
  //
  // NEW (fixed) flow:
  //   ssoLoginPopup → AuthContext.ssoLogin (single call → setUser → navigate)
  //
  const handleSSOLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { initializeMsal, ssoLoginPopup } =
        await import('../services/ssoAuth');

      // ★ Initialize MSAL before any other call
      await initializeMsal();

      const result = await ssoLoginPopup();
      if (!result.success) {
        setError(result.error || 'SSO login cancelled');
        setLoading(false);
        return;
      }

      // ★ Go directly to AuthContext.ssoLogin — it handles:
      //   1. POST /auth/sso-login to backend
      //   2. Stores token + user in localStorage
      //   3. Calls setUser() so ProtectedRoute sees the user
      const loginResult = await ssoLogin(result.idToken, result.userData);
      if (loginResult.success) {
        navigate(from, { replace: true });
      } else {
        setError(loginResult.error || 'SSO authentication failed');
      }
    } catch (err) {
      console.error('[SSO] Login error:', err);
      setError('SSO login failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ─── Demo Credentials ──────────────────────────────────────────────
  const demoCredentials = [
    { username: 'salesrep', role: 'Sales Representative', name: 'Vasanthakumar C' },
    { username: 'tbm', role: 'Territory Business Manager', name: 'Rajesh Kumar' },
    { username: 'abm', role: 'Area Business Manager', name: 'Priya Sharma' },
    { username: 'zbm', role: 'Zonal Business Manager', name: 'Amit Singh' },
    { username: 'saleshead', role: 'Sales Head', name: 'Dr. Srinivasan' },
    { username: 'specialist', role: 'Specialist', name: 'Dr. Ananya Rao' },
    { username: 'admin', role: 'System Administrator', name: 'System Admin' },
  ];

  const handleDemoLogin = (demoUsername) => {
    setUsername(demoUsername);
    setPassword('demo123');
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern">
        <div className="pattern-circle pattern-1"></div>
        <div className="pattern-circle pattern-2"></div>
        <div className="pattern-circle pattern-3"></div>
      </div>
      <div className="login-container">
        {/* ── Left: Branding Panel ───────────────────────────────── */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <img
                src={process.env.PUBLIC_URL + '/appasamy-logo.png'}
                alt="Appasamy Associates"
                className="brand-logo-img"
                onError={(e) => (e.target.style.display = 'none')}
              />
            </div>
            <h1 className="brand-headline">
              Empowering Vision,<br /><span>Transforming Lives</span>
            </h1>
            <p className="brand-tagline">
              Leading manufacturer of ophthalmic products, committed to
              excellence in eye care for over four decades.
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <i className="fas fa-chart-line"></i>
                <span>Monthly Target Entry</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Approval Workflow</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-calendar"></i>
                <span>Q/Y Growth Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form Panel ──────────────────────────────────── */}
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="error-alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <><span className="btn-spinner"></span>Signing in...</>
                ) : (
                  <><span>Sign In</span><i className="fas fa-arrow-right"></i></>
                )}
              </button>

              {/* SSO Button — shown only when enabled */}
              {SSO_ENABLED && (
                <>
                  <div className="login-divider">
                    <span></span>
                    <span className="login-divider-text">or</span>
                    <span></span>
                  </div>
                  <button
                    type="button"
                    className="login-btn sso-btn"
                    onClick={handleSSOLogin}
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    Sign in with Microsoft
                  </button>
                </>
              )}
            </form>

            {/* Demo Credentials */}
            <div className="demo-section">
              <div className="demo-header">
                <span className="demo-divider"></span>
                <span className="demo-text">Demo Accounts</span>
                <span className="demo-divider"></span>
              </div>
              <div className="demo-credentials">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.username}
                    type="button"
                    className="demo-btn"
                    onClick={() => handleDemoLogin(cred.username)}
                    disabled={loading}
                  >
                    <i className="fas fa-user-circle"></i>
                    <div className="demo-info">
                      <span className="demo-role">{cred.role}</span>
                      <span className="demo-username">{cred.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="demo-note">
                <i className="fas fa-info-circle"></i>
                Password for all demo accounts: <code>demo123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
