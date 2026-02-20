import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function FamilyChildrenReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Family & Children Report</h1>
                    <div className="subtitle">Family Harmony, Progeny Timing & Ancestral Karma</div>
                    <span className="badge">26+ Pages</span>
                </div>
        
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Jupiter Transit through 5th House</p>
                    <p>Your 4th and 5th houses indicate strong family ties but with karmic challenges. Ancestral rituals (pitru tarpan) essential for family harmony. Childbirth indicated after 2025.</p>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Lucky Numbers</span><span className="value">4, 13, 22</span></div>
                        <div className="summary-item"><span className="label">Lucky Colors</span><span className="value">Red, Gold, Cream</span></div>
                        <div className="summary-item"><span className="label">Favorable Directions</span><span className="value">North, West</span></div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 1: 4th House - Family & Mother</h2>
                    <p><strong>Moon in 4th House:</strong> Deep emotional bond with mother. She is nurturing but may have stress-related health issues.</p>
                    <h4>Mother's Health Timeline</h4>
                    <ul>
                        <li>2024-2025: Stress, anxiety - meditation needed</li>
                        <li>2026-2027: Digestive issues - light diet</li>
                        <li>2028+: Stable health</li>
                    </ul>
                    <h4>Property & Real Estate</h4>
                    <p>Best time to buy house: 2024 or 2027. West-facing properties favorable. Possible property dispute with siblings in 2025-2026.</p>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 2: Children & Progeny</h2>
                    <h3>Childbirth Timing</h3>
                    <ul>
                        <li>Current probability: 35%</li>
                        <li>2025-2026: 68%</li>
                        <li>2027-2028: 89% (BEST)</li>
                    </ul>
                    <h4>First Child Characteristics</h4>
                    <p>Gender: 65% male. Nature: Intelligent, spiritual, strong-willed. Career: Teacher, healer, philosopher.</p>
                    <div className="warning-box">
                        <h4>Nadi Dosha Detected</h4>
                        <p>May cause delayed conception or health issues in children. Perform Putrakameshti Yagna before trying to conceive.</p>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 3: Siblings & Extended Family</h2>
                    <p>Number of siblings: 1-2. Relationship with older brother strained (property), with younger sister supportive.</p>
                    <p>Extended family: Paternal side distant, maternal side close.</p>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 4: Ancestral Karma (Pitru Dosha)</h2>
                    <p>Your chart shows unresolved ancestral karma. Perform Pitru Shanti remedies:</p>
                    <ul>
                        <li>Pitru Paksha Shraddha every year (Sept-Oct)</li>
                        <li>Tarpan on Amavasya (new moon)</li>
                        <li>Feed crows and Brahmins</li>
                        <li>Plant a Peepal tree and water it daily</li>
                        <li>Pilgrimage to Gaya for pinda daan</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 5: Family Harmony Remedies</h2>
                    <ul>
                        <li>Gift mother white clothes on Fridays</li>
                        <li>Gift father red clothes on Sundays</li>
                        <li>Share childhood photos with siblings</li>
                        <li>Vastu: Keep North-East clean, place family deity</li>
                        <li>Recite Sri Sukta together on Fridays</li>
                    </ul>
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
