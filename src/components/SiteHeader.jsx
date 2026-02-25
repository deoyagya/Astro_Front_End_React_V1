import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_MENU_ITEMS = [
  { label: 'Themes',       icon: 'fa-layer-group',     href: '/admin/themes' },
  { label: 'Life Areas',   icon: 'fa-sitemap',         href: '/admin/life-areas' },
  { label: 'Questions',    icon: 'fa-question-circle',  href: '/admin/questions' },
  { label: 'Add Question', icon: 'fa-plus-circle',      href: '/admin/questions/add' },
  { label: 'Reports',      icon: 'fa-file-invoice',     href: '/admin/reports' },
  { label: 'Prompts',      icon: 'fa-robot',            href: '/admin/prompts' },
];

const isItemActive = (itemHref, pathname) => {
  if (pathname === itemHref) return true;
  // /admin/themes also matches /admin/themes/{id}/life-areas (drill-down)
  if (itemHref === '/admin/themes' && pathname.startsWith('/admin/themes/')) return true;
  return false;
};

export default function SiteHeader({ active = 'home' }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const freeToolsHref = active === 'home' ? '#free-tools' : '/#free-tools';

  const isAdmin = user?.role === 'admin';
  const displayName = user?.full_name || user?.email?.split('@')[0] || user?.phone || 'Account';

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const manageMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target)) {
        setManageMenuOpen(false);
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

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1><i className="fas fa-star-and-crescent"></i> Vedic Astro</h1>
            <p>{isAdmin ? 'Admin Panel' : 'Charts · Dashas · Guidance'}</p>
          </div>
          <nav className="nav">
            <ul>
              {isAdmin ? (
                /* ---- Admin: single "Manage Data" with submenu ---- */
                <li className="nav-manage-data" ref={manageMenuRef}>
                  <button
                    className={`nav-manage-trigger ${manageMenuOpen ? 'open' : ''}`}
                    onClick={() => setManageMenuOpen(!manageMenuOpen)}
                  >
                    <i className="fas fa-cogs"></i>
                    <span>Manage Data</span>
                    <i className={`fas fa-caret-${manageMenuOpen ? 'up' : 'down'} nav-chevron`}></i>
                  </button>
                  {manageMenuOpen && (
                    <div className="manage-data-menu">
                      {ADMIN_MENU_ITEMS.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`manage-data-item ${isItemActive(item.href, pathname) ? 'active' : ''}`}
                          onClick={() => setManageMenuOpen(false)}
                        >
                          <i className={`fas ${item.icon}`}></i>
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ) : (
                /* ---- Regular user navigation ---- */
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
                      {!isAdmin && (
                        <>
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
                        </>
                      )}
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
