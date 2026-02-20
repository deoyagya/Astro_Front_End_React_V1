import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';

export default function HomePage() {
  useSharedEffects();

  return (
    <PageShell activeNav="home">
      <section className="hero">
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-content">
                            <h1>Your Cosmic Blueprint,<br />Revealed</h1>
                            <p>Get personalized Vedic astrology insights based on your exact birth chart. Discover your life's path through ancient wisdom.</p>
                            <div className="hero-buttons">
                                <a href="#free-tools" className="btn btn-primary"><i className="fas fa-crystal-ball"></i> Try Free Tools</a>
                                <a href="/reports" className="btn btn-secondary"><i className="fas fa-scroll"></i> Explore Reports</a>
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
                                <a href="/birth-chart" className="tool-link">Generate Now <i className="fas fa-arrow-right"></i></a>
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
                                <a href="/dasha" className="tool-link">Calculate Now <i className="fas fa-arrow-right"></i></a>
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
                                <a href="/compatibility" className="tool-link">Check Compatibility <i className="fas fa-arrow-right"></i></a>
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
                                <a href="/horoscope" className="tool-link">Read Today <i className="fas fa-arrow-right"></i></a>
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
                            <a href="/reports#career" className="area-card">
                                <i className="fas fa-briefcase"></i>
                                <h4>Career & Finance</h4>
                                <p>10th house analysis, professional timing</p>
                            </a>
                            <a href="/reports#love" className="area-card">
                                <i className="fas fa-heart"></i>
                                <h4>Love & Marriage</h4>
                                <p>7th house, Venus, relationship timing</p>
                            </a>
                            <a href="/reports#education" className="area-card">
                                <i className="fas fa-brain"></i>
                                <h4>Education & Intelligence</h4>
                                <p>5th house, Mercury, Jupiter influences</p>
                            </a>
                            <a href="/reports#health" className="area-card">
                                <i className="fas fa-spa"></i>
                                <h4>Health & Wellness</h4>
                                <p>6th house, lagna, planetary afflictions</p>
                            </a>
                            <a href="/reports#spiritual" className="area-card">
                                <i className="fas fa-om"></i>
                                <h4>Spiritual Growth</h4>
                                <p>12th house, Ketu, spiritual inclinations</p>
                            </a>
                            <a href="/reports#family" className="area-card">
                                <i className="fas fa-home"></i>
                                <h4>Family & Children</h4>
                                <p>4th house, 5th house, benefics</p>
                            </a>
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
                            <a href="/reports" className="btn btn-secondary"><i className="fas fa-scroll"></i> Order Your Report</a>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
