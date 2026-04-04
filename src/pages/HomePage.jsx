import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useAuth } from '../context/AuthContext';
import { useStyles } from '../context/StyleContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const FALLBACK_LIFE_AREA_CARDS = [
  {
    href: '/career-report',
    icon: 'fa-briefcase',
    title: 'Career & Finance',
    summary: '10th house analysis, professional timing',
    impact: 'See whether your current career phase is building toward recognition, role change, promotion, or avoidable stagnation before the next major decision locks in.',
    accent: '#b794ff',
  },
  {
    href: '/love-marriage-report',
    icon: 'fa-heart',
    title: 'Love & Marriage',
    summary: '7th house, Venus, relationship timing',
    impact: 'Understand whether a relationship is moving toward commitment, karmic friction, or a make-or-break phase so you stop guessing with your heart.',
    accent: '#ff6b81',
  },
  {
    href: '/education-report',
    icon: 'fa-brain',
    title: 'Education & Intelligence',
    summary: '5th house, Mercury, Jupiter influences',
    impact: 'Identify the periods that truly support focus, exams, higher study, and mental clarity before lost momentum turns into a long academic delay.',
    accent: '#a29bfe',
  },
  {
    href: '/health-report',
    icon: 'fa-heartbeat',
    title: 'Health & Wellness',
    summary: '6th house, lagna, planetary afflictions',
    impact: 'Spot where stress, vulnerability, and recovery cycles are intensifying so you can act early instead of waiting for the body to force the issue.',
    accent: '#7bed9f',
  },
  {
    href: '/money-report',
    icon: 'fa-sack-dollar',
    title: 'Money / Finance / Wealth',
    summary: '2nd house, 11th house, D2 Hora support',
    impact: 'Know whether this is a window for accumulation, liquidity, and gains or a cycle where poor timing can quietly erode wealth.',
    accent: '#f6b93b',
  },
  {
    href: '/property-report',
    icon: 'fa-house-chimney',
    title: 'Property / Vehicles / Assets',
    summary: '4th house, D4, acquisition and stability',
    impact: 'Find out whether a purchase, vehicle decision, or asset move is supported now or likely to become an emotional and financial drain later.',
    accent: '#70a1ff',
  },
  {
    href: '/spiritual-report',
    icon: 'fa-om',
    title: 'Spiritual Growth',
    summary: '12th house, Ketu, spiritual inclinations',
    impact: 'See when detachment, inner growth, and karmic closure are genuinely active instead of mistaking confusion or escapism for spiritual progress.',
    accent: '#f7d56b',
  },
  {
    href: '/family-report',
    icon: 'fa-home',
    title: 'Family & Children',
    summary: '4th house, 5th house, benefics',
    impact: 'Understand whether home peace, family obligations, and children-related timing are stabilising or heading toward pressure that needs handling now.',
    accent: '#9d7bff',
  },
];

function buildLifeAreaCards(reports = []) {
  return reports.map((report) => ({
    href: report.route || `/${report.id}-report`,
    icon: report.icon,
    title: report.title,
    summary: report.desc || `${report.pages || 'Detailed'} personalised Vedic astrology report`,
    impact: report.footerNote || report.highlights?.[0] || report.desc || 'Detailed Vedic astrology analysis tailored to your chart.',
    accent: '#9d7bff',
  }));
}

export default function HomePage() {
  useSharedEffects();
  const { isAuthenticated } = useAuth();
  const { getOverride } = useStyles('home');
  const { allowed: hasTemporalForecastAccess } = useFeatureAccess('temporal_forecast');
  const [lifeAreaCards, setLifeAreaCards] = useState(FALLBACK_LIFE_AREA_CARDS);

  useEffect(() => {
    let cancelled = false;

    api.get('/v1/reports/catalog')
      .then((data) => {
        if (cancelled) return;
        const dynamicCards = buildLifeAreaCards(data.reports || []);
        if (dynamicCards.length > 0) {
          setLifeAreaCards(dynamicCards);
        }
      })
      .catch(() => {
        // Keep the fallback cards instead of breaking the home experience.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell activeNav="home">
      <section className="hero" style={getOverride('heroSection')}>
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-content">
                            <h1 style={getOverride('heroTitle')}>Your Cosmic Blueprint,<br />Revealed</h1>
                            <p>Get personalized Vedic astrology insights based on your exact birth chart. Discover your life's path through ancient wisdom.</p>
                            <div className="hero-buttons">
                                <a href="#free-tools" className="btn btn-primary"><i className="fas fa-crystal-ball"></i> Try Free Tools</a>
                                <Link to="/reports" className="btn btn-secondary"><i className="fas fa-scroll"></i> Explore Reports</Link>
                            </div>
      
      
                            <div className="trust-badges">
                                <span><i className="fas fa-check-circle"></i> 50K+ Happy Clients</span>
                                <span><i className="fas fa-check-circle"></i> 1M+ Charts Generated</span>
                                <span><i className="fas fa-check-circle"></i> 4.9/5 Rating</span>
                            </div>
                        </div>
                        <div className="hero-image">
      
                            <div className="cosmic-circle">
                                <div className="circle-content">
      
                                    <div className="rashi-container">
                                        <div className="rashi-item rashi-1"></div>
                                        <div className="rashi-item rashi-2"></div>
                                        <div className="rashi-item rashi-3"></div>
                                        <div className="rashi-item rashi-4"></div>
                                        <div className="rashi-item rashi-5"></div>
                                        <div className="rashi-item rashi-6"></div>
                                        <div className="rashi-item rashi-7"></div>
                                        <div className="rashi-item rashi-8"></div>
                                        <div className="rashi-item rashi-9"></div>
                                        <div className="rashi-item rashi-10"></div>
                                        <div className="rashi-item rashi-11"></div>
                                        <div className="rashi-item rashi-12"></div>
                                    </div>
      
      
                                    <div className="shiva-glow"></div>
      
      
                                    <div className="shiva-image-container">
                                        <img src="/images/lord_shiva.jpg" alt="Lord Shiva in Meditation" className="shiva-image" />
                                    </div>
      
      
                                    <a href="#free-tools" className="circle-cta">
                                        Begin Journey <i className="fas fa-arrow-right"></i>
                                    </a>
                                </div>
                                <div className="glow"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
      
                <section className="free-tools" id="free-tools">
                    <div className="container">
                        <div className="section-header">
                            <h2>Free Astrological Tools</h2>
                            <p>Experience the power of Vedic astrology with our complimentary tools</p>
                        </div>
      
                        <div className="tools-grid">
      
                            <div className="tool-card">
                                <div className="tool-icon"><i className="fas fa-chart-pie"></i></div>
                                <h3>Birth Chart (Kundli)</h3>
                                <p>Generate your detailed D1 chart with planetary positions and house calculations.</p>
                                <ul>
                                    <li><i className="fas fa-check"></i> Planetary positions</li>
                                    <li><i className="fas fa-check"></i> House cusps</li>
                                    <li><i className="fas fa-check"></i> Ascendant sign</li>
                                </ul>
                                <Link to="/birth-chart" className="tool-link">Generate Now <i className="fas fa-arrow-right"></i></Link>
                            </div>
      
      
                            <div className="tool-card popular">
                                <div className="popular-badge">Most Used</div>
                                <div className="tool-icon"><i className="fas fa-clock"></i></div>
                                <h3>Dasha Calculator</h3>
                                <p>Understand your current planetary periods and future timeline predictions.</p>
                                <ul>
                                    <li><i className="fas fa-check"></i> Mahadasha</li>
                                    <li><i className="fas fa-check"></i> Antardasha</li>
                                    <li><i className="fas fa-check"></i> Pratyantar</li>
                                </ul>
                                <Link to="/dasha" className="tool-link">Calculate Now <i className="fas fa-arrow-right"></i></Link>
                            </div>
      
      
                            <div className="tool-card">
                                <div className="tool-icon"><i className="fas fa-heart"></i></div>
                                <h3>Compatibility (Kundli Milan)</h3>
                                <p>Check relationship compatibility with Ashtakoot and Dashtakoot matching.</p>
                                <ul>
                                    <li><i className="fas fa-check"></i> 36 Gunas</li>
                                    <li><i className="fas fa-check"></i> Manglik analysis</li>
                                    <li><i className="fas fa-check"></i> Compatibility score</li>
                                </ul>
                                <Link to="/compatibility" className="tool-link">Check Compatibility <i className="fas fa-arrow-right"></i></Link>
                            </div>
      
      
                            <div className="tool-card">
                                <div className="tool-icon"><i className="fas fa-sun"></i></div>
                                <h3>Daily Horoscope</h3>
                                <p>Personalized daily predictions based on your moon sign and transits.</p>
                                <ul>
                                    <li><i className="fas fa-check"></i> Career</li>
                                    <li><i className="fas fa-check"></i> Love & Relationships</li>
                                    <li><i className="fas fa-check"></i> Finance</li>
                                </ul>
                                <Link to="/horoscope" className="tool-link">Read Today <i className="fas fa-arrow-right"></i></Link>
                            </div>
                        </div>
                    </div>
                </section>
      
      
                <section className="life-areas">
                    <div className="container">
                        <div className="section-header">
                            <h2>Life Area Reports</h2>
                            <p>Deep dive into specific aspects of your life with detailed astrological analysis</p>
                        </div>
      
                        <div className="areas-grid">
                            {lifeAreaCards.map((card) => (
                                <Link
                                  key={card.href}
                                  to={card.href}
                                  className="area-card"
                                  style={{ '--area-accent': card.accent }}
                                  aria-label={`${card.title} report`}
                                >
                                    <div className="area-card-face area-card-front">
                                        <i className={`fas ${card.icon}`}></i>
                                        <h4>{card.title}</h4>
                                        <p>{card.summary}</p>
                                        <span className="area-card-hint">Hover to see why this report matters</span>
                                    </div>
                                    <div className="area-card-face area-card-back">
                                        <div className="area-card-back-copy">
                                            <span className="area-card-kicker">Why order this report</span>
                                            <p>{card.impact}</p>
                                        </div>
                                        <span className="area-card-cta">Explore report <i className="fas fa-arrow-right"></i></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
      
      
            {/* ===== TEMPORAL FORECAST SHOWCASE ===== */}
            <section className="tf-showcase">
                <div className="container">
                    <div className="tf-showcase-grid">
                        <div className="tf-showcase-content">
                            <span className="tf-showcase-badge">
                                <i className="fas fa-crown"></i> Premium Feature
                            </span>
                            <h2>Temporal Forecast</h2>
                            <p className="tf-showcase-tagline">
                                Know when opportunity knocks &mdash; and when to guard against threats.
                            </p>
                            <p className="tf-showcase-desc">
                                Our AI-powered temporal engine scans your planetary transits, Vimshottari Dasha,
                                Sade Sati phase, and double transit patterns to classify 13 life areas into
                                opportunity, threat, or mixed windows.
                            </p>
                            <div className="tf-showcase-features">
                                <div className="tf-sf-row">
                                    <i className="fas fa-heartbeat"></i>
                                    <div>
                                        <strong>13 Life Areas</strong>
                                        <span>Health, Finance, Career, Education, Spiritual, Family &amp; more</span>
                                    </div>
                                </div>
                                <div className="tf-sf-row">
                                    <i className="fas fa-check-double"></i>
                                    <div>
                                        <strong>Double Transit Analysis</strong>
                                        <span>Jupiter + Saturn alignment on key houses per BPHS</span>
                                    </div>
                                </div>
                                <div className="tf-sf-row">
                                    <i className="fas fa-brain"></i>
                                    <div>
                                        <strong>AI Interpretations</strong>
                                        <span>Natural language insights from a classical Jyotish expert AI</span>
                                    </div>
                                </div>
                                <div className="tf-sf-row">
                                    <i className="fas fa-ring"></i>
                                    <div>
                                        <strong>Sade Sati Detection</strong>
                                        <span>Automatic phase tracking with per-area impact assessment</span>
                                    </div>
                                </div>
                            </div>
                            {hasTemporalForecastAccess ? (
                                <Link to="/temporal-forecast" className="btn btn-primary tf-showcase-cta">
                                    <i className="fas fa-hourglass-half"></i> View My Forecast
                                </Link>
                            ) : (
                                <Link to={isAuthenticated ? '/reports' : '/login'} className="btn btn-primary tf-showcase-cta">
                                    <i className="fas fa-arrow-up"></i> {isAuthenticated ? 'Upgrade to Premium' : 'Get Started'}
                                </Link>
                            )}
                        </div>
                        <div className="tf-showcase-visual">
                            <div className="tf-showcase-card tf-sc-opp">
                                <div className="tf-sc-icon"><i className="fas fa-arrow-up"></i></div>
                                <div className="tf-sc-body">
                                    <h4>Career &amp; Profession</h4>
                                    <span className="tf-sc-tag tf-sc-tag-opp">Opportunity</span>
                                    <div className="tf-sc-bar"><div className="tf-sc-fill" style={{width: '78%', background: '#2ed573'}}></div></div>
                                    <p>Jupiter transiting 10th house &mdash; strong career window</p>
                                </div>
                            </div>
                            <div className="tf-showcase-card tf-sc-threat">
                                <div className="tf-sc-icon"><i className="fas fa-arrow-down"></i></div>
                                <div className="tf-sc-body">
                                    <h4>Health &amp; Vitality</h4>
                                    <span className="tf-sc-tag tf-sc-tag-threat">Threat</span>
                                    <div className="tf-sc-bar"><div className="tf-sc-fill" style={{width: '62%', background: '#ff4757'}}></div></div>
                                    <p>Saturn aspecting lagna &mdash; take extra care</p>
                                </div>
                            </div>
                            <div className="tf-showcase-card tf-sc-mixed">
                                <div className="tf-sc-icon"><i className="fas fa-arrows-alt-h"></i></div>
                                <div className="tf-sc-body">
                                    <h4>Finance &amp; Wealth</h4>
                                    <span className="tf-sc-tag tf-sc-tag-mixed">Mixed</span>
                                    <div className="tf-sc-bar"><div className="tf-sc-fill" style={{width: '55%', background: '#ffa502'}}></div></div>
                                    <p>Double transit active &mdash; calculated risks may pay off</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

                <section className="testimonials">
                    <div className="container">
                        <div className="section-header">
                            <h2>What Our <span className="highlight">Clients Say</span></h2>
                        </div>
                        <div className="testimonials-grid">
                            <div className="testimonial-card">
                                <div className="stars">
                                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                </div>
                                <p>"The career report was spot on. It predicted my promotion within 3 months!"</p>
                                <div className="client">
                                    <i className="fas fa-user-circle"></i>
                                    <div>
                                        <strong>Rahul M.</strong>
                                        <span>Mumbai, India</span>
                                    </div>
                                </div>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">
                                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                </div>
                                <p>"The compatibility report helped us understand our relationship dynamics better."</p>
                                <div className="client">
                                    <i className="fas fa-user-circle"></i>
                                    <div>
                                        <strong>Priya & Ankit</strong>
                                        <span>Delhi, India</span>
                                    </div>
                                </div>
                            </div>
                            <div className="testimonial-card">
                                <div className="stars">
                                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                </div>
                                <p>"Accurate dasha predictions. The guidance helped me make important life decisions."</p>
                                <div className="client">
                                    <i className="fas fa-user-circle"></i>
                                    <div>
                                        <strong>Sarah J.</strong>
                                        <span>London, UK</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
      
      
                <section className="final-cta">
                    <div className="container">
                        <h2>Ready to Discover Your Destiny?</h2>
                        <p>Join 50,000+ seekers who have transformed their lives with Vedic wisdom.</p>
                        <div className="cta-buttons">
                            <a href="#free-tools" className="btn btn-primary"><i className="fas fa-crystal-ball"></i> Try Free Tools</a>
                            <Link to="/reports" className="btn btn-secondary"><i className="fas fa-scroll"></i> Order Your Report</Link>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
