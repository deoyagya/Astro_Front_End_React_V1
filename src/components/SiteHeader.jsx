import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ADMIN_MENU_ITEMS = [
  { label: 'Observability', icon: 'fa-tachometer-alt',  href: '/admin/observability' },
  { label: 'Pipeline Wizard', icon: 'fa-flask',         href: '/admin/pipeline-wizard' },
  { label: 'Themes',       icon: 'fa-layer-group',     href: '/admin/themes' },
  { label: 'Life Areas',   icon: 'fa-sitemap',         href: '/admin/life-areas' },
  { label: 'Questions',    icon: 'fa-question-circle',  href: '/admin/questions' },
  { label: 'Add Question', icon: 'fa-plus-circle',      href: '/admin/questions/add' },
  { label: 'Reports',      icon: 'fa-file-invoice',     href: '/admin/reports' },
  { label: 'Prompts',      icon: 'fa-robot',            href: '/admin/prompts' },
  { label: 'Muhurta',      icon: 'fa-clock',            href: '/admin/muhurta' },
  { label: 'Rule CV Wizard', icon: 'fa-balance-scale',  href: '/admin/rule-cv-wizard' },
  { label: 'Rule Builder',  icon: 'fa-project-diagram', href: '/admin/rule-builder' },
  { label: 'Rule Admin',    icon: 'fa-gavel',           href: `${API_BASE}/admin`, external: true },
  { label: 'DB Admin',      icon: 'fa-database',        href: `${API_BASE}/db-admin`, external: true },
  { label: 'Wizard Content', icon: 'fa-photo-video',    href: '/admin/wizard-content' },
];

const MY_DATA_MENU_ITEMS = [
  { label: 'My Details',       icon: 'fa-id-card',       href: '/my-data/details' },
  { label: 'Avakhada Chakra',  icon: 'fa-dharmachakra',  href: '/my-data/avakhada' },
  { label: 'My Personality',   icon: 'fa-brain',         href: '/my-data/personality' },
  { label: 'Saved Charts',     icon: 'fa-bookmark',      href: '/my-data/saved-charts' },
  { label: 'Birth Details',    icon: 'fa-baby',          href: '/my-data/birth-details' },
  { label: 'Yogas & Rajyogas', icon: 'fa-sun',           href: '/my-data/yogas' },
  { label: 'Sade Sati',        icon: 'fa-moon',          href: '/my-data/sade-sati' },
  { label: 'Transit',          icon: 'fa-globe',         href: '/my-data/transit' },
  { label: 'Temporal Forecast', icon: 'fa-hourglass-half', href: '/my-data/temporal-forecast', premium: true },
  { label: 'Subscription', icon: 'fa-crown', href: '/my-data/subscription' },
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
  const isPremium = user?.role === 'premium' || isAdmin;
  const displayName = user?.full_name || user?.email?.split('@')[0] || user?.phone || 'Account';

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const [myAstroExpanded, setMyAstroExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const manageMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setMyAstroExpanded(false);
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
    window.location.href = '/login';
  };

  const handleMyAstroToggle = (e) => {
    e.preventDefault();
    setMyAstroExpanded(!myAstroExpanded);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1><i className="fas fa-star-and-crescent"></i> Astro Yagya</h1>
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
                          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          <i className={`fas ${item.icon}`}></i>
                          {item.label}
                          {item.external && <i className="fas fa-external-link-alt" style={{ fontSize: '0.65em', marginLeft: 4, opacity: 0.5 }}></i>}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ) : (
                /* ---- Regular user navigation (NO "My Data" — moved to user dropdown) ---- */
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
                    <a href="/muhurta" className={active === 'muhurta' ? 'active' : ''}>
                      <i className="fas fa-clock"></i> Muhurta
                    </a>
                  </li>
                  <li>
                    <a href="/chart-wizard" className={active === 'wizard' ? 'active' : ''}>
                      <i className="fas fa-magic"></i> Chart Wizard
                    </a>
                  </li>
                  <li>
                    <a href="/pricing" className={active === 'pricing' ? 'active' : ''}>
                      <i className="fas fa-crown"></i> Pricing
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
                    onClick={() => { setDropdownOpen(!dropdownOpen); setMyAstroExpanded(false); }}
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
                          <div className="dropdown-name">{user?.full_name || 'Astro Yagya User'}</div>
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

                          {/* My Astro — expandable submenu with all My Data items */}
                          <button
                            className={`dropdown-item dropdown-submenu-trigger ${myAstroExpanded ? 'expanded' : ''}`}
                            onClick={handleMyAstroToggle}
                          >
                            <i className="fas fa-star"></i> My Astro
                            <i className={`fas fa-chevron-${myAstroExpanded ? 'up' : 'down'} submenu-chevron`}></i>
                          </button>
                          {myAstroExpanded && (
                            <div className="dropdown-submenu">
                              {MY_DATA_MENU_ITEMS
                                .filter((item) => !item.premium || isPremium)
                                .map((item) => (
                                  <a
                                    key={item.href}
                                    href={item.href}
                                    className={`dropdown-submenu-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
                                    onClick={() => { setDropdownOpen(false); setMyAstroExpanded(false); }}
                                  >
                                    <i className={`fas ${item.icon}`}></i>
                                    {item.label}
                                  </a>
                                ))}
                            </div>
                          )}

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
