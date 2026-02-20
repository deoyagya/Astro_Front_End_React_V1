import PageShell from '../components/PageShell';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useToolsEffects } from '../hooks/useToolsEffects';

export default function CompatibilityPage() {
  const navigate = useNavigate();
  useSharedEffects();
  useToolsEffects();

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
                    <div className="container">
                        <div className="tool-header">
                            <h1>Compatibility (Kundli Milan)</h1>
                            <p>Check relationship compatibility with Ashtakoot and Dashtakoot matching</p>
                        </div>
      
                        <div className="two-column">
      
                            <div className="form-card">
                                <h2>Person A Details</h2>
                                <form id="compatibilityForm">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" placeholder="Enter name" />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <DateInput />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Time of Birth</label>
                                        <TimeSelectGroup />
                                    </div>
                                </form>
      
                                <h2 style={{ marginTop: '30px' }}>Person B Details</h2>
                                <form>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" placeholder="Enter name" />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <DateInput />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Time of Birth</label>
                                        <TimeSelectGroup />
                                    </div>
                                </form>
      
                                <button type="button" className="btn-generate">Sample Preview (Demo)</button>
                                <p className="preview-note">
                                    <i className="fas fa-info-circle"></i> Sample preview - Full calculation in paid version
                                </p>
                            </div>
      
      
                            <div className="chart-card">
                                <h2>Compatibility Score</h2>
      
                                <div className="compatibility-score">
                                    <div className="score-circle">
                                        <span>26/36</span>
                                    </div>
                                    <p style={{ color: '#2ed573', marginTop: '10px' }}>72% Match - Good Compatibility</p>
                                </div>
      
                                <h3 className="section-subtitle">Guna Milan</h3>
                                <div className="guna-grid" id="gunaGrid">
      
                                </div>
      
                                <div id="manglikAnalysis"></div>

                                <button
                                  type="button"
                                  className="btn-generate"
                                  style={{ marginTop: '20px' }}
                                  onClick={() => navigate('/order')}
                                >
                                  <i className="fas fa-shopping-cart"></i> Order Detailed Compatibility Report
                                </button>
      
                                <p className="preview-note" style={{ marginTop: '20px' }}>
                                    <i className="fas fa-lock"></i> Full compatibility report with detailed analysis in paid version
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
