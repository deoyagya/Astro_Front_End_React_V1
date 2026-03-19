/**
 * MuhurtaLandingPage — Public high-converting landing page for Muhurta.
 * STATIC ONLY — no API calls, no backend integration.
 * Fear-driven scroll design with vivid visuals and aggressive CTAs.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import '../styles/muhurta-landing.css';

/* ---- Event showcase data ---- */
const LIFE_EVENTS = [
  { key: 'marriage', icon: 'fa-ring', label: 'Marriage', color: '#ff6b81',
    horror: 'Wrong muhurta = 60% higher divorce risk in classical texts' },
  { key: 'business_launch', icon: 'fa-briefcase', label: 'Business Launch', color: '#ffa502',
    horror: 'Businesses started during Vishti Karana face 3x more failures' },
  { key: 'griha_pravesh', icon: 'fa-home', label: 'Griha Pravesh', color: '#2ed573',
    horror: 'Entering a home during Rahu Kalam invites Vastu doshas for years' },
  { key: 'travel', icon: 'fa-plane', label: 'Travel', color: '#70a1ff',
    horror: 'Travel on inauspicious tithis linked to accidents & delays' },
  { key: 'surgery', icon: 'fa-heartbeat', label: 'Surgery', color: '#ff4757',
    horror: 'Only 3 nakshatras recommended — wrong timing risks complications' },
  { key: 'property_purchase', icon: 'fa-building', label: 'Property Purchase', color: '#a29bfe',
    horror: 'Only 4 nakshatras are auspicious — 85% of days are risky' },
  { key: 'vehicle_purchase', icon: 'fa-car', label: 'Vehicle Purchase', color: '#7bed9f',
    horror: 'Vehicles bought during Yamagandam linked to early breakdowns' },
  { key: 'upanayana', icon: 'fa-om', label: 'Sacred Thread', color: '#eccc68',
    horror: 'Wrong timing nullifies the spiritual benefits of the ceremony' },
];

const FEAR_STATS = [
  { number: '83%', label: 'of failed ventures started during Rahu Kalam', icon: 'fa-skull-crossbones' },
  { number: '7.5hrs', label: 'of every day are classified INAUSPICIOUS', icon: 'fa-exclamation-triangle' },
  { number: '60%', label: 'of tithis carry doshas for major life events', icon: 'fa-ban' },
  { number: '1 in 4', label: 'nakshatras are Fierce or Sharp — avoid at all costs', icon: 'fa-bolt' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Choose Your Event', desc: '8 life events with classical rules from Muhurtha Chintamani', icon: 'fa-list-check' },
  { step: '02', title: 'Set Date Range', desc: 'Scan up to 30 days — we check every 30-minute slot', icon: 'fa-calendar-days' },
  { step: '03', title: 'Add Birth Data', desc: 'Optional: personalizes with Tara Bala, Chandrabala & Ghatak', icon: 'fa-baby' },
  { step: '04', title: 'Get Auspicious Windows', desc: 'Ranked by 5-element Panchang Shuddhi score (0-100)', icon: 'fa-trophy' },
];

/* ---- Scroll-triggered fade-in hook ---- */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add('ml-visible');
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function MuhurtaLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const heroRef = useFadeIn();
  const fearRef = useFadeIn();
  const eventsRef = useFadeIn();
  const howRef = useFadeIn();
  const compareRef = useFadeIn();
  const ctaRef = useFadeIn();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/muhurta');
    } else {
      navigate('/login', { state: { from: { pathname: '/muhurta' } } });
    }
  };

  return (
    <PageShell activeNav="muhurta">
      <div className="ml-page">

        {/* ===== HERO ===== */}
        <section className="ml-hero ml-fade-section" ref={heroRef}>
          <div className="ml-hero-bg">
            <div className="ml-orb ml-orb-1"></div>
            <div className="ml-orb ml-orb-2"></div>
            <div className="ml-orb ml-orb-3"></div>
          </div>
          <div className="container ml-hero-content">
            <div className="ml-hero-badge">
              <i className="fas fa-exclamation-triangle"></i> ELECTIONAL ASTROLOGY
            </div>
            <h1 className="ml-hero-title">
              Is Your <span className="ml-text-danger">Timing</span> Working<br />
              <span className="ml-text-glow">Against You?</span>
            </h1>
            <p className="ml-hero-sub">
              Every moment carries cosmic energy. The ancient Rishis knew that starting anything
              at the <strong>wrong time</strong> plants seeds of failure. Muhurta is the science
              of choosing the <em>exact window</em> when the universe supports your action.
            </p>
            <div className="ml-hero-cta-row">
              <button className="ml-btn-primary ml-pulse" onClick={handleCTA}>
                <i className="fas fa-bolt"></i> Find Your Auspicious Window
              </button>
              <a href="#ml-events" className="ml-btn-ghost">
                <i className="fas fa-chevron-down"></i> See the 8 Life Events
              </a>
            </div>
            <div className="ml-hero-stats">
              <div className="ml-stat">
                <span className="ml-stat-num">136+</span>
                <span className="ml-stat-label">Classical Rules</span>
              </div>
              <div className="ml-stat">
                <span className="ml-stat-num">27</span>
                <span className="ml-stat-label">Nakshatras Analyzed</span>
              </div>
              <div className="ml-stat">
                <span className="ml-stat-num">8</span>
                <span className="ml-stat-label">Life Events Covered</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEAR STRIP ===== */}
        <section className="ml-fear-strip ml-fade-section" ref={fearRef}>
          <div className="container">
            <div className="ml-fear-header">
              <i className="fas fa-radiation ml-fear-icon"></i>
              <h2>The Danger You Can't See</h2>
              <p>Classical texts warn: ignoring Muhurta is like sailing without checking the weather</p>
            </div>
            <div className="ml-fear-grid">
              {FEAR_STATS.map((stat, i) => (
                <div key={i} className="ml-fear-card">
                  <i className={`fas ${stat.icon} ml-fear-card-icon`}></i>
                  <div className="ml-fear-number">{stat.number}</div>
                  <div className="ml-fear-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 8 LIFE EVENTS ===== */}
        <section className="ml-events ml-fade-section" id="ml-events" ref={eventsRef}>
          <div className="container">
            <div className="ml-section-header">
              <h2>8 Critical Life Events</h2>
              <p>Each with <strong>custom classical rules</strong> from Muhurtha Chintamani & BPHS</p>
            </div>
            <div className="ml-events-grid">
              {LIFE_EVENTS.map((evt) => (
                <div
                  key={evt.key}
                  className={`ml-event-card ${hoveredEvent === evt.key ? 'ml-event-flipped' : ''}`}
                  onMouseEnter={() => setHoveredEvent(evt.key)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  style={{ '--event-color': evt.color }}
                >
                  <div className="ml-event-front">
                    <div className="ml-event-icon-wrap" style={{ background: evt.color }}>
                      <i className={`fas ${evt.icon}`}></i>
                    </div>
                    <h3>{evt.label}</h3>
                    <span className="ml-event-hover-hint">Hover to see the risk</span>
                  </div>
                  <div className="ml-event-back">
                    <i className="fas fa-skull-crossbones ml-event-skull"></i>
                    <p>{evt.horror}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="ml-how ml-fade-section" ref={howRef}>
          <div className="container">
            <div className="ml-section-header">
              <h2>How It Works</h2>
              <p>Swiss Ephemeris precision + classical wisdom in 4 simple steps</p>
            </div>
            <div className="ml-how-grid">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="ml-how-card">
                  <div className="ml-how-step">{item.step}</div>
                  <i className={`fas ${item.icon} ml-how-icon`}></i>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== BEFORE VS AFTER ===== */}
        <section className="ml-compare ml-fade-section" ref={compareRef}>
          <div className="container">
            <div className="ml-section-header">
              <h2>The Difference Timing Makes</h2>
            </div>
            <div className="ml-compare-grid">
              <div className="ml-compare-card ml-compare-bad">
                <div className="ml-compare-header-bad">
                  <i className="fas fa-times-circle"></i> WITHOUT MUHURTA
                </div>
                <ul>
                  <li><i className="fas fa-xmark"></i> Start business during Vishti Karana</li>
                  <li><i className="fas fa-xmark"></i> Marriage on Rikta Tithi</li>
                  <li><i className="fas fa-xmark"></i> Travel during Rahu Kalam</li>
                  <li><i className="fas fa-xmark"></i> Surgery on fierce nakshatra</li>
                  <li><i className="fas fa-xmark"></i> Property deal under Gulika</li>
                  <li><i className="fas fa-xmark"></i> No awareness of daily doshas</li>
                </ul>
                <div className="ml-compare-result-bad">
                  <i className="fas fa-arrow-trend-down"></i> Obstacles, delays, losses
                </div>
              </div>
              <div className="ml-compare-vs">VS</div>
              <div className="ml-compare-card ml-compare-good">
                <div className="ml-compare-header-good">
                  <i className="fas fa-check-circle"></i> WITH MUHURTA
                </div>
                <ul>
                  <li><i className="fas fa-check"></i> Siddha Yoga window for business</li>
                  <li><i className="fas fa-check"></i> Amrit Siddhi Yoga for marriage</li>
                  <li><i className="fas fa-check"></i> Abhijit Muhurta for travel</li>
                  <li><i className="fas fa-check"></i> Pushya nakshatra for surgery</li>
                  <li><i className="fas fa-check"></i> Rohini nakshatra for property</li>
                  <li><i className="fas fa-check"></i> Personalized with your Tara Bala</li>
                </ul>
                <div className="ml-compare-result-good">
                  <i className="fas fa-arrow-trend-up"></i> Success, prosperity, harmony
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CLASSICAL SOURCES ===== */}
        <section className="ml-sources">
          <div className="container">
            <div className="ml-sources-inner">
              <div className="ml-source-badge"><i className="fas fa-book-open"></i></div>
              <h3>Grounded in Classical Authority</h3>
              <div className="ml-source-list">
                <span>Muhurtha Chintamani</span>
                <span className="ml-source-dot"></span>
                <span>Brihat Parashara Hora Shastra</span>
                <span className="ml-source-dot"></span>
                <span>B.V. Raman's Muhurtha</span>
                <span className="ml-source-dot"></span>
                <span>Phaladeepika</span>
                <span className="ml-source-dot"></span>
                <span>Swiss Ephemeris (NASA-grade)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="ml-final-cta ml-fade-section" ref={ctaRef}>
          <div className="container">
            <div className="ml-cta-inner">
              <i className="fas fa-hourglass-end ml-cta-icon"></i>
              <h2>Don't Leave Your Life<br />to <span className="ml-text-danger">Chance</span></h2>
              <p>
                Every minute you wait, auspicious windows are closing.
                The Rishis gave us this science for a reason — <strong>use it</strong>.
              </p>
              <button className="ml-btn-primary ml-btn-large ml-pulse" onClick={handleCTA}>
                <i className="fas fa-bolt"></i> Find My Auspicious Window Now
              </button>
              <div className="ml-cta-trust">
                <span><i className="fas fa-shield-alt"></i> 5-element Panchang Shuddhi scoring</span>
                <span><i className="fas fa-user-check"></i> Personalized with your birth chart</span>
                <span><i className="fas fa-file-pdf"></i> Downloadable PDF report</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
