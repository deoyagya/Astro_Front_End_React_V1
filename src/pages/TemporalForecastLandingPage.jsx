/**
 * TemporalForecastLandingPage — Public high-converting landing page for Temporal Forecast.
 * STATIC ONLY — no API calls, no backend integration.
 * Threat/Opportunity fear-driven scroll design with split red/green visuals.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../context/AuthContext';
import '../styles/temporal-landing.css';

/* ---- 13 Life Areas ---- */
const LIFE_AREAS = [
  { id: 'health', icon: 'fa-heartbeat', label: 'Health & Vitality', color: '#ff4757',
    threat: 'Saturn transit to 6th/8th house — chronic ailments', opportunity: 'Jupiter aspect on Lagna — peak vitality period' },
  { id: 'education', icon: 'fa-graduation-cap', label: 'Education', color: '#70a1ff',
    threat: 'Mercury retrograde in 4th — exam failures', opportunity: 'Jupiter in 5th — academic breakthroughs' },
  { id: 'finance', icon: 'fa-coins', label: 'Finance & Wealth', color: '#ffa502',
    threat: 'Rahu in 2nd house transit — unexpected losses', opportunity: 'Jupiter-Venus conjunction — wealth accumulation' },
  { id: 'spiritual', icon: 'fa-om', label: 'Spiritual Growth', color: '#a29bfe',
    threat: 'Ketu affliction — spiritual confusion', opportunity: 'Jupiter in 12th — moksha yoga activation' },
  { id: 'family', icon: 'fa-people-roof', label: 'Family & Home', color: '#2ed573',
    threat: 'Mars in 4th — domestic conflicts', opportunity: 'Venus in 4th — harmony and comfort' },
  { id: 'children', icon: 'fa-baby-carriage', label: 'Children', color: '#eccc68',
    threat: 'Saturn aspect on 5th — delays in progeny', opportunity: 'Jupiter in 5th — conception window' },
  { id: 'legal', icon: 'fa-gavel', label: 'Legal Matters', color: '#ff6348',
    threat: 'Rahu-Saturn conjunction — litigation traps', opportunity: 'Jupiter aspect on 6th — victory in disputes' },
  { id: 'property', icon: 'fa-building', label: 'Property & Assets', color: '#7bed9f',
    threat: 'Mars affliction to 4th — property disputes', opportunity: 'Venus-Jupiter aspect on 4th — real estate gains' },
  { id: 'travel', icon: 'fa-plane-departure', label: 'Travel & Relocation', color: '#1e90ff',
    threat: '12th house affliction — travel mishaps', opportunity: 'Jupiter transit 9th — auspicious long journeys' },
  { id: 'career', icon: 'fa-briefcase', label: 'Career & Profession', color: '#e84393',
    threat: 'Saturn transit 10th — career stagnation, demotions', opportunity: 'Jupiter transit 10th — promotions, recognition' },
  { id: 'marriage', icon: 'fa-ring', label: 'Love & Marriage', color: '#ff6b81',
    threat: 'Rahu in 7th — relationship deception', opportunity: 'Venus in 7th — marriage prospects peak' },
  { id: 'compatibility', icon: 'fa-heart', label: 'Compatibility', color: '#fd79a8',
    threat: 'Double transit affliction — partnership breakdown', opportunity: 'Harmonious dasha alignment — deepening bonds' },
  { id: 'general', icon: 'fa-compass', label: 'General Fortune', color: '#9d7bff',
    threat: 'Sade Sati peak — overall life turbulence', opportunity: 'Double transit on 11th — gains from all directions' },
];

const THREAT_WARNINGS = [
  { planet: 'Saturn', icon: 'fa-moon', color: '#8395a7',
    text: 'Sade Sati affects you for 7.5 YEARS — do you even know if you\'re in it?', detail: 'Saturn\'s transit over your Moon sign crushes mental peace, finances, and relationships.' },
  { planet: 'Rahu', icon: 'fa-dragon', color: '#576574',
    text: 'Rahu transit lasts 18 MONTHS per sign — one wrong move amplifies for years', detail: 'Obsession, deception, and sudden reversals — Rahu magnifies whatever house it touches.' },
  { planet: 'Mars', icon: 'fa-fire', color: '#ee5a24',
    text: 'Mars transit triggers accidents, conflicts, and surgeries in 45-day bursts', detail: 'When Mars hits your 8th or 12th house, injuries and enemies become active threats.' },
];

const PIPELINE_STEPS = [
  { label: 'Precision Timing', desc: 'High-accuracy planetary timing across future windows', icon: 'fa-satellite', color: '#70a1ff' },
  { label: '136 Classical Rules', desc: 'Evaluated per life area from BPHS & Phaladeepika', icon: 'fa-book-open', color: '#ffa502' },
  { label: 'Window Classifier', desc: '6-step algorithm: Opportunity / Threat / Mixed', icon: 'fa-filter', color: '#2ed573' },
  { label: 'AI Cross-Validation', desc: 'Dual-LLM review: Producer generates, Reviewer audits', icon: 'fa-brain', color: '#e84393' },
  { label: 'Evidence Trail', desc: 'Every claim traced to chart data — no hallucinations', icon: 'fa-link', color: '#9d7bff' },
];

/* ---- Scroll-triggered fade-in hook ---- */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add('tl-visible');
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function TemporalForecastLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [flippedArea, setFlippedArea] = useState(null);
  const [expandedThreat, setExpandedThreat] = useState(null);

  const heroRef = useFadeIn();
  const threatRef = useFadeIn();
  const areasRef = useFadeIn();
  const pipelineRef = useFadeIn();
  const sadeRef = useFadeIn();
  const contrastRef = useFadeIn();
  const ctaRef = useFadeIn();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/threat-opportunity');
    } else {
      navigate('/login', { state: { from: { pathname: '/threat-opportunity' } } });
    }
  };

  return (
    <PageShell activeNav="kundli">
      <div className="tl-page">

        {/* ===== HERO — Split gradient ===== */}
        <section className="tl-hero tl-fade-section" ref={heroRef}>
          <div className="tl-hero-bg">
            <div className="tl-split-left"></div>
            <div className="tl-split-right"></div>
            <div className="tl-hero-overlay"></div>
          </div>
          <div className="container tl-hero-content">
            <div className="tl-hero-badge-row">
              <span className="tl-badge-threat"><i className="fas fa-shield-virus"></i> THREAT</span>
              <span className="tl-badge-divider">&</span>
              <span className="tl-badge-opportunity"><i className="fas fa-chart-line"></i> OPPORTUNITY</span>
            </div>
            <h1 className="tl-hero-title">
              The Next 12 Months Will<br />
              <span className="tl-text-split">
                <span className="tl-text-threat">Break</span>
                <span className="tl-text-or"> or </span>
                <span className="tl-text-opportunity">Make</span>
              </span> You
            </h1>
            <p className="tl-hero-sub">
              Every planet is moving. Right now, <strong>Saturn, Jupiter, and Rahu</strong> are
              creating windows of <span className="tl-inline-threat">danger</span> and
              <span className="tl-inline-opportunity"> opportunity</span> in your chart.
              The question is — do you know which ones?
            </p>
            <div className="tl-hero-cta-row">
              <button className="tl-btn-primary tl-pulse" onClick={handleCTA}>
                <i className="fas fa-bolt"></i> Reveal My Windows
              </button>
              <a href="#tl-areas" className="tl-btn-ghost">
                <i className="fas fa-chevron-down"></i> 13 Life Areas
              </a>
            </div>
            <div className="tl-hero-stats">
              <div className="tl-stat">
                <span className="tl-stat-num tl-text-threat">13</span>
                <span className="tl-stat-label">Life Areas Scanned</span>
              </div>
              <div className="tl-stat">
                <span className="tl-stat-num" style={{ color: '#ffa502' }}>136</span>
                <span className="tl-stat-label">Classical Rules</span>
              </div>
              <div className="tl-stat">
                <span className="tl-stat-num tl-text-opportunity">2</span>
                <span className="tl-stat-label">AI Models Cross-Validate</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== THREAT ALERTS ===== */}
        <section className="tl-threats tl-fade-section" ref={threatRef}>
          <div className="container">
            <div className="tl-section-header">
              <h2><i className="fas fa-radiation"></i> Active Planetary Threats</h2>
              <p>These slow-moving planets create <strong>years-long</strong> windows of risk</p>
            </div>
            <div className="tl-threat-grid">
              {THREAT_WARNINGS.map((tw, i) => (
                <div
                  key={i}
                  className={`tl-threat-card ${expandedThreat === i ? 'tl-threat-expanded' : ''}`}
                  onClick={() => setExpandedThreat(expandedThreat === i ? null : i)}
                >
                  <div className="tl-threat-planet-icon" style={{ background: tw.color }}>
                    <i className={`fas ${tw.icon}`}></i>
                  </div>
                  <div className="tl-threat-body">
                    <div className="tl-threat-planet-name">{tw.planet}</div>
                    <p className="tl-threat-text">{tw.text}</p>
                    {expandedThreat === i && (
                      <p className="tl-threat-detail">{tw.detail}</p>
                    )}
                    <span className="tl-threat-expand-hint">
                      {expandedThreat === i ? 'Collapse' : 'Click to learn more'}
                    </span>
                  </div>
                  <div className="tl-threat-danger-badge">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 13 LIFE AREAS — Flip cards ===== */}
        <section className="tl-areas tl-fade-section" id="tl-areas" ref={areasRef}>
          <div className="container">
            <div className="tl-section-header">
              <h2>13 Life Areas — Threat & Opportunity</h2>
              <p>Every area of your life has a <strong>cosmic window</strong> opening or closing right now</p>
            </div>
            <div className="tl-areas-grid">
              {LIFE_AREAS.map((area) => (
                <div
                  key={area.id}
                  className={`tl-area-card ${flippedArea === area.id ? 'tl-area-flipped' : ''}`}
                  onClick={() => setFlippedArea(flippedArea === area.id ? null : area.id)}
                  style={{ '--area-color': area.color }}
                >
                  <div className="tl-area-front">
                    <div className="tl-area-icon" style={{ color: area.color }}>
                      <i className={`fas ${area.icon}`}></i>
                    </div>
                    <h3>{area.label}</h3>
                    <div className="tl-area-flip-hint">
                      <span className="tl-mini-threat"><i className="fas fa-arrow-down"></i> Threat</span>
                      <span className="tl-mini-opp"><i className="fas fa-arrow-up"></i> Opportunity</span>
                    </div>
                  </div>
                  <div className="tl-area-back">
                    <div className="tl-area-back-threat">
                      <i className="fas fa-skull"></i>
                      <p>{area.threat}</p>
                    </div>
                    <div className="tl-area-back-divider"></div>
                    <div className="tl-area-back-opp">
                      <i className="fas fa-sun"></i>
                      <p>{area.opportunity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== THE SCIENCE — Pipeline ===== */}
        <section className="tl-pipeline tl-fade-section" ref={pipelineRef}>
          <div className="container">
            <div className="tl-section-header">
              <h2>The Science Behind It</h2>
              <p>Not guesswork. A <strong>5-stage computational pipeline</strong> with AI verification.</p>
            </div>
            <div className="tl-pipeline-steps">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={i} className="tl-pipeline-step">
                  <div className="tl-pipeline-icon" style={{ background: step.color }}>
                    <i className={`fas ${step.icon}`}></i>
                  </div>
                  <div className="tl-pipeline-body">
                    <h4>{step.label}</h4>
                    <p>{step.desc}</p>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="tl-pipeline-arrow">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SADE SATI WARNING ===== */}
        <section className="tl-sade-sati tl-fade-section" ref={sadeRef}>
          <div className="container">
            <div className="tl-sade-inner">
              <div className="tl-sade-icon">
                <i className="fas fa-moon"></i>
                <div className="tl-sade-ring"></div>
                <div className="tl-sade-ring tl-sade-ring-2"></div>
              </div>
              <h2>Are You in <span className="tl-text-threat">Sade Sati</span>?</h2>
              <p className="tl-sade-sub">
                Saturn's 7.5-year transit over your Moon sign is the most feared period in Vedic astrology.
                It brings <strong>financial losses, health crises, relationship breakdowns, and career stagnation</strong>.
              </p>
              <div className="tl-sade-phases">
                <div className="tl-sade-phase">
                  <div className="tl-phase-dot tl-phase-rising"></div>
                  <span>Rising Phase</span>
                  <small>Saturn enters sign before Moon — anxiety begins</small>
                </div>
                <div className="tl-sade-phase">
                  <div className="tl-phase-dot tl-phase-peak"></div>
                  <span>Peak Phase</span>
                  <small>Saturn conjunct Moon — maximum pressure</small>
                </div>
                <div className="tl-sade-phase">
                  <div className="tl-phase-dot tl-phase-setting"></div>
                  <span>Setting Phase</span>
                  <small>Saturn exits Moon sign — gradual relief</small>
                </div>
              </div>
              <p className="tl-sade-warning">
                <i className="fas fa-exclamation-circle"></i>
                You may be in Sade Sati right now and not even know it.
              </p>
              <button className="tl-btn-danger" onClick={handleCTA}>
                <i className="fas fa-search"></i> Check My Sade Sati Status
              </button>
            </div>
          </div>
        </section>

        {/* ===== FEAR VS HOPE ===== */}
        <section className="tl-contrast tl-fade-section" ref={contrastRef}>
          <div className="container">
            <div className="tl-section-header">
              <h2>Two Paths. One Choice.</h2>
            </div>
            <div className="tl-contrast-grid">
              <div className="tl-contrast-card tl-contrast-ignore">
                <div className="tl-contrast-icon-wrap">
                  <i className="fas fa-eye-slash"></i>
                </div>
                <h3>Ignore the Warnings</h3>
                <ul>
                  <li>Saturn silently crushes your finances</li>
                  <li>Rahu creates obsessive blind spots</li>
                  <li>Mars triggers conflicts you didn't see coming</li>
                  <li>Jupiter's blessings pass unused</li>
                  <li>Missed career windows close forever</li>
                </ul>
                <div className="tl-contrast-bottom tl-contrast-bottom-bad">
                  <i className="fas fa-arrow-trend-down"></i> Reactive. Blindsided. Unprepared.
                </div>
              </div>
              <div className="tl-contrast-card tl-contrast-act">
                <div className="tl-contrast-icon-wrap tl-contrast-icon-good">
                  <i className="fas fa-eye"></i>
                </div>
                <h3>Know Your Windows</h3>
                <ul>
                  <li>Prepare for Saturn with remedies and patience</li>
                  <li>Channel Rahu's energy into calculated risks</li>
                  <li>Avoid Mars-triggered months for big decisions</li>
                  <li>Maximize Jupiter's window for growth</li>
                  <li>Time career moves to planetary support</li>
                </ul>
                <div className="tl-contrast-bottom tl-contrast-bottom-good">
                  <i className="fas fa-arrow-trend-up"></i> Proactive. Prepared. Empowered.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="tl-final-cta tl-fade-section" ref={ctaRef}>
          <div className="container">
            <div className="tl-cta-inner">
              <div className="tl-cta-icon-group">
                <i className="fas fa-satellite-dish tl-cta-icon"></i>
              </div>
              <h2>Your Planets Won't Wait.<br />Will <span className="tl-text-threat">You</span>?</h2>
              <p>
                Right now, Jupiter, Saturn, and Rahu are creating windows that will shape
                the next chapter of your life. Every day you wait is a day closer to missing
                an opportunity — or walking into a threat unprepared.
              </p>
              <button className="tl-btn-primary tl-btn-large tl-pulse" onClick={handleCTA}>
                <i className="fas fa-bolt"></i> Reveal My Threat & Opportunity Map
              </button>
              <div className="tl-cta-trust">
                <span><i className="fas fa-shield-alt"></i> 13 life areas analyzed</span>
                <span><i className="fas fa-brain"></i> Dual-AI cross-validation</span>
                <span><i className="fas fa-link"></i> Every claim evidence-backed</span>
                <span><i className="fas fa-satellite"></i> High-precision timing</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
