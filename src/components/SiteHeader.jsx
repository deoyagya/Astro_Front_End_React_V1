import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStyles } from '../context/StyleContext';

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
  { label: 'Wizard Content', icon: 'fa-photo-video',    href: '/admin/wizard-content' },
  { label: 'Subscriptions', icon: 'fa-credit-card',     href: '/admin/subscriptions' },
  { label: 'Users',         icon: 'fa-users',           href: '/admin/users' },
  { label: 'Orders',        icon: 'fa-receipt',         href: '/admin/orders' },
  { label: 'Gateway Config', icon: 'fa-globe',          href: '/admin/gateway-config' },
  { label: 'Style Manager', icon: 'fa-palette',         href: '/admin/style-manager' },
  { label: 'Surveys',       icon: 'fa-poll-h',          href: '/admin/surveys' },
];

const MY_DATA_MENU_ITEMS = [
  { label: 'My Details',       icon: 'fa-id-card',       href: '/my-data/details' },
  { label: 'Avakhada Chakra',  icon: 'fa-dharmachakra',  href: '/my-data/avakhada' },
  { label: 'My Personality',   icon: 'fa-brain',         href: '/my-data/personality' },
  { label: 'Birth Details',    icon: 'fa-baby',          href: '/my-data/birth-details' },
  { label: 'Yogas & Rajyogas', icon: 'fa-sun',           href: '/my-data/yogas' },
  { label: 'Sade Sati',        icon: 'fa-moon',          href: '/my-data/sade-sati' },
  { label: 'Transit',          icon: 'fa-globe',         href: '/my-data/transit' },
  { label: 'Threat and Opportunity', icon: 'fa-hourglass-half', href: '/threat-opportunity', premium: true },
  { label: 'Subscription', icon: 'fa-crown', href: '/my-data/subscription' },
];

const isItemActive = (itemHref, pathname) => {
  if (pathname === itemHref) return true;
  // /admin/themes also matches /admin/themes/{id}/life-areas (drill-down)
  if (itemHref === '/admin/themes' && pathname.startsWith('/admin/themes/')) return true;
  return false;
};

export default function SiteHeader({ active = 'home' }) {
  const { getOverride } = useStyles('site-header');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
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
  const [openNavMenu, setOpenNavMenu] = useState(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const manageMenuRef = useRef(null);
  const astroTriggerRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        // Also check if click is inside the fly-out submenu portal
        const flyout = document.getElementById('astro-flyout-submenu');
        if (flyout && flyout.contains(e.target)) return;
        setDropdownOpen(false);
        setMyAstroExpanded(false);
      }
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target)) {
        setManageMenuOpen(false);
      }
      const nav = document.querySelector('.nav');
      if (nav && !nav.contains(e.target)) {
        setOpenNavMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setOpenNavMenu(null);
  }, [pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    logout();
    window.location.href = '/login';
  };

  const handleMyAstroToggle = (e) => {
    e.preventDefault();
    if (!myAstroExpanded && astroTriggerRef.current) {
      const rect = astroTriggerRef.current.getBoundingClientRect();
      setSubmenuPos({
        top: rect.top - 8,
        right: window.innerWidth - rect.left + 6,
      });
    }
    setMyAstroExpanded(!myAstroExpanded);
  };

  const handleProtectedNav = (e, targetPath) => {
    if (isAuthenticated) return;
    e.preventDefault();
    navigate('/login', { state: { from: { pathname: targetPath } } });
  };

  const handleNavMenuToggle = (e, menuKey, targetPath) => {
    if (!isAuthenticated) {
      handleProtectedNav(e, targetPath);
      return;
    }
    e.preventDefault();
    setOpenNavMenu((current) => (current === menuKey ? null : menuKey));
  };

  const handleSubmenuLinkClick = (e, targetPath) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: targetPath } } });
      return;
    }
    setOpenNavMenu(null);
    setDropdownOpen(false);
    setMyAstroExpanded(false);
    navigate(targetPath);
  };

  return (
    <>
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
                /* ---- Admin: all admin surfaces live under one "Manage Data" dropdown ---- */
                <>
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
                </>
              ) : (
                /* ---- Regular user navigation (NO "My Data" — moved to user dropdown) ---- */
                <>
                  <li>
                    <a href="/" className={active === 'home' ? 'active' : ''}>
                      <i className="fas fa-home"></i> Home
                    </a>
                  </li>
                  <li
                    className={openNavMenu === 'tools' ? 'nav-open' : ''}
                    onMouseEnter={() => isAuthenticated && setOpenNavMenu('tools')}
                    onMouseLeave={() => setOpenNavMenu((current) => (current === 'tools' ? null : current))}
                  >
                    <a
                      href={freeToolsHref}
                      className={active === 'tools' ? 'active' : ''}
                      onClick={(e) => handleNavMenuToggle(e, 'tools', '/birth-chart')}
                      aria-haspopup="true"
                      aria-expanded={openNavMenu === 'tools'}
                    >
                      <i className="fas fa-tools"></i> Free Tools
                    </a>
                    <ul className="nav-submenu">
                      <li><a href="/birth-chart" onClick={(e) => handleSubmenuLinkClick(e, '/birth-chart')}><i className="fas fa-chart-pie"></i> Birth Chart (Kundli)</a></li>
                      <li><a href="/dasha" onClick={(e) => handleSubmenuLinkClick(e, '/dasha')}><i className="fas fa-clock"></i> Dasha Calculator</a></li>
                      <li><a href="/compatibility" onClick={(e) => handleSubmenuLinkClick(e, '/compatibility')}><i className="fas fa-heart"></i> Compatibility</a></li>
                      <li><a href="/horoscope" onClick={(e) => handleSubmenuLinkClick(e, '/horoscope')}><i className="fas fa-sun"></i> Daily Horoscope</a></li>
                    </ul>
                  </li>
                  <li
                    className={openNavMenu === 'kundli' ? 'nav-open' : ''}
                    onMouseEnter={() => isAuthenticated && setOpenNavMenu('kundli')}
                    onMouseLeave={() => setOpenNavMenu((current) => (current === 'kundli' ? null : current))}
                  >
                    <a
                      href="#"
                      className={active === 'kundli' ? 'active' : ''}
                      onClick={(e) => handleNavMenuToggle(e, 'kundli', '/birth-chart')}
                      aria-haspopup="true"
                      aria-expanded={openNavMenu === 'kundli'}
                    >
                      <i className="fas fa-scroll"></i> Kundli
                    </a>
                    <ul className="nav-submenu">
                      <li><a href="/birth-chart" onClick={(e) => handleSubmenuLinkClick(e, '/birth-chart')}><i className="fas fa-chart-pie"></i> Free Kundli Generation</a></li>
                      <li><a href="/compatibility" onClick={(e) => handleSubmenuLinkClick(e, '/compatibility')}><i className="fas fa-ring"></i> Kundli Matching</a></li>
                      <li><a href="/muhurta-finder" onClick={(e) => handleSubmenuLinkClick(e, '/muhurta-finder')}><i className="fas fa-clock"></i> Muhurta Finder</a></li>
                      <li><a href="/lal-kitab-kundli" onClick={(e) => handleSubmenuLinkClick(e, '/lal-kitab-kundli')}><i className="fas fa-book-open"></i> Lal Kitab Kundali</a></li>
                      <li><a href="/temporal-forecast" onClick={(e) => handleSubmenuLinkClick(e, '/temporal-forecast')}><i className="fas fa-hourglass-half"></i> Threat and Opportunity</a></li>
                      <li><a href="/sade-sati-report" onClick={(e) => handleSubmenuLinkClick(e, '/sade-sati-report')}><i className="fas fa-moon"></i> Sade Sati Report</a></li>
                      <li><a href="/manglik-dosha" onClick={(e) => handleSubmenuLinkClick(e, '/manglik-dosha')}><i className="fas fa-exclamation-triangle"></i> Manglik Dosha Remedies</a></li>
                      <li><a href="/birth-chart-analysis" onClick={(e) => handleSubmenuLinkClick(e, '/birth-chart-analysis')}><i className="fas fa-file-pdf"></i> Birth Chart Analysis (Premium)</a></li>
                    </ul>
                  </li>
                  <li
                    className={openNavMenu === 'consult' ? 'nav-open' : ''}
                    onMouseEnter={() => isAuthenticated && setOpenNavMenu('consult')}
                    onMouseLeave={() => setOpenNavMenu((current) => (current === 'consult' ? null : current))}
                  >
                    <a
                      href="#"
                      className={active === 'consult' ? 'active' : ''}
                      onClick={(e) => handleNavMenuToggle(e, 'consult', '/chat')}
                      aria-haspopup="true"
                      aria-expanded={openNavMenu === 'consult'}
                    >
                      <i className="fas fa-headset"></i> Consult
                    </a>
                    <ul className="nav-submenu">
                      <li><a href="/chat" onClick={(e) => handleSubmenuLinkClick(e, '/chat')}><i className="fas fa-comments"></i> Live Chat with Astrologer</a></li>
                      <li><a href="/ask-question" onClick={(e) => handleSubmenuLinkClick(e, '/ask-question')}><i className="fas fa-question-circle"></i> Ask a Question</a></li>
                    </ul>
                  </li>
                  <li>
                    <a href="/pricing" className={active === 'pricing' ? 'active' : ''}>
                      <i className="fas fa-crown"></i> Pricing
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

                          {/* My Astro — trigger button */}
                          <button
                            ref={astroTriggerRef}
                            className={`dropdown-item dropdown-submenu-trigger ${myAstroExpanded ? 'expanded' : ''}`}
                            onClick={handleMyAstroToggle}
                          >
                            <i className="fas fa-star"></i> My Astro
                            <i className={`fas fa-chevron-${myAstroExpanded ? 'up' : 'down'} submenu-chevron`}></i>
                          </button>

                          <a href="/my-orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
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

    {/* My Astro fly-out submenu — rendered outside header to avoid overflow clipping */}
    {myAstroExpanded && dropdownOpen && !isAdmin && (
      <div
        id="astro-flyout-submenu"
        className="dropdown-submenu"
        style={{
          position: 'fixed',
          top: submenuPos.top,
          right: submenuPos.right,
          left: 'auto',
          zIndex: 2100,
        }}
      >
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
    </>
  );
}
