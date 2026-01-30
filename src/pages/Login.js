import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import '../styles/login.css';

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
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { username: 'salesrep', role: 'Sales Representative' },
    { username: 'tbm', role: 'Territory Business Manager' },
    { username: 'abm', role: 'Area Business Manager' },
    { username: 'zbm', role: 'Zonal Business Manager' },
    { username: 'saleshead', role: 'Sales Head' }
  ];

  const handleDemoLogin = (demoUsername) => {
    setUsername(demoUsername);
    setPassword('demo123');
  };

  return (
    <div className="login-page">
      {/* Background Pattern */}
      <div className="login-bg-pattern">
        <div className="pattern-circle pattern-1"></div>
        <div className="pattern-circle pattern-2"></div>
        <div className="pattern-circle pattern-3"></div>
      </div>

      {/* Main Container */}
      <div className="login-container">
        {/* Left Panel - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <img src={process.env.PUBLIC_URL + '/appasamy-logo.png'} alt="Appasamy Associates" className="brand-logo-img" />
            </div>
            
            <h1 className="brand-headline">
              Empowering Vision,<br />
              <span>Transforming Lives</span>
            </h1>
            
            <p className="brand-tagline">
              Leading manufacturer of ophthalmic products, committed to excellence 
              in eye care for over four decades.
            </p>
            
            <div className="brand-features">
              <div className="feature-item">
                <i className="fas fa-microscope"></i>
                <span>Advanced Equipment</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-eye-dropper"></i>
                <span>Premium IOLs</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-flask"></i>
                <span>Quality OVDs</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-tools"></i>
                <span>Surgical Instruments</span>
              </div>
            </div>

            <div className="brand-stats">
              <div className="stat-item">
                <span className="stat-value">40+</span>
                <span className="stat-label">Years of Excellence</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">1000+</span>
                <span className="stat-label">Products</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">50+</span>
                <span className="stat-label">Countries</span>
              </div>
            </div>
          </div>
          
          <div className="branding-footer">
            <span>© 2025 Appasamy Associates. All rights reserved.</span>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <div className="form-container">
            <div className="form-header">
              <h2>Product Commitment System</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="username">
                  <i className="fas fa-user"></i>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Section */}
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
                      <span className="demo-username">{cred.username}</span>
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

      {/* PWA Install Banner */}
      <div className="pwa-banner" id="pwaBanner">
        <i className="fas fa-mobile-alt"></i>
        <span>Install this app for offline access</span>
        <button className="pwa-install-btn" id="pwaInstallBtn">Install</button>
        <button className="pwa-dismiss-btn" id="pwaDismissBtn">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default Login;
