/**
 * ReportTemplate — Shared component for all report pages.
 *
 * Handles:
 * - Birth details form (name, date, time, place)
 * - API call to POST /v1/predict/report
 * - Loading/error states
 * - Rendering prediction cards + narrative
 * - "Order Full Report" CTA if not purchased
 *
 * Props:
 *   title         — Report title (e.g. "Career & Finance Report")
 *   subtitle      — Description text
 *   subdomainId   — Subdomain ID for the predict/report API
 *   icon          — FontAwesome icon class (e.g. "fa-briefcase")
 *   badgeText     — Badge text (e.g. "25+ Pages")
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from './form/DateInput';
import TimeSelectGroup from './form/TimeSelectGroup';
import PlaceAutocomplete from './PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour } from '../hooks/useBirthData';

export default function ReportTemplate({
  title,
  subtitle,
  subdomainId,
  icon = 'fa-file-alt',
  badgeText = '25+ Pages',
}) {
  const navigate = useNavigate();

  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
  } = useBirthData({ reportType: 'report' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleGenerate = useCallback(async () => {
    setError('');

    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    if (!birthDate) { setError('Please select your date of birth.'); return; }
    if (!birthPlace) { setError('Please select a birth place from the dropdown.'); return; }

    const tob = to24Hour(hour, minute, ampm);
    const payload = {
      name: fullName.trim(),
      dob: birthDate,
      tob,
      place_of_birth: birthPlace.name,
      ...(birthPlace.lat != null && birthPlace.lon != null && birthPlace.timezone
        ? { lat: birthPlace.lat, lon: birthPlace.lon, tz_id: birthPlace.timezone }
        : {}),
    };

    const params = new URLSearchParams({
      subdomain_id: String(subdomainId),
      interpretation_mode: 'static',
      language: 'en',
      dasha_depth: '3',
      search_start: '2026-01-01',
      search_end: '2028-12-31',
      top_n: '5',
    });

    setLoading(true);
    try {
      const data = await api.post(`/v1/predict/report?${params}`, payload);
      setReportData(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }, [fullName, birthDate, hour, minute, ampm, birthPlace, subdomainId, saveBirthData]);

  const prediction = reportData?.prediction || {};
  const cards = prediction.cards || [];
  const score = prediction.normalized_score || prediction.score;
  const currentDasha = prediction.current_dasha || {};
  const timingWindows = prediction.timing_windows || [];

  return (
    <div className="report-page">
      <div className="container">
        {/* Header */}
        <div className="report-header">
          <h1><i className={`fas ${icon}`}></i> {title}</h1>
          <div className="subtitle">{subtitle}</div>
          <span className="badge">{badgeText}</span>
        </div>

        {/* Birth Details Form */}
        <div className="chapter" style={{ marginBottom: 30 }}>
          <h2>Enter Your Birth Details</h2>
          <p style={{ color: '#b0b7c3', marginBottom: 20 }}>
            Provide accurate birth details for a personalized report based on your Vedic chart.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label style={{ color: '#b0b7c3', display: 'block', marginBottom: 8 }}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(40,44,60,0.9)', border: '1px solid #3a3f50', borderRadius: 10, color: '#e0e0e0', fontSize: '1rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#b0b7c3', display: 'block', marginBottom: 8 }}>Date of Birth</label>
              <DateInput
                id={`report-dob-${subdomainId}`}
                value={birthDate}
                onChange={setBirthDate}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(40,44,60,0.9)', border: '1px solid #3a3f50', borderRadius: 10, color: '#e0e0e0', fontSize: '1rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#b0b7c3', display: 'block', marginBottom: 8 }}>Time of Birth</label>
              <TimeSelectGroup
                hourId={`report-hour-${subdomainId}`}
                minuteId={`report-minute-${subdomainId}`}
                ampmId={`report-ampm-${subdomainId}`}
                onHourChange={setHour}
                onMinuteChange={setMinute}
                onAmpmChange={setAmpm}
                hourValue={hour}
                minuteValue={minute}
                ampmValue={ampm}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#b0b7c3', display: 'block', marginBottom: 8 }}>Place of Birth</label>
              <PlaceAutocomplete
                id={`report-place-${subdomainId}`}
                placeholder="Enter birth city"
                value={birthPlace?.name || ''}
                onSelect={setBirthPlace}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, padding: 15, color: '#ff4757', textAlign: 'center', marginTop: 15 }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              className="btn"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '14px 40px',
                background: loading ? '#555' : 'linear-gradient(90deg, #7b5bff, #9d7bff)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Generating Report...</>
              ) : (
                <><i className={`fas ${icon}`}></i> Generate Preview Report</>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9d7bff' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', marginBottom: 20, display: 'block' }}></i>
            <p style={{ color: '#b0b7c3', fontSize: '1.1rem' }}>Analyzing your Vedic chart and computing predictions...</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 8 }}>This may take a few seconds</p>
          </div>
        )}

        {/* Report Content */}
        {reportData && !loading && (
          <>
            {/* Executive Summary */}
            <div className="executive-summary">
              <h2>Report Summary</h2>
              {score != null && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <div style={{
                    display: 'inline-block',
                    width: 100, height: 100,
                    borderRadius: '50%',
                    background: `conic-gradient(${score >= 60 ? '#2ed573' : score >= 40 ? '#ffa502' : '#ff4757'} ${score * 3.6}deg, #2a2f3e ${score * 3.6}deg)`,
                    lineHeight: '100px',
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                      background: '#0a0d14', width: 76, height: 76, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', fontWeight: 700, color: '#fff',
                    }}>
                      {Math.round(score)}
                    </span>
                  </div>
                  <p style={{ color: '#b0b7c3', marginTop: 8 }}>Overall Score (out of 100)</p>
                </div>
              )}

              {currentDasha.mahadasha && (
                <p><strong>Current Phase:</strong> {currentDasha.mahadasha} Mahadasha
                  {currentDasha.antardasha && ` / ${currentDasha.antardasha} Antardasha`}
                </p>
              )}

              {cards[0]?.headline && (
                <p style={{ marginTop: 10 }}><strong>{cards[0].headline}</strong></p>
              )}
              {cards[0]?.narrative && (
                <p style={{ marginTop: 8 }}>{cards[0].narrative}</p>
              )}
            </div>

            {/* Prediction Cards */}
            {cards.length > 1 && (
              <div className="chapter">
                <h2>Detailed Analysis</h2>
                {cards.slice(1).map((card, idx) => (
                  <div key={idx} style={{ background: 'rgba(40,44,60,0.6)', padding: 20, borderRadius: 12, marginBottom: 15 }}>
                    {card.headline && (
                      <h3 style={{ color: '#9d7bff', marginBottom: 10 }}>
                        <i className="fas fa-star-half-alt" style={{ marginRight: 8 }}></i>
                        {card.headline}
                      </h3>
                    )}
                    {card.narrative && <p>{card.narrative}</p>}
                    {card.score != null && (
                      <p style={{ color: '#b0b7c3', fontSize: '0.9rem', marginTop: 8 }}>
                        Sub-score: <strong style={{ color: card.score >= 60 ? '#2ed573' : '#ffa502' }}>{Math.round(card.score)}/100</strong>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timing Windows */}
            {timingWindows.length > 0 && (
              <div className="chapter">
                <h2>Predicted Timing Windows</h2>
                <div className="timeline">
                  {timingWindows.map((tw, idx) => (
                    <div key={idx} className={`timeline-item ${idx === 0 ? 'current' : ''}`}>
                      <div className="period">
                        {tw.start_date || tw.start || '—'} to {tw.end_date || tw.end || '—'}
                      </div>
                      <h4>{tw.label || tw.description || `Window ${idx + 1}`}</h4>
                      {tw.score != null && (
                        <span className={`badge ${tw.score >= 60 ? 'success' : tw.score >= 40 ? 'warning' : ''}`}>
                          Score: {Math.round(tw.score)}
                        </span>
                      )}
                      {tw.narrative && <p style={{ marginTop: 8 }}>{tw.narrative}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/order')}
                style={{
                  padding: '14px 40px',
                  background: 'transparent',
                  border: '2px solid #7b5bff',
                  borderRadius: 10,
                  color: '#9d7bff',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                <i className="fas fa-shopping-cart"></i> Order Full Detailed Report
              </button>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 10 }}>
                Full AI-powered report with in-depth analysis, remedies, and timing predictions
              </p>
            </div>
          </>
        )}

        {/* No data yet — show placeholder */}
        {!reportData && !loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#b0b7c3' }}>
            <i className={`fas ${icon}`} style={{ fontSize: '3rem', color: '#7b5bff', marginBottom: 15, display: 'block' }}></i>
            <p>Enter your birth details above and click &ldquo;Generate Preview Report&rdquo; to see your personalized analysis.</p>
            <p style={{ color: '#666', marginTop: 8 }}>
              Full reports include AI-generated narratives, timing predictions, and Vedic remedies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
