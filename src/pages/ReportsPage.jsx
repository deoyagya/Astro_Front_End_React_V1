import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useReportsEffects } from '../hooks/useReportsEffects';

export default function ReportsPage() {
  useSharedEffects();
  useReportsEffects();

  return (
    <PageShell activeNav="reports">
                <section className="reports-section">
                    <div className="container">
                        <div className="section-header">
                            <h2>Life Area Reports</h2>
                            <p>Choose a detailed astrological report tailored to your specific life questions. Each report includes planetary analysis, dasha timing, and personalized recommendations.</p>
                            <p className="sample-note"><i className="fas fa-eye"></i> Click "View Sample" to see a preview of what each report reveals</p>
                        </div>
      
                        <div className="reports-grid" id="reportsGrid">
      
                        </div>
      
      
                        <div className="bundle-card">
                            <div className="bundle-content">
                                <h3><i className="fas fa-gift"></i> Complete Life Bundle</h3>
                                <p>Get all 6 life area reports at 40% off + free personalized birth chart analysis</p>
                                <div className="bundle-price">
                                    <span className="original">₹8,994</span>
                                    <span className="discounted">₹5,399</span>
                                </div>
                                <button className="btn-bundle" id="bundleOrderBtn">Order Complete Bundle</button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="modal" id="sampleModal">
                    <div className="modal-content" id="modalContent"></div>
                </div>
    </PageShell>
  );
}
