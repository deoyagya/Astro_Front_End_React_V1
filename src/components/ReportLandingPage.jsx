/**
 * ReportLandingPage — High-conversion landing page for each report type.
 *
 * PUBLIC page (no auth required) for SEO. User clicks "Order Now" → /order.
 * Sections: Hero → What's Inside → Sample Snapshot → Features → Testimonials → FAQ → CTA.
 */

import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePaymentGateway from '../hooks/usePaymentGateway';
import ChartSelectionModal from './ChartSelectionModal';
import { formatUsdCentsForUser } from '../utils/localPricing';
import '../styles/report-landing.css';

export default function ReportLandingPage({ config }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const gw = usePaymentGateway();
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  const {
    slug,
    icon,
    iconColor,
    title,
    tagline,
    metaDescription,
    priceCents,
    originalPriceCents,
    pages,
    deliveryHours,
    heroImage,
    // Content sections
    insideItems,
    sampleSnapshot,
    features,
    planetsCovered,
    housesCovered,
    testimonials,
    faqs,
    whyChoose,
  } = config;

  const priceDisplay = formatUsdCentsForUser(priceCents, gw);
  const originalPrice = originalPriceCents ? formatUsdCentsForUser(originalPriceCents, gw) : null;
  const savings = originalPriceCents ? Math.round((1 - priceCents / originalPriceCents) * 100) : 0;

  const handleOrder = useCallback(() => {
    if (isAuthenticated) {
      setIsChartModalOpen(true);
    } else {
      navigate('/login', { state: { from: { pathname: location.pathname } } });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return (
    <div className="rpl">
      <ChartSelectionModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        reportSlug={slug}
        reportName={title}
        reportPrice={priceCents}
        reportIcon={icon}
      />
      {/* ===== HERO ===== */}
      <section className="rpl-hero">
        <div className="rpl-hero-bg"></div>
        <div className="rpl-container">
          <div className="rpl-hero-grid">
            <div className="rpl-hero-content">
              <div className="rpl-hero-badge">
                <i className="fas fa-star"></i> Premium Vedic Report
              </div>
              <h1 className="rpl-hero-title">{title}</h1>
              <p className="rpl-hero-tagline">{tagline}</p>

              <div className="rpl-hero-meta">
                <span><i className="fas fa-file-alt"></i> {pages}+ Pages</span>
                <span><i className="fas fa-clock"></i> {deliveryHours}hr Delivery</span>
                <span><i className="fas fa-shield-alt"></i> BPHS Verified</span>
              </div>

              <div className="rpl-hero-price">
                {originalPrice && <span className="rpl-price-original">{originalPrice}</span>}
                <span className="rpl-price-current">{priceDisplay}</span>
                {savings > 0 && <span className="rpl-price-save">Save {savings}%</span>}
              </div>

              <div className="rpl-hero-actions">
                <button className="rpl-btn-primary" onClick={handleOrder}>
                  <i className="fas fa-scroll"></i> Order Your Report
                </button>
                <a href="#whats-inside" className="rpl-btn-ghost">
                  <i className="fas fa-eye"></i> See What's Inside
                </a>
              </div>

              <div className="rpl-trust-row">
                <span><i className="fas fa-check-circle"></i> 50,000+ Reports Delivered</span>
                <span><i className="fas fa-check-circle"></i> 4.9/5 Rating</span>
                <span><i className="fas fa-check-circle"></i> Swiss Ephemeris Engine</span>
              </div>
            </div>

            <div className="rpl-hero-visual">
              <div className="rpl-report-mockup">
                <div className="rpl-mockup-icon" style={{ color: iconColor || '#7b5bff' }}>
                  <i className={`fas ${icon}`}></i>
                </div>
                <div className="rpl-mockup-title">{title}</div>
                <div className="rpl-mockup-lines">
                  <div className="rpl-line" style={{ width: '85%' }}></div>
                  <div className="rpl-line" style={{ width: '70%' }}></div>
                  <div className="rpl-line" style={{ width: '92%' }}></div>
                  <div className="rpl-line" style={{ width: '60%' }}></div>
                </div>
                <div className="rpl-mockup-chart">
                  <div className="rpl-chart-grid">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="rpl-chart-house">{i + 1}</div>
                    ))}
                  </div>
                </div>
                <div className="rpl-mockup-seal">
                  <i className="fas fa-om"></i>
                  Astro Yagya
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INSIDE ===== */}
      <section className="rpl-section" id="whats-inside">
        <div className="rpl-container">
          <div className="rpl-section-header">
            <span className="rpl-section-badge">Report Contents</span>
            <h2>What's Inside Your Report</h2>
            <p>A comprehensive {pages}+ page analysis covering every critical dimension</p>
          </div>

          <div className="rpl-inside-grid">
            {insideItems.map((item, i) => (
              <div key={i} className="rpl-inside-card">
                <div className="rpl-inside-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="rpl-inside-icon"><i className={`fas ${item.icon}`}></i></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.highlights && (
                  <ul className="rpl-inside-list">
                    {item.highlights.map((h, j) => (
                      <li key={j}><i className="fas fa-check"></i> {h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SAMPLE SNAPSHOT ===== */}
      {sampleSnapshot && (
        <section className="rpl-section rpl-section-dark">
          <div className="rpl-container">
            <div className="rpl-section-header">
              <span className="rpl-section-badge">Sample Preview</span>
              <h2>Peek Inside a Real Report</h2>
              <p>See the depth and quality of analysis you'll receive</p>
            </div>

            <div className="rpl-snapshot">
              <div className="rpl-snapshot-card">
                <div className="rpl-snapshot-header">
                  <i className={`fas ${icon}`} style={{ color: iconColor }}></i>
                  <div>
                    <h4>{sampleSnapshot.title}</h4>
                    <span>{sampleSnapshot.subtitle}</span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="rpl-snapshot-summary">
                  <div className="rpl-snapshot-score">
                    <div className="rpl-score-circle" style={{ borderColor: sampleSnapshot.scoreColor || '#2ed573' }}>
                      <span className="rpl-score-num">{sampleSnapshot.score}</span>
                      <span className="rpl-score-label">{sampleSnapshot.scoreLabel}</span>
                    </div>
                  </div>
                  <div className="rpl-snapshot-metrics">
                    {sampleSnapshot.metrics.map((m, i) => (
                      <div key={i} className="rpl-metric">
                        <span className="rpl-metric-label">{m.label}</span>
                        <div className="rpl-metric-bar">
                          <div className="rpl-metric-fill" style={{ width: `${m.value}%`, background: m.color || '#7b5bff' }}></div>
                        </div>
                        <span className="rpl-metric-val">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Findings */}
                <div className="rpl-snapshot-findings">
                  <h5><i className="fas fa-search"></i> Key Findings</h5>
                  {sampleSnapshot.findings.map((f, i) => (
                    <div key={i} className={`rpl-finding ${f.type}`}>
                      <i className={`fas ${f.type === 'positive' ? 'fa-arrow-up' : f.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Blurred teaser */}
                <div className="rpl-snapshot-blur">
                  <div className="rpl-blur-overlay">
                    <i className="fas fa-lock"></i>
                    <span>Full analysis unlocked in your personalized report</span>
                    <button className="rpl-btn-primary rpl-btn-sm" onClick={handleOrder}>
                      Order Now — {priceDisplay}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== ASTROLOGICAL COVERAGE ===== */}
      <section className="rpl-section">
        <div className="rpl-container">
          <div className="rpl-section-header">
            <span className="rpl-section-badge">Technical Depth</span>
            <h2>Astrological Coverage</h2>
            <p>Powered by Swiss Ephemeris with classical Jyotish principles (BPHS, Phaladeepika)</p>
          </div>

          <div className="rpl-coverage-grid">
            {planetsCovered && (
              <div className="rpl-coverage-card">
                <h4><i className="fas fa-globe"></i> Planets Analyzed</h4>
                <div className="rpl-tag-cloud">
                  {planetsCovered.map((p, i) => (
                    <span key={i} className="rpl-tag">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {housesCovered && (
              <div className="rpl-coverage-card">
                <h4><i className="fas fa-th"></i> Houses Examined</h4>
                <div className="rpl-tag-cloud">
                  {housesCovered.map((h, i) => (
                    <span key={i} className="rpl-tag">{h}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="rpl-coverage-card">
              <h4><i className="fas fa-layer-group"></i> Analysis Layers</h4>
              <div className="rpl-tag-cloud">
                {['D1 Rashi', 'D9 Navamsa', 'D10 Dasamsa', 'Vimshottari Dasha', 'Transit Impact', 'Ashtakavarga', 'Yogas', 'Remedies'].map((t, i) => (
                  <span key={i} className="rpl-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE ===== */}
      {whyChoose && (
        <section className="rpl-section rpl-section-dark">
          <div className="rpl-container">
            <div className="rpl-section-header">
              <span className="rpl-section-badge">Why Choose Us</span>
              <h2>Not Just Another Horoscope</h2>
              <p>Here's what sets our reports apart from generic online astrology</p>
            </div>

            <div className="rpl-why-grid">
              {whyChoose.map((item, i) => (
                <div key={i} className="rpl-why-card">
                  <div className="rpl-why-icon"><i className={`fas ${item.icon}`}></i></div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES GRID ===== */}
      <section className="rpl-section">
        <div className="rpl-container">
          <div className="rpl-section-header">
            <span className="rpl-section-badge">Key Features</span>
            <h2>What Makes This Report Special</h2>
          </div>

          <div className="rpl-features-grid">
            {features.map((feat, i) => (
              <div key={i} className="rpl-feature-card">
                <div className="rpl-feature-icon" style={{ color: feat.color || iconColor }}>
                  <i className={`fas ${feat.icon}`}></i>
                </div>
                <h4>{feat.title}</h4>
                <p>{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      {testimonials && testimonials.length > 0 && (
        <section className="rpl-section rpl-section-dark">
          <div className="rpl-container">
            <div className="rpl-section-header">
              <span className="rpl-section-badge">Customer Love</span>
              <h2>What Our Clients Say</h2>
            </div>

            <div className="rpl-testimonials">
              {testimonials.map((t, i) => (
                <div key={i} className="rpl-testimonial-card">
                  <div className="rpl-stars">
                    {[...Array(5)].map((_, j) => <i key={j} className="fas fa-star"></i>)}
                  </div>
                  <p className="rpl-quote">"{t.quote}"</p>
                  <div className="rpl-author">
                    <i className="fas fa-user-circle"></i>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.location}</span>
                    </div>
                  </div>
                  {t.highlight && <span className="rpl-testimonial-tag">{t.highlight}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      {faqs && faqs.length > 0 && (
        <section className="rpl-section">
          <div className="rpl-container rpl-container-narrow">
            <div className="rpl-section-header">
              <span className="rpl-section-badge">FAQ</span>
              <h2>Common Questions</h2>
            </div>

            <div className="rpl-faqs">
              {faqs.map((faq, i) => (
                <details key={i} className="rpl-faq-item">
                  <summary>
                    <span>{faq.q}</span>
                    <i className="fas fa-chevron-down"></i>
                  </summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FINAL CTA ===== */}
      <section className="rpl-final-cta">
        <div className="rpl-container">
          <div className="rpl-cta-content">
            <i className={`fas ${icon} rpl-cta-icon`} style={{ color: iconColor }}></i>
            <h2>Ready to Unlock Your {title}?</h2>
            <p>Get your personalized {pages}+ page report with actionable Vedic insights, timing windows, and classical remedies.</p>
            <div className="rpl-cta-price">
              {originalPrice && <span className="rpl-price-original">{originalPrice}</span>}
              <span className="rpl-price-big">{priceDisplay}</span>
            </div>
            <button className="rpl-btn-primary rpl-btn-lg" onClick={handleOrder}>
              <i className="fas fa-scroll"></i> Order Now
            </button>
            <div className="rpl-guarantee">
              <i className="fas fa-shield-alt"></i>
              100% satisfaction guarantee — personalized to your exact birth chart
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
