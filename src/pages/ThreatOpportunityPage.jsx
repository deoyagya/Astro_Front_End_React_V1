import { useEffect, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { useBirthData } from '../hooks/useBirthData';
import { MyDataProvider, useMyData } from '../context/MyDataContext';
import { api } from '../api/client';
import TemporalForecastPage from './mydata/TemporalForecastPage';
import '../styles/mydata.css';

function ThreatOpportunityInner() {
  const bd = useBirthData({ reportType: 'temporal_forecast' });
  const { loadBirthData, clearData, setChartBundle } = useMyData();
  const [savedCharts, setSavedCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState('');
  const [chartLoading, setChartLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const fetchRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/v1/charts/saved?limit=50')
      .then((res) => {
        if (!cancelled) setSavedCharts(res.charts || res || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleChartSelect = (chartId) => {
    setSelectedChartId(chartId);
    clearData();
    if (!chartId) return;

    const chart = savedCharts.find((entry) => entry.id === chartId);
    if (!chart) return;

    const bdData = chart.birth_data || {};
    bd.applyBirthData({
      name: bdData.name || '',
      dob: bdData.dob || '',
      tob: bdData.tob || '',
      place_of_birth: bdData.place_of_birth || '',
      lat: bdData.lat,
      lon: bdData.lon,
      tz_id: bdData.tz_id || bdData.timezone || '',
      gender: bdData.gender || 'male',
    });
  };

  const fetchChartData = async (payload) => {
    const thisRequest = ++fetchRequestId.current;
    setChartLoading(true);
    try {
      const data = await api.post(
        '/v1/chart/create?include_vargas=true&include_dasha=true&include_panchang=true&include_yogas=true',
        payload,
      );
      if (thisRequest !== fetchRequestId.current) return;
      setChartBundle(data);
    } catch (err) {
      setFormError(err?.message || 'Failed to load chart data.');
    } finally {
      if (thisRequest === fetchRequestId.current) {
        setChartLoading(false);
      }
    }
  };

  const handleLoad = () => {
    setFormError('');
    const err = bd.validate();
    if (err) {
      setFormError(err);
      return;
    }
    const payload = bd.buildPayload();
    loadBirthData(payload);
    bd.saveBirthData();
    fetchChartData(payload);
  };

  return (
    <PageShell activeNav="kundli">
      <div className="mydata-page">
        <div className="container">
          <div className="mydata-header">
            <h1><i className="fas fa-hourglass-half"></i> Threat and Opportunity</h1>
            <p>Dedicated temporal forecast workspace with saved-chart loading and premium delivery</p>
          </div>

          <div className="mydata-birth-form">
            <div className="form-group">
              <label htmlFor="to-chart-select">Saved Chart</label>
              <select
                id="to-chart-select"
                value={selectedChartId}
                onChange={(e) => handleChartSelect(e.target.value)}
                style={{ minWidth: 240 }}
              >
                <option value="">-- Select a chart --</option>
                {savedCharts.map((chart) => {
                  const info = chart.birth_data || {};
                  const name = info.name || 'Unnamed';
                  const dob = info.dob || '';
                  const place = info.place_of_birth || '';
                  const label = dob || place
                    ? `${name} — ${dob}${place ? ' | ' + place : ''}`
                    : name;
                  return (
                    <option key={chart.id} value={chart.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <button className="btn-load" onClick={handleLoad} disabled={!bd.loaded || chartLoading}>
              {chartLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Loading...</>
              ) : (
                <><i className="fas fa-bolt"></i> Load Forecast</>
              )}
            </button>
          </div>

          {formError && <p className="mydata-form-error">{formError}</p>}

          <div className="mydata-content-area">
            <TemporalForecastPage />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function ThreatOpportunityPage() {
  return (
    <MyDataProvider>
      <ThreatOpportunityInner />
    </MyDataProvider>
  );
}
