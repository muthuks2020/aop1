/**
 * Login.js — Updated with Admin demo credential
 * CHANGE: Added admin entry to demoCredentials array. No other changes.
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

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
      else { setError(result.error); }
    } catch (err) { setError('An error occurred. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ──────────────── ONLY CHANGE: added admin entry ──────────────── */
  const demoCredentials = [
    { username: 'salesrep', role: 'Sales Representative', name: 'Vasanthakumar C' },
    { username: 'tbm', role: 'Territory Business Manager', name: 'Rajesh Kumar' },
    { username: 'abm', role: 'Area Business Manager', name: 'Priya Sharma' },
    { username: 'zbm', role: 'Zonal Business Manager', name: 'Amit Singh' },
    { username: 'saleshead', role: 'Sales Head', name: 'Dr. Srinivasan' },
    { username: 'admin', role: 'System Administrator', name: 'System Admin' },
  ];
  /* ─────────────────────────────────────────────────────────────── */

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
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <img src={process.env.PUBLIC_URL + '/appasamy-logo.png'} alt="Appasamy Associates" className="brand-logo-img" onError={(e) => e.target.style.display='none'} />
            </div>
            <h1 className="brand-headline">Empowering Vision,<br /><span>Transforming Lives</span></h1>
            <p className="brand-tagline">Leading manufacturer of ophthalmic products, committed to excellence in eye care for over four decades.</p>
            <div className="brand-features">
              <div className="feature-item"><i className="fas fa-chart-line"></i><span>Monthly Target Entry</span></div>
              <div className="feature-item"><i className="fas fa-check-circle"></i><span>Approval Workflow</span></div>
              <div className="feature-item"><i className="fas fa-calendar"></i><span>Q/Y Growth Tracking</span></div>
            </div>
          </div>
        </div>
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>
            {error && (<div className="error-alert"><i className="fas fa-exclamation-circle"></i><span>{error}</span></div>)}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" disabled={loading} autoComplete="username" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading} autoComplete="current-password" />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (<><span className="btn-spinner"></span>Signing in...</>) : (<><span>Sign In</span><i className="fas fa-arrow-right"></i></>)}
              </button>
            </form>
            <div className="demo-section">
              <div className="demo-header">
                <span className="demo-divider"></span>
                <span className="demo-text">Demo Accounts</span>
                <span className="demo-divider"></span>
              </div>
              <div className="demo-credentials">
                {demoCredentials.map((cred) => (
                  <button key={cred.username} type="button" className="demo-btn" onClick={() => handleDemoLogin(cred.username)} disabled={loading}>
                    <i className="fas fa-user-circle"></i>
                    <div className="demo-info">
                      <span className="demo-role">{cred.role}</span>
                      <span className="demo-username">{cred.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="demo-note"><i className="fas fa-info-circle"></i>Password for all demo accounts: <code>demo123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
