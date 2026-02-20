import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function EducationReportPage() {
  useSharedEffects();

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
                <div className="report-header">
                    <h1>Education & Intelligence Report</h1>
                    <div className="subtitle">Learning Abilities, Academic Success & Intellectual Strengths</div>
                    <span className="badge">22+ Pages</span>
                </div>
        
                <div className="executive-summary">
                    <h2>Executive Summary</h2>
                    <p><strong>Current Phase:</strong> Mercury-Jupiter Conjunction</p>
                    <p>Your 5th house is strong, indicating excellent academic potential. Current Mercury retrograde affects concentration until May 2024. Best for competitive exams: 2025-2026.</p>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="label">Lucky Numbers</span><span className="value">5, 14, 23</span></div>
                        <div className="summary-item"><span className="label">Lucky Colors</span><span className="value">Green, Yellow, Light Blue</span></div>
                        <div className="summary-item"><span className="label">Favorable Directions</span><span className="value">East, North-East</span></div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 1: 5th House - Intelligence & Education</h2>
                    <h3>Lord: Jupiter in Pisces (Exalted)</h3>
                    <p>Your intelligence is philosophical, intuitive, and deep. You learn best through stories, metaphors, and spiritual contexts.</p>
                    <h4>Learning Style</h4>
                    <ul>
                        <li>Visual: 85%</li>
                        <li>Auditory: 60%</li>
                        <li>Kinesthetic: 45%</li>
                        <li>Reading/Writing: 70%</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 2: Mercury - The Intelligence Planet</h2>
                    <h3>Mercury in Gemini (Own House)</h3>
                    <p>Makes you naturally intelligent, quick-witted, and excellent at communication.</p>
                    <h4>Intellectual Strengths:</h4>
                    <ul>
                        <li>Mathematics: ⭐⭐⭐⭐</li>
                        <li>Languages: ⭐⭐⭐⭐⭐</li>
                        <li>Science: ⭐⭐⭐</li>
                        <li>Arts: ⭐⭐⭐⭐</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 3: Exam Success Predictions</h2>
                    <table>
                        <tr><th>Exam Type</th><th>Probability</th><th>Tips</th></tr>
                        <tr><td>School/College Exams</td><td>92%</td><td>Use green pen for answer sheets</td></tr>
                        <tr><td>Competitive Exams (UPSC, Banking)</td><td>67%</td><td>Start preparation in Mercury mahadasha (2027+)</td></tr>
                        <tr><td>Entrance Exams (Engineering, Medical)</td><td>43%</td><td>Consider alternative paths</td></tr>
                        <tr><td>Foreign Exams (IELTS, TOEFL, GRE)</td><td>88%</td><td>Take exam on Thursday mornings</td></tr>
                    </table>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 4: Subject Selection Guidance</h2>
                    <div className="career-list">
                        <div className="career-item high"><strong>Languages & Literature</strong> 96%</div>
                        <div className="career-item high"><strong>Philosophy & Theology</strong> 94%</div>
                        <div className="career-item medium"><strong>Law & Political Science</strong> 87%</div>
                        <div className="career-item medium"><strong>Psychology & Counseling</strong> 85%</div>
                        <div className="career-item low"><strong>Engineering</strong> 45%</div>
                    </div>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 5: Concentration & Memory Techniques</h2>
                    <ul>
                        <li>Chant "Om Bum Budhaye Namah" 108 times before study</li>
                        <li>Study during Mercury hours (6-8 AM)</li>
                        <li>Eat almonds and drink turmeric milk</li>
                        <li>Face East while studying</li>
                        <li>Keep Tulsi plant on study desk</li>
                    </ul>
                </div>
        
                <div className="chapter">
                    <h2>Chapter 6: Saraswati Sadhana</h2>
                    <p>For academic success, perform Saraswati Puja on Vasant Panchami. Daily chant:</p>
                    <p className="sanskrit" style={{ fontSize: '1.2rem' }}>ॐ ऐं सरस्वत्यै नमः॥</p>
                    <p>108 times before exams.</p>
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
