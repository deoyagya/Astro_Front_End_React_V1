import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function LoveMarriageReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Love & Marriage Report</h1>
                    <div className="subtitle">Relationship Compatibility, Marriage Timing & Life Partner Analysis</div>
                    <span className="badge">30+ Pages</span>
                </div>
        
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Venus-Jupiter Conjunction</p>
                    <p>Your 7th house is strongly aspected by Jupiter, indicating a harmonious marriage after age 28. Current Venus retrograde suggests relationship reevaluation. Soulmate connections indicated through 5th house placements.</p>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Lucky Numbers</span><span className="value">6, 15, 24</span></div>
                        <div className="summary-item"><span className="label">Lucky Colors</span><span className="value">Pink, White, Silver</span></div>
                        <div className="summary-item"><span className="label">Favorable Directions</span><span className="value">South-West, West</span></div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 1: 7th House - Marriage & Partnerships</h2>
                    <h3>Your Spouse's Characteristics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '20px' }}>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <h4>Physical Appearance</h4>
                            <ul>
                                <li><strong>Build:</strong> Tall, athletic (Jupiter influence)</li>
                                <li><strong>Complexion:</strong> Fair, glowing</li>
                                <li><strong>Hair:</strong> Dark, wavy</li>
                                <li><strong>Distinctive Feature:</strong> Bright, expressive eyes</li>
                            </ul>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <h4>Personality & Career</h4>
                            <ul>
                                <li><strong>Nature:</strong> Philosophical, spiritual, kind</li>
                                <li><strong>Profession:</strong> Teacher, counselor, healer</li>
                                <li><strong>Education:</strong> Post-graduate</li>
                                <li><strong>Family Background:</strong> Respected, cultured</li>
                            </ul>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <h4>Meeting Probability</h4>
                            <ul>
                                <li><strong>Through:</strong> Family friends, spiritual events</li>
                                <li><strong>Location:</strong> Pilgrimage, educational institute</li>
                                <li><strong>Time:</strong> Evening, under Jupiter's hour</li>
                                <li><strong>Season:</strong> Winter (November-January)</li>
                            </ul>
                        </div>
                    </div>
        
                    <h3 style={{ marginTop: '30px' }}>Marriage Timing Calculator</h3>
                    <table>
                        <tr><th>Period</th><th>Probability</th><th>Remarks</th></tr>
                        <tr><td>Nov 2024 - Feb 2025</td><td>85%</td><td>Venus-Jupiter conjunction</td></tr>
                        <tr><td>May - Aug 2025</td><td>60%</td><td>Good but family issues</td></tr>
                        <tr><td>Jan - Mar 2026</td><td>94%</td><td>BEST PERIOD</td></tr>
                    </table>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 2: Venus & Jupiter - Love Indicators</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '20px' }}>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <h4>Venus in Aries (1st House)</h4>
                            <div>Strength: 78%</div>
                            <ul>
                                <li>Passionate, romantic nature</li>
                                <li>Attracted to confident partners</li>
                                <li>Early relationships impulsive</li>
                                <li>Artistic/musical talents</li>
                            </ul>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.8)', padding: '20px', borderRadius: '10px' }}>
                            <h4>Jupiter in Pisces (12th House)</h4>
                            <div>Strength: 92% (Exalted)</div>
                            <ul>
                                <li>Spiritual approach to love</li>
                                <li>Foreign partner possible</li>
                                <li>Protection in marriage</li>
                                <li>Generous in relationship</li>
                            </ul>
                        </div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 3: Compatibility Analysis (Kundli Milan)</h2>
                    <table>
                        <tr><th>Guna</th><th>Max</th><th>Your Score</th><th>Analysis</th></tr>
                        <tr><td>Varna</td><td>1</td><td>1</td><td>Excellent</td></tr>
                        <tr><td>Vashya</td><td>2</td><td>2</td><td>Perfect</td></tr>
                        <tr><td>Tara</td><td>3</td><td>2</td><td>Good</td></tr>
                        <tr><td>Yoni</td><td>4</td><td>3</td><td>Good</td></tr>
                        <tr><td>Graha Maitri</td><td>5</td><td className="warning">1</td><td>POOR</td></tr>
                        <tr><td>Gana</td><td>3</td><td>3</td><td>Excellent</td></tr>
                        <tr><td>Bhakoot</td><td>7</td><td>5</td><td>Good</td></tr>
                        <tr><td>Nadi</td><td>8</td><td className="warning">0</td><td>NADI DOSHA</td></tr>
                    </table>
                    <div className="warning-box" style={{ marginTop: '20px' }}>
                        <h4><i className="fas fa-exclamation-triangle"></i> Manglik Dosha Detected</h4>
                        <p>Person A has Manglik dosha (Mars in 1st house). Special remedies required for marriage compatibility.</p>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 4: Relationship Challenges & Solutions</h2>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: 'rgba(40,44,60,0.6)', padding: '15px', borderRadius: '8px' }}>
                            <h4>Mars-Moon Square</h4>
                            <p>Emotional outbursts, arguments over ego. <strong>Solution:</strong> Both partners chant Durga Chalisa on Tuesdays.</p>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.6)', padding: '15px', borderRadius: '8px' }}>
                            <h4>Saturn Afflicting 7th House</h4>
                            <p>Delay in marriage, coldness from in-laws. <strong>Solution:</strong> Worship Lord Hanuman for 43 days.</p>
                        </div>
                        <div style={{ background: 'rgba(40,44,60,0.6)', padding: '15px', borderRadius: '8px' }}>
                            <h4>Nadi Dosha</h4>
                            <p>Health issues in children, possible miscarriage. <strong>Solution:</strong> Donate to pregnant women, feed cows.</p>
                        </div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 5: Relationship Remedies</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px' }}>
                        <div><i className="fas fa-gem" style={{ color: '#9d7bff' }}></i> <strong>Gemstone:</strong> Diamond (Heera) for Venus</div>
                        <div><i className="fas fa-om" style={{ color: '#9d7bff' }}></i> <strong>Mantra:</strong> "Om Kleem Kleem" 108 times daily</div>
                        <div><i className="fas fa-hand-holding-heart" style={{ color: '#9d7bff' }}></i> <strong>Donation:</strong> White clothes on Fridays</div>
                    </div>
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
