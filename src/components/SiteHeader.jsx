export default function SiteHeader({ active = 'home' }) {
  const freeToolsHref = active === 'home' ? '#free-tools' : '/#free-tools';

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1><i className="fas fa-star-and-crescent"></i> Vedic Astro</h1>
            <p>Charts · Dashas · Guidance</p>
          </div>
          <nav className="nav">
            <ul>
              <li><a href="/" className={active === 'home' ? 'active' : ''}><i className="fas fa-home"></i> Home</a></li>
              <li><a href="/login" className={active === 'login' ? 'active' : ''}><i className="fas fa-sign-in-alt"></i> Login</a></li>
              <li><a href={freeToolsHref} className={active === 'tools' ? 'active' : ''}><i className="fas fa-tools"></i> Free Tools</a></li>
              <li><a href="/reports" className={active === 'reports' ? 'active' : ''}><i className="fas fa-file-alt"></i> Reports</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
