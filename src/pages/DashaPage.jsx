import PageShell from '../components/PageShell';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useToolsEffects } from '../hooks/useToolsEffects';

export default function DashaPage() {
  useSharedEffects();
  useToolsEffects();

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
                    <div className="container">
                        <div className="tool-header">
                            <h1>Dasha Calculator</h1>
                            <p>Understand your current planetary periods and future timeline predictions</p>
                        </div>
      
                        <div className="two-column">
      
                            <div className="form-card">
                                <h2>Birth Details</h2>
                                <form>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" placeholder="Enter your name" />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <DateInput />
                                    </div>
      
                                    <div className="form-group">
                                        <label>Time of Birth</label>
                                        <TimeSelectGroup />
                                    </div>
      
                                    <button type="button" className="btn-generate">Sample Preview (Demo)</button>
                                    <p className="preview-note">
                                        <i className="fas fa-info-circle"></i> Sample preview - Full calculation in paid version
                                    </p>
                                </form>
                            </div>
      
      
                            <div className="chart-card">
                                <h2>Your Dasha Timeline</h2>
                                <div className="dasha-timeline" id="dashaTimeline">
      
                                </div>
      
                                <h3 className="section-subtitle">Antardasha Details</h3>
                                <div style={{ background: 'rgba(40,44,60,0.6)', padding: '15px', borderRadius: '8px' }}>
                                    <p style={{ color: '#b0b7c3' }}>Current Antardasha: <strong style={{ color: '#fff' }}>Rahu (2024-2026)</strong></p>
                                    <p style={{ color: '#b0b7c3', marginTop: '10px' }}>Focus areas: Career transformation, foreign connections, unexpected gains</p>
                                </div>
      
                                <p className="preview-note" style={{ marginTop: '20px' }}>
                                    <i className="fas fa-lock"></i> Full dasha analysis with 30+ years prediction in paid report
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
