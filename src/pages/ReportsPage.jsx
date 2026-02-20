import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';

const REPORTS = [
  {
    id: 'career', title: 'Career & Finance', icon: 'fa-briefcase',
    desc: 'In-depth analysis of your professional path, growth periods, and financial potential based on 10th house, 2nd house, and planetary periods.',
    pages: '25+', price: 1499, badge: 'Best Seller', route: '/career-report',
    highlights: ['10th house career analysis', 'Financial growth windows', 'Professional timing & dasha periods'],
    planets: [
      { name: 'Sun', house: '10th', status: 'key', effect: 'Authority & leadership potential' },
      { name: 'Saturn', house: '10th', status: 'key', effect: 'Career discipline & timing' },
      { name: 'Jupiter', house: '2nd', status: 'key', effect: 'Financial growth & abundance' },
    ],
    remedies: ['Strengthen Sun for career authority', 'Saturn remedies for steady progress', 'Jupiter mantras for financial growth'],
  },
  {
    id: 'love', title: 'Love & Marriage', icon: 'fa-heart',
    desc: 'Detailed compatibility analysis, marriage timing, relationship strengths, and challenges based on 7th house, Venus, and Jupiter.',
    pages: '30+', price: 1799, badge: '', route: '/love-marriage-report',
    highlights: ['7th house relationship analysis', 'Venus & marriage timing', 'Manglik dosha assessment'],
    planets: [
      { name: 'Venus', house: '7th', status: 'key', effect: 'Love & relationship harmony' },
      { name: 'Mars', house: '1st', status: 'key', effect: 'Manglik dosha evaluation' },
      { name: 'Jupiter', house: '7th', status: 'key', effect: 'Marriage blessings & timing' },
    ],
    remedies: ['Venus strengthening for harmony', 'Manglik dosha remedies if applicable', 'Jupiter mantras for marriage timing'],
  },
  {
    id: 'education', title: 'Education & Intelligence', icon: 'fa-brain',
    desc: 'Analysis of learning abilities, academic success periods, and intellectual strengths through 5th house, Mercury, and Jupiter influences.',
    pages: '20+', price: 1299, badge: '', route: '/education-report',
    highlights: ['5th house intellect analysis', 'Mercury & learning abilities', 'Academic timing windows'],
    planets: [
      { name: 'Mercury', house: '5th', status: 'key', effect: 'Intellectual capacity' },
      { name: 'Jupiter', house: '9th', status: 'key', effect: 'Higher education & wisdom' },
      { name: 'Moon', house: '4th', status: 'key', effect: 'Memory & emotional intelligence' },
    ],
    remedies: ['Mercury mantras for concentration', 'Saraswati prayers for knowledge', 'Study during favorable planetary hours'],
  },
  {
    id: 'health', title: 'Health & Wellness', icon: 'fa-spa',
    desc: 'Understand health predispositions, vitality periods, and preventive measures through 6th house, lagna, and planetary influences.',
    pages: '22+', price: 1399, badge: 'New', route: '/health-report',
    highlights: ['6th house health analysis', 'Lagna vitality assessment', 'Preventive guidance periods'],
    planets: [
      { name: 'Sun', house: '1st', status: 'key', effect: 'Vitality & constitution' },
      { name: 'Moon', house: '4th', status: 'key', effect: 'Mental & emotional wellness' },
      { name: 'Mars', house: '6th', status: 'key', effect: 'Physical strength & energy' },
    ],
    remedies: ['Sun mantras for vitality', 'Pranayama for Moon balance', 'Dietary guidance per Ayurvedic constitution'],
  },
  {
    id: 'spiritual', title: 'Spiritual Growth', icon: 'fa-om',
    desc: 'Explore your spiritual path, past life indicators, and evolution through 12th house, Ketu, and spiritual planetary influences.',
    pages: '28+', price: 1599, badge: '', route: '/spiritual-growth-report',
    highlights: ['12th house spiritual analysis', 'Ketu & past life indicators', 'Meditation & dharma path'],
    planets: [
      { name: 'Ketu', house: '12th', status: 'key', effect: 'Spiritual liberation path' },
      { name: 'Jupiter', house: '9th', status: 'key', effect: 'Guru grace & dharma' },
      { name: 'Moon', house: '12th', status: 'key', effect: 'Intuition & inner wisdom' },
    ],
    remedies: ['Ketu mantras for spiritual clarity', 'Meditation during favorable nakshatras', 'Guru-related prayers & practices'],
  },
  {
    id: 'family', title: 'Family & Children', icon: 'fa-home',
    desc: 'Analysis of family harmony, child timing, and relationships with parents through 4th house, 5th house, and benefic planets.',
    pages: '26+', price: 1499, badge: '', route: '/family-children-report',
    highlights: ['4th house family harmony', '5th house children & progeny', 'Parent relationship analysis'],
    planets: [
      { name: 'Moon', house: '4th', status: 'key', effect: 'Mother & domestic happiness' },
      { name: 'Jupiter', house: '5th', status: 'key', effect: 'Children & progeny blessings' },
      { name: 'Venus', house: '4th', status: 'key', effect: 'Domestic comfort & harmony' },
    ],
    remedies: ['Moon mantras for family peace', 'Jupiter prayers for progeny blessings', 'Venus remedies for domestic harmony'],
  },
];

export default function ReportsPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const [sampleReport, setSampleReport] = useState(null);

  const getCart = () => {
    const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  };

  const addToCart = (report) => {
    const cart = getCart();
    if (!cart.some((item) => item.id === report.id)) {
      cart.push({ id: report.id, name: report.title, price: report.price, icon: report.icon });
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const orderReport = (report) => {
    addToCart(report);
    setSampleReport(null);
    navigate('/order');
  };

  const orderBundle = () => {
    const cart = getCart();
    REPORTS.forEach((r) => {
      if (!cart.some((item) => item.id === r.id)) {
        cart.push({ id: r.id, name: r.title, price: r.price, icon: r.icon });
      }
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/order');
  };

  return (
    <PageShell activeNav="reports">
      <section className="reports-section">
        <div className="container">
          <div className="section-header">
            <h2>Life Area Reports</h2>
            <p>
              Choose a detailed astrological report tailored to your specific life questions.
              Each report includes planetary analysis, dasha timing, and personalized recommendations.
            </p>
            <p className="sample-note">
              <i className="fas fa-eye"></i> Click &quot;View Sample&quot; to see a preview of what each report reveals
            </p>
          </div>

          {/* Reports Grid */}
          <div className="reports-grid">
            {REPORTS.map((report) => (
              <div className="report-card" key={report.id} id={report.id}>
                {report.badge && <div className="card-badge">{report.badge}</div>}
                <div className="report-icon"><i className={`fas ${report.icon}`}></i></div>
                <h3>{report.title}</h3>
                <p className="report-desc">{report.desc}</p>
                <div className="report-meta">
                  <span><i className="fas fa-calendar-alt"></i> {report.pages} pages</span>
                  <span><i className="fas fa-clock"></i> 24hrs delivery</span>
                </div>
                <div className="report-price">₹{report.price.toLocaleString('en-IN')} INR</div>
                <div className="report-actions">
                  <button className="btn-sample" onClick={() => setSampleReport(report)}>
                    <i className="fas fa-eye"></i> View Sample
                  </button>
                  <button className="btn-order" onClick={() => orderReport(report)}>
                    <i className="fas fa-file-invoice"></i> Order
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bundle Card */}
          <div className="bundle-card">
            <div className="bundle-content">
              <h3><i className="fas fa-gift"></i> Complete Life Bundle</h3>
              <p>Get all 6 life area reports at 40% off + free personalized birth chart analysis</p>
              <div className="bundle-price">
                <span className="original">₹8,994</span>
                <span className="discounted">₹5,399</span>
              </div>
              <button className="btn-bundle" onClick={orderBundle}>Order Complete Bundle</button>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Modal */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div className={`modal${sampleReport ? ' show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setSampleReport(null); }}>
        {sampleReport && (
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSampleReport(null)}>
              <i className="fas fa-times"></i>
            </button>

            <div className="sample-header">
              <i className={`fas ${sampleReport.icon}`}></i>
              <h2>{sampleReport.title} — Sample Preview</h2>
            </div>

            {/* Key highlights */}
            <div className="sample-remedies" style={{ marginBottom: '25px' }}>
              <h3><i className="fas fa-star"></i> Report Highlights</h3>
              <ul>
                {sampleReport.highlights.map((h, i) => (
                  <li key={i}><i className="fas fa-check-circle"></i> {h}</li>
                ))}
              </ul>
            </div>

            {/* Planet analysis preview */}
            <div className="sample-planets">
              <h3>Key Planetary Analysis</h3>
              <div className="planet-grid">
                {sampleReport.planets.map((p, i) => (
                  <div className={`planet-item ${p.status}`} key={i}>
                    <strong>{p.name}</strong> in {p.house}
                    <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>{p.effect}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Remedies preview */}
            <div className="sample-remedies">
              <h3><i className="fas fa-shield-heart"></i> Included Remedies</h3>
              <ul>
                {sampleReport.remedies.map((r, i) => (
                  <li key={i}><i className="fas fa-check-circle"></i> {r}</li>
                ))}
              </ul>
              <p style={{ color: '#ffa502', marginTop: '15px' }}>
                <i className="fas fa-lock"></i> 12+ more personalized remedies in full report
              </p>
            </div>

            <div className="sample-footer">
              <p>
                This is a sample preview. The full report includes personalized analysis
                based on your exact birth chart with complete remedies and timing windows.
              </p>
              <button className="btn-order" onClick={() => orderReport(sampleReport)}>
                Order Full Report — ₹{sampleReport.price.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
