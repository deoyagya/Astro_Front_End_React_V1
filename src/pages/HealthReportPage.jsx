import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function HealthReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Health & Wellness Report</h1>
                    <div className="subtitle">Health Predispositions, Vitality Periods & Preventive Care</div>
                    <span className="badge">24+ Pages</span>
                </div>
        
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Sun-Mars Conjunction</p>
                    <p>Your 6th house indicates strong immunity but specific vulnerabilities in digestive system and bones. Follow prescribed lifestyle for optimal health.</p>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Lucky Numbers</span><span className="value">1, 9, 18</span></div>
                        <div className="summary-item"><span className="label">Lucky Colors</span><span className="value">Red, Orange, Gold</span></div>
                        <div className="summary-item"><span className="label">Favorable Directions</span><span className="value">East, North</span></div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 1: Body Constitution (Prakriti)</h2>
                    <h3>Primary Constitution: Pitta-Vata</h3>
                    <ul>
                        <li>Vata: 65% (Air + Ether) - Nervous system, joints</li>
                        <li>Pitta: 80% (Fire + Water) - Digestion, metabolism</li>
                        <li>Kapha: 45% (Earth + Water) - Structure, immunity</li>
                    </ul>
                    <p>You have a predominantly Pitta constitution with secondary Vata influence. Prone to acidity, skin rashes, and joint issues.</p>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 2: Disease Susceptibility</h2>
                    <table>
                        <tr><th>Body Part</th><th>Risk</th><th>Prevention</th></tr>
                        <tr><td>Digestive System</td><td>High Risk</td><td>Avoid spicy, oily food</td></tr>
                        <tr><td>Bones & Joints</td><td>High Risk</td><td>Calcium, Vitamin D, yoga</td></tr>
                        <tr><td>Skin</td><td>Medium Risk</td><td>Neem-based skincare</td></tr>
                        <tr><td>Heart</td><td>Low Risk</td><td>Regular exercise</td></tr>
                    </table>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 3: Health Timeline</h2>
                    <div className="timeline-item warning">
                        <div className="period">May-Aug 2024</div>
                        <h4>Digestive Issues</h4>
                        <p>Avoid spicy foods, eat smaller meals, drink coconut water.</p>
                    </div>
                    <div className="timeline-item critical">
                        <div className="period">Oct-Dec 2024</div>
                        <h4>⚠️ Accident Risk</h4>
                        <p>Avoid driving during evening hours, be cautious with fire.</p>
                    </div>
                    <div className="timeline-item warning">
                        <div className="period">Feb-Apr 2025</div>
                        <h4>Skin Allergies</h4>
                        <p>Use neem, avoid synthetic fabrics.</p>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 4: Ayurvedic Daily Routine (Dinacharya)</h2>
                    <ul>
                        <li>Wake before sunrise, drink warm water with lemon</li>
                        <li>Oil pulling with sesame oil (5-10 min)</li>
                        <li>Abhyanga (self-massage) with coconut oil</li>
                        <li>Yoga: Surya Namaskar, Sheetali pranayama</li>
                        <li>Meals at fixed times, dinner by 7 PM</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 5: Ayurvedic Remedies</h2>
                    <ul>
                        <li>Ashwagandha 1 tsp with warm milk at night (for stress)</li>
                        <li>Triphala 1 tsp at bedtime (for digestion)</li>
                        <li>Brahmi 500mg twice daily (for memory, anxiety)</li>
                        <li>Neem capsules in summer (for skin)</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 6: Healing Mantras</h2>
                    <p><strong>Maha Mrityunjaya Mantra:</strong></p>
                    <p className="sanskrit">ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥</p>
                    <p>Chant 108 times daily for overall health.</p>
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
