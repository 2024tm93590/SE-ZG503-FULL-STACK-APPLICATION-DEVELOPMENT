import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import EquipmentManagement from './components/EquipmentManagement';
import BorrowingRequests from './components/BorrowingRequests';
import Analytics from './components/Analytics';
import './global.css';

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getNavItems = () => {
    const items = [];
    
    if (user) {
      items.push({ name: 'Dashboard', path: '/dashboard', icon: '🏠' });
      
      if (user.role === 'admin') {
        items.push(
          { name: 'Equipment', path: '/equipment', icon: '🔧' },
          { name: 'Analytics', path: '/analytics', icon: '📊' }
        );
      }
      
      items.push({ name: 'Requests', path: '/requests', icon: '📋' });
    }
    
    return items;
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Enhanced Navigation Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="logo">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">SchoolLend</span>
            </Link>
            
            {user && (
              <nav className="desktop-nav">
                {getNavItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.name}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="header-right">
            {user ? (
              <>
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                </div>
                
                <button className="logout-btn" onClick={handleLogout}>
                  <span>Logout</span>
                  <span className="logout-icon">🚪</span>
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-btn login-btn">Login</Link>
                <Link to="/signup" className="auth-btn signup-btn">Sign Up</Link>
              </div>
            )}
            
            {user && (
              <button 
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-content">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </Link>
              ))}
              
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <div className="user-avatar large">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                </div>
                
                <button className="mobile-logout-btn" onClick={handleLogout}>
                  <span>Logout</span>
                  <span className="logout-icon">🚪</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content with dynamic background */}
      <main className={`main-content ${!user ? 'no-user' : ''}`}>
        <Routes>
          <Route path="/" element={
            <div className="hero-section">
              <div className="hero-content">
                <h1>Welcome to SchoolLend</h1>
                <p>Your comprehensive equipment lending management platform</p>
                {!user && (
                  <div className="hero-actions">
                    <Link to="/login" className="hero-btn primary">Get Started</Link>
                    <Link to="/signup" className="hero-btn secondary">Create Account</Link>
                  </div>
                )}
              </div>
              {!user && (
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">📚</div>
                    <h3>Equipment Management</h3>
                    <p>Track and manage all school equipment efficiently</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📋</div>
                    <h3>Request System</h3>
                    <p>Streamlined borrowing and approval process</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>Analytics</h3>
                    <p>Comprehensive insights and reporting tools</p>
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['student','staff','admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute roles={['admin']}>
                <EquipmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute roles={['student','staff','admin']}>
                <BorrowingRequests />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
