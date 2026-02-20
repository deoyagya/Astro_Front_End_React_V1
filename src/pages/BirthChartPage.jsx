import PageShell from '../components/PageShell';
import { useMemo, useState } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useToolsEffects } from '../hooks/useToolsEffects';

const chartOptions = [
  { value: 'd1', label: 'Rashi (D-1)', description: 'The fundamental birth chart representing the physical body, general health, and overall life pattern.' },
  { value: 'd2', label: 'Hora (D-2)', description: 'Focuses on wealth, financial prosperity, assets, and family lineage.' },
  { value: 'd3', label: 'Drekkana (D-3)', description: 'Analyzes siblings, courage, strength, and short travels.' },
  { value: 'd4', label: 'Chaturthamsa (D-4)', description: 'Examines fixed assets, property, residential home, and overall fortune.' },
  { value: 'd7', label: 'Saptamsa (D-7)', description: 'Relates to children, grandchildren, progeny, and creative capacity.' },
  { value: 'd9', label: 'Navamsa (D-9)', description: 'The most critical sub-chart; it reveals the strength of planets and details regarding marriage, spouse, and spiritual dharma.' },
  { value: 'd10', label: 'Dasamsa (D-10)', description: 'Focuses on career, profession, status in society, and public life.' },
  { value: 'd12', label: 'Dwadashamsa (D-12)', description: 'Provides details about parents, ancestors, and inherited traits or diseases.' },
  { value: 'd16', label: 'Shodashamsa (D-16)', description: 'Examines luxuries, vehicles, conveyances, and general happiness.' },
  { value: 'd20', label: 'Vimshamsa (D-20)', description: 'Relates to spiritual progress, religious inclinations, and devotion to deities.' },
  { value: 'd24', label: 'Chaturvimshamsa (D-24)', description: 'Focuses on education, learning, academic achievements, and knowledge.' },
  { value: 'd27', label: 'Saptavimshamsa (D-27)', description: 'Analyzes physical strength, stamina, and general vitality.' },
  { value: 'd30', label: 'Trimshamsa (D-30)', description: 'Examines misfortunes, health issues, hidden dangers, and bad luck.' },
  { value: 'd40', label: 'Khavedamsha (D-40)', description: 'Investigates auspicious and inauspicious events, often linked to maternal ancestral influences.' },
  { value: 'd45', label: 'Akshavedamsha (D-45)', description: 'Reflects on character, conduct, and finer aspects of moral ethics.' },
  { value: 'd60', label: 'Shashtyamsha (D-60)', description: 'A deeply spiritual chart representing past-life karma and the ultimate outcome of all life events.' }
];

export default function BirthChartPage() {
  const [selectedChart, setSelectedChart] = useState('');
  useSharedEffects();
  useToolsEffects();

  const selectedChartMeta = useMemo(
    () => chartOptions.find((option) => option.value === selectedChart),
    [selectedChart]
  );

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
                    <div className="container">
                        <div className="tool-header">
                            <h1>Birth Chart (Kundli)</h1>
                            <p>Enter your birth details to generate your detailed D1 chart</p>
                        </div>
      
                        <div className="two-column birth-chart-layout">
      
                            <div className="form-card">
                                <h2>Birth Details</h2>
                                <form id="birthChartForm">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" id="fullName" placeholder="Enter your full name" />
                                    </div>
      
                                    <div className="birth-form-row">
                                        <div className="form-group">
                                            <label>Date of Birth</label>
                                            <DateInput id="birthDate" />
                                        </div>

                                        <div className="form-group">
                                            <label>Time of Birth</label>
                                            <TimeSelectGroup hourId="hour" minuteId="minute" ampmId="ampm" />
                                        </div>
                                    </div>

                                    <div className="birth-form-row">
                                        <div className="form-group">
                                            <label>Place of Birth</label>
                                            <input type="text" id="birthPlace" placeholder="Enter birth city" />
                                        </div>

                                        <div className="form-group">
                                            <label>Select Chart Type</label>
                                            <select
                                              id="chartType"
                                              value={selectedChart}
                                              onChange={(e) => setSelectedChart(e.target.value)}
                                            >
                                                <option value="">Select chart type</option>
                                                {chartOptions.map((option) => (
                                                  <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
      
                                    <button type="button" className="btn-generate" id="generateChartBtn">
                                        <i className="fas fa-chart-pie"></i> Generate Chart
                                    </button>
                                    <p className="preview-note">
                                        <i className="fas fa-info-circle"></i> Full analysis available in paid report
                                    </p>
                                </form>
                            </div>
      
      
                            <div className="chart-card">
                                <h2>{selectedChartMeta ? `Your ${selectedChartMeta.label} Chart` : 'Your Chart'}</h2>
                                <p className="preview-note" style={{ marginBottom: '16px' }}>
                                    <i className="fas fa-info-circle"></i>{' '}
                                    {selectedChartMeta ? selectedChartMeta.description : 'Select a chart type to view its purpose and interpretation focus.'}
                                </p>
                                <div className="chart-placeholder" id="chartPlaceholder">
                                    <div className="chart-preview">
                                        <i className="fas fa-chart-pie"></i>
                                        <p>Enter details and click Generate</p>
                                    </div>
                                </div>
      
                                <h3 className="section-subtitle">Planetary Positions</h3>
                                <table className="planet-table" id="planetTable">
                                    <tr>
                                        <th>Planet</th>
                                        <th>Sign</th>
                                        <th>House</th>
                                        <th>Degree</th>
                                    </tr>
                                    <tr><td>Sun</td><td>Taurus</td><td>2nd</td><td>24°</td></tr>
                                    <tr><td>Moon</td><td>Libra</td><td>7th</td><td>12°</td></tr>
                                    <tr><td>Mars</td><td>Leo</td><td>5th</td><td>8°</td></tr>
                                    <tr><td>Mercury</td><td>Gemini</td><td>3rd</td><td>15°</td></tr>
                                    <tr><td>Jupiter</td><td>Pisces</td><td>12th</td><td>6°</td></tr>
                                    <tr><td>Venus</td><td>Aries</td><td>1st</td><td>19°</td></tr>
                                    <tr><td>Saturn</td><td>Capricorn</td><td>10th</td><td>3°</td></tr>
                                </table>
      
                                <p className="preview-note">
                                    <i className="fas fa-lock"></i> Full chart with interpretation available in paid report
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
