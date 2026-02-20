import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function CareerReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Career & Finance Report</h1>
                    <div className="subtitle">Professional Path, Growth Periods & Financial Potential</div>
                    <span className="badge">25+ Pages</span>
                </div>
        
                
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Saturn-Mercury Mahadasha</p>
                    <p>Your career chart shows strong potential for leadership roles, especially in fields related to communication, finance, or law. Current planetary positions indicate a major career transition within 18 months.</p>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="label">Lucky Numbers</div>
                            <div className="value">3, 8, 15, 22</div>
                        </div>
                        <div className="summary-item">
                            <div className="label">Lucky Colors</div>
                            <div className="value">Blue, Green, Silver</div>
                        </div>
                        <div className="summary-item">
                            <div className="label">Favorable Directions</div>
                            <div className="value">North, West</div>
                        </div>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Chapter 1: Your Career Blueprint (10th House Analysis)</h2>
                    <h3>10th House Lord: Saturn in Capricorn (Own House)</h3>
                    <p>Saturn in its own house gives you tremendous discipline, patience, and long-term success potential. You're suited for careers requiring persistence - engineering, administration, law, or real estate.</p>
                    <h4>Key Career Indicators:</h4>
                    <ul>
                        <li><strong>Midheaven (MC):</strong> Capricorn - You're seen as responsible, ambitious, and authoritative</li>
                        <li><strong>10th Lord Placement:</strong> Saturn in 10th - You'll achieve peak career success after age 36</li>
                        <li><strong>Planets in 10th:</strong> Saturn alone - You prefer working independently</li>
                        <li><strong>Aspects on 10th:</strong> Jupiter aspects - Growth through teaching/mentoring</li>
                    </ul>
        
                    <h4>Ideal Career Paths:</h4>
                    <div className="career-list">
                        <div className="career-item high">
                            <span className="score">95%</span>
                            <strong>Financial Analyst/Investment Banker</strong>
                            <p>Saturn's discipline + Mercury's analysis</p>
                        </div>
                        <div className="career-item high">
                            <span className="score">92%</span>
                            <strong>Corporate Lawyer</strong>
                            <p>Saturn's authority + Jupiter's wisdom</p>
                        </div>
                        <div className="career-item medium">
                            <span className="score">87%</span>
                            <strong>Civil Services/Government Officer</strong>
                            <p>Saturn's service orientation</p>
                        </div>
                        <div className="career-item medium">
                            <span className="score">84%</span>
                            <strong>Real Estate Developer</strong>
                            <p>Saturn rules land and structures</p>
                        </div>
                        <div className="career-item low">
                            <span className="score">65%</span>
                            <strong>Creative Fields</strong>
                            <p>Saturn restricts creative expression</p>
                        </div>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Chapter 2: Professional Success Timeline</h2>
                    <div className="timeline">
                        <div className="timeline-item current">
                            <div className="period">2023-2025</div>
                            <h4>Saturn-Mercury Antardasha (CURRENT)</h4>
                            <span className="badge warning">CRITICAL PHASE</span>
                            <ul>
                                <li>Job instability due to Mercury's affliction</li>
                                <li>Communication breakdowns with superiors</li>
                                <li>Learning new skills - invest in certifications</li>
                                <li>Foreign travel opportunities arise</li>
                            </ul>
                            <div style={{ background: 'rgba(123,91,255,0.1)', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
                                <strong>Immediate Remedy:</strong> Recite Vishnu Sahasranamam every Wednesday
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="period">2025-2027</div>
                            <h4>Saturn-Ketu Antardasha</h4>
                            <span className="badge success">TRANSFORMATION</span>
                            <ul>
                                <li>Sudden career shift - possibly to spiritual fields</li>
                                <li>Technology sector opportunities</li>
                                <li>Relocation to new city/country</li>
                                <li>Breakthrough in research/innovation</li>
                            </ul>
                        </div>
                        <div className="timeline-item">
                            <div className="period">2027-2030</div>
                            <h4>Saturn-Venus Antardasha</h4>
                            <span className="badge success">FINANCIAL GROWTH</span>
                            <ul>
                                <li>Major financial gains through creative work</li>
                                <li>Partnership opportunities flourish</li>
                                <li>Luxury goods/automotive industry success</li>
                                <li>Property acquisition</li>
                            </ul>
                        </div>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Chapter 3: Financial Astrology (2nd & 11th House)</h2>
                    <div className="financial-grid">
                        <div className="financial-card">
                            <h4>2nd House (Accumulated Wealth)</h4>
                            <p><strong>Lord:</strong> Jupiter in Pisces (Exalted)</p>
                            <p><span className="tag excellent">EXCELLENT</span></p>
                            <ul>
                                <li>Family wealth after age 34</li>
                                <li>Inheritance from maternal side</li>
                                <li>Jupiter protects from financial ruin</li>
                            </ul>
                        </div>
                        <div className="financial-card">
                            <h4>11th House (Gains)</h4>
                            <p><strong>Lord:</strong> Mercury in Gemini (Own House)</p>
                            <p><span className="tag good">GOOD</span></p>
                            <ul>
                                <li>Income through communication/sales</li>
                                <li>Multiple income streams after 2025</li>
                                <li>Social network brings opportunities</li>
                            </ul>
                        </div>
                    </div>
        
                    <h4>Monthly Financial Forecast (2024-2025)</h4>
                    <table>
                        <tr>
                            <th>Month</th>
                            <th>Income Trend</th>
                            <th>Expenses</th>
                            <th>Investment</th>
                        </tr>
                        <tr>
                            <td>March 2024</td>
                            <td>⬆️ Rising</td>
                            <td>High</td>
                            <td>Fixed Deposits</td>
                        </tr>
                        <tr>
                            <td>April 2024</td>
                            <td>⬇️ Dip</td>
                            <td className="warning">Very High</td>
                            <td>Avoid</td>
                        </tr>
                        <tr>
                            <td>May 2024</td>
                            <td>⬆️ Recovery</td>
                            <td>Moderate</td>
                            <td>Gold/Silver</td>
                        </tr>
                    </table>
        
                    <div className="warning-box">
                        <h4><i className="fas fa-exclamation-triangle"></i> Critical Financial Warning</h4>
                        <p>Saturn's transit over your 2nd house (Aug-Nov 2024) indicates:</p>
                        <ul>
                            <li>Family property dispute</li>
                            <li>Unexpected medical expenses</li>
                            <li>Avoid lending money to friends</li>
                        </ul>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Chapter 4: Business Astrology</h2>
                    <h3>Entrepreneurship Potential</h3>
                    <div style={{ background: 'rgba(123,91,255,0.1)', padding: '15px', borderRadius: '10px', margin: '20px 0' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Business Success Probability: <strong>78%</strong></div>
                        <div style={{ width: '100%', height: '10px', background: '#2a2f3e', borderRadius: '5px' }}>
                            <div style={{ width: '78%', height: '100%', background: '#7b5bff', borderRadius: '5px' }}></div>
                        </div>
                    </div>
        
                    <h4>Best Business Sectors:</h4>
                    <div className="career-list">
                        <div className="career-item high">
                            <span className="score">#1</span>
                            <strong>Educational Technology</strong>
                            <p>Jupiter + Mercury combination</p>
                            <small>Start: June 2025</small>
                        </div>
                        <div className="career-item high">
                            <span className="score">#2</span>
                            <strong>Real Estate Development</strong>
                            <p>Saturn + Venus influence</p>
                            <small>Start: Jan 2026</small>
                        </div>
                        <div className="career-item medium">
                            <span className="score">#3</span>
                            <strong>Import/Export Business</strong>
                            <p>Rahu in 12th house</p>
                            <small>Start: Sep 2025</small>
                        </div>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Chapter 5: Career Remedies</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '20px' }}>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <i className="fas fa-gem" style={{ fontSize: '2rem', color: '#9d7bff', marginBottom: '10px' }}></i>
                            <h4>Gemstone Therapy</h4>
                            <p><strong>Blue Sapphire (Neelam):</strong> Strengthens Saturn</p>
                            <ul>
                                <li>Weight: 3-5 carats</li>
                                <li>Finger: Middle (Saturday morning)</li>
                            </ul>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <i className="fas fa-om" style={{ fontSize: '2rem', color: '#9d7bff', marginBottom: '10px' }}></i>
                            <h4>Mantra Sadhana</h4>
                            <p><strong>For Career Success:</strong> "ॐ नमः शिवाय" 108 times daily</p>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <i className="fas fa-hand-holding-heart" style={{ fontSize: '2rem', color: '#9d7bff', marginBottom: '10px' }}></i>
                            <h4>Donations</h4>
                            <ul>
                                <li>Black sesame seeds on Saturdays</li>
                                <li>Iron tools to laborers on Amavasya</li>
                            </ul>
                        </div>
                    </div>
                </div>
        
                
                <div className="chapter">
                    <h2>Appendix: Planetary Positions</h2>
                    <table>
                        <tr><th>Planet</th><th>Sign</th><th>House</th><th>Degree</th></tr>
                        <tr><td>Sun</td><td>Taurus</td><td>2nd</td><td>24°15'</td></tr>
                        <tr><td>Moon</td><td>Libra</td><td>7th</td><td>12°30'</td></tr>
                        <tr><td>Mars</td><td>Leo</td><td>5th</td><td>8°45'</td></tr>
                        <tr><td>Mercury</td><td>Gemini</td><td>3rd</td><td>15°20'</td></tr>
                        <tr><td>Jupiter</td><td>Pisces</td><td>12th</td><td>6°10'</td></tr>
                        <tr><td>Venus</td><td>Aries</td><td>1st</td><td>19°55'</td></tr>
                        <tr><td>Saturn</td><td>Capricorn</td><td>10th</td><td>3°25'</td></tr>
                    </table>
                </div>
        
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                    <button className="btn" onClick={() => window.print()}><i className="fas fa-print"></i> Download PDF</button>
                    <button className="btn btn-outline" onClick={() => { window.location.href = '/order'; }}><i className="fas fa-shopping-cart"></i> Order Full Report</button>
                </div>
            </div>
      </div>
    </PageShell>
  );
}
