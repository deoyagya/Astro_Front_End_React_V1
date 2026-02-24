import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SiteHeader({ active = 'home' }) {
  const { isAuthenticated, user, logout } = useAuth();
  const freeToolsHref = active === 'home' ? '#free-tools' : '/#free-tools';

  // User dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    logout();
    window.location.href = '/';
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || user?.phone || 'Account';
  const isAdmin = user?.role === 'admin';
  const isAdminPage = active === 'admin';

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1><i className="fas fa-star-and-crescent"></i> Vedic Astro</h1>
            <p>{isAdminPage ? 'Admin Panel' : 'Charts · Dashas · Guidance'}</p>
          </div>
          <nav className="nav">
            <ul>
              {isAdminPage ? (
                /* ---- Admin navigation ---- */
                <>
                  <li>
                    <a href="/" className="">
                      <i className="fas fa-home"></i> Home
                    </a>
                  </li>
                  <li>
                    <a href="/admin/themes" className={active === 'admin' ? 'active' : ''}>
                      <i className="fas fa-layer-group"></i> Themes
                    </a>
                  </li>
                  <li>
                    <a href="/admin/questions" className="">
                      <i className="fas fa-question-circle"></i> Questions
                    </a>
                  </li>
                  <li>
                    <a href="/admin/questions/add" className="">
                      <i className="fas fa-plus-circle"></i> Add Question
                    </a>
                  </li>
                </>
              ) : (
                /* ---- End-user navigation ---- */
                <>
                  <li>
                    <a href="/" className={active === 'home' ? 'active' : ''}>
                      <i className="fas fa-home"></i> Home
                    </a>
                  </li>
                  <li>
                    <a href={freeToolsHref} className={active === 'tools' ? 'active' : ''}>
                      <i className="fas fa-tools"></i> Free Tools
                    </a>
                  </li>
                  <li>
                    <a href="/reports" className={active === 'reports' ? 'active' : ''}>
                      <i className="fas fa-file-alt"></i> Reports
                    </a>
                  </li>
                </>
              )}
              {isAuthenticated ? (
                <li className="nav-user-dropdown" ref={dropdownRef}>
                  <button
                    className="nav-user-trigger"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                  >
                    <i className="fas fa-user-circle"></i>
                    <span className="nav-user-name">{displayName}</span>
                    <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'} nav-chevron`}></i>
                  </button>
                  {dropdownOpen && (
                    <div className="user-dropdown-menu">
                      <div className="dropdown-user-info">
                        <i className="fas fa-user-circle dropdown-avatar"></i>
                        <div>
                          <div className="dropdown-name">{user?.full_name || 'Vedic Astro User'}</div>
                          <div className="dropdown-email">{user?.email || user?.phone || ''}</div>
                          {isAdmin && <div className="dropdown-role-badge">Admin</div>}
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      {isAdmin && (
                        <>
                          <a href="/admin/themes" className="dropdown-item dropdown-admin-item" onClick={() => setDropdownOpen(false)}>
                            <i className="fas fa-layer-group"></i> Manage Themes
                          </a>
                          <a href="/admin/questions" className="dropdown-item dropdown-admin-item" onClick={() => setDropdownOpen(false)}>
                            <i className="fas fa-question-circle"></i> Manage Questions
                          </a>
                          <div className="dropdown-divider"></div>
                        </>
                      )}
                      <a href="/my-reports" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <i className="fas fa-download"></i> My Reports
                      </a>
                      <a href="/birth-chart" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <i className="fas fa-star"></i> My Astro
                      </a>
                      <a href="/order" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <i className="fas fa-shopping-cart"></i> My Orders
                      </a>
                      <div className="dropdown-divider"></div>
                      <a href="#" className="dropdown-item dropdown-logout" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </a>
                    </div>
                  )}
                </li>
              ) : (
                <li>
                  <a href="/login" className={active === 'login' ? 'active' : ''}>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
