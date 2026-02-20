import PageShell from '../components/PageShell';
import DateInput from '../components/form/DateInput';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useToolsEffects } from '../hooks/useToolsEffects';

export default function HoroscopePage() {
  useSharedEffects();
  useToolsEffects();

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
                    <div className="container">
                        <div className="tool-header">
                            <h1>Daily Horoscope</h1>
                            <p>Personalized daily predictions based on your moon sign and transits</p>
                        </div>
      
                        <div className="two-column">
      
                            <div className="form-card">
                                <h2>Select Your Moon Sign</h2>
      
                                <div className="horoscope-selector">
                                    <select className="sign-select" id="horoscopeSelector">
                                        <option value="aries">Aries (Mesha)</option>
                                        <option value="taurus">Taurus (Vrishabha)</option>
                                        <option value="gemini">Gemini (Mithuna)</option>
                                        <option value="cancer">Cancer (Karka)</option>
                                        <option value="leo">Leo (Simha)</option>
                                        <option value="virgo">Virgo (Kanya)</option>
                                        <option value="libra">Libra (Tula)</option>
                                        <option value="scorpio">Scorpio (Vrishchika)</option>
                                        <option value="sagittarius">Sagittarius (Dhanu)</option>
                                        <option value="capricorn">Capricorn (Makara)</option>
                                        <option value="aquarius">Aquarius (Kumbha)</option>
                                        <option value="pisces">Pisces (Meena)</option>
                                    </select>
                                </div>
      
                                <div className="form-group">
                                    <label>Your Birth Date (Optional)</label>
                                    <DateInput />
                                </div>
      
                                <button type="button" className="btn-generate">Sample Preview (Demo)</button>
                                <p className="preview-note">
                                    <i className="fas fa-info-circle"></i> Sample preview - Personalized in paid version
                                </p>
                            </div>
      
      
                            <div className="chart-card">
                                <h2>Today's Predictions</h2>
                                <div className="date-badge" style={{ background: 'rgba(123,91,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                                    <i className="fas fa-calendar-alt"></i> Friday, February 14, 2025
                                </div>
      
                                <div id="horoscopeContent">
      
                                </div>
      
                                <p className="preview-note" style={{ marginTop: '20px' }}>
                                    <i className="fas fa-lock"></i> Full daily predictions with remedial measures in paid version
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
