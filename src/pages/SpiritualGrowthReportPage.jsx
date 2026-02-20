import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function SpiritualGrowthReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Spiritual Growth Report</h1>
                    <div className="subtitle">Soul Path, Past Life Karma & Spiritual Evolution</div>
                    <span className="badge">28+ Pages</span>
                </div>
        
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Ketu Mahadasha (Spiritual Awakening)</p>
                    <p>Your chart shows strong spiritual indicators with Ketu in 12th house indicating past life as a monk. Enlightenment potential indicated after age 45.</p>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Lucky Numbers</span><span className="value">7, 16, 25</span></div>
                        <div className="summary-item"><span className="label">Lucky Colors</span><span className="value">Orange, Saffron, White</span></div>
                        <div className="summary-item"><span className="label">Favorable Directions</span><span className="value">North-East, East</span></div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 1: Your Soul's Purpose</h2>
                    <h3>Ketu in 12th House (Pisces)</h3>
                    <p><strong>PAST LIFE:</strong> Buddhist Monk in Tibet</p>
                    <p>Your soul carries the memory of intense spiritual practice. You feel drawn to meditation, solitude, and helping others detach from materialism.</p>
                    <p><strong>Soul Age:</strong> 43% (Old soul - last incarnation before liberation)</p>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 2: Guru Yoga</h2>
                    <p>Jupiter in Pisces (Exalted) indicates you'll meet your spiritual master between 2025-2027. The guru will appear from the West direction, elderly, soft-spoken, with profound eyes.</p>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 3: Daily Spiritual Practice (Sadhana)</h2>
                    <ul>
                        <li>Wake up at Brahma Muhurta (4:30 AM)</li>
                        <li>Chant Gayatri Mantra 108 times</li>
                        <li>Meditate for 20 minutes facing North-East</li>
                        <li>Read spiritual texts for 15 minutes</li>
                        <li>Evening Aarti and Kirtan</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 4: Chakra Analysis</h2>
                    <ul>
                        <li>Root: 65% (partial block - financial insecurity)</li>
                        <li>Sacral: 72% (moderate)</li>
                        <li>Solar Plexus: 88% (strong)</li>
                        <li>Heart: 60% (blocked - past life trauma)</li>
                        <li>Throat: 92% (very strong)</li>
                        <li>Third Eye: 45% (opening slowly)</li>
                        <li>Crown: 30% (dormant, will awaken after 45)</li>
                    </ul>
                    <div className="warning-box">
                        <h4>Kundalini Warning</h4>
                        <p>Potential for spontaneous awakening. Seek guidance if you experience heat rising, visions, or spontaneous movements.</p>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 5: Pilgrimage Guide</h2>
                    <ul>
                        <li><strong>Kedarnath/Badrinath:</strong> May-June 2025 (21 days)</li>
                        <li><strong>Varanasi:</strong> Nov-Dec 2024 (7-14 days) - perform tarpan</li>
                        <li><strong>Rishikesh:</strong> Feb-Mar 2025 (1-3 months for yoga training)</li>
                        <li><strong>Tiruvannamalai:</strong> Dec-Jan 2025-26 (14-30 days)</li>
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
