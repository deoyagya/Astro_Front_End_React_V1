/**
 * MyDetailsPage — Person Details table (like AstroSage "Person Details" tab).
 *
 * API: POST /v1/chart/create?include_panchang=true
 * Shows: Sex, DOB, TOB, Day, Ishtkaal, Place, Timezone, Lat, Long, LMT, GMT, Tithi, Hindu Week Day
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';
import { getSignLord } from '../../utils/jyotish';

/**
 * Safely convert any value to a renderable string.
 * Backend panchang fields can return objects instead of strings.
 */
function safeStr(val, fallback = '---') {
  if (val == null) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number') return `${val}`;
  if (typeof val === 'object') {
    // Try common name keys used by panchang service
    return val.weekday_name || val.tithi_name || val.name
      || val.sidereal_time_str || val.lmt_str
      || val.str || val.value || fallback;
  }
  return fallback;
}

export default function MyDetailsPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    api.post('/v1/chart/create?include_panchang=true', birthPayload)
      .then((res) => {
        if (!cancelled) {
          setData(res.bundle || res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load person details');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-id-card"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your person details will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading person details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const meta = data.meta || {};
  const panchang = data.panchang || {};
  const natal = data.natal || {};
  const asc = natal.ascendant || {};
  const reqData = data.request || {};  // Backend echoes resolved lat/lon/tz_id in request

  // Build display rows — use safeStr() for all panchang fields
  // (backend returns objects like {weekday_name, tithi_name, lmt_str, sidereal_time_str})
  const rows = [
    ['Sex', meta.gender ? meta.gender.charAt(0).toUpperCase() + meta.gender.slice(1) : '---'],
    ['Date of Birth', birthPayload.dob || '---'],
    ['Time of Birth', birthPayload.tob || '---'],
    ['Day of Birth', safeStr(panchang.vara)],
    ['Ishtkaal', safeStr(panchang.ghati) !== '---' ? safeStr(panchang.ghati) : safeStr(panchang.sidereal_time)],
    ['Place of Birth', birthPayload.place_of_birth || '---'],
    ['Time Zone', birthPayload.tz_id || reqData.tz_id || '---'],
    ['Latitude', birthPayload.lat != null ? `${birthPayload.lat}` : (reqData.lat != null ? `${reqData.lat}` : '---')],
    ['Longitude', birthPayload.lon != null ? `${birthPayload.lon}` : (reqData.lon != null ? `${reqData.lon}` : '---')],
    ['Local Mean Time (LMT)', safeStr(panchang.lmt) !== '---' ? safeStr(panchang.lmt) : safeStr(panchang.sunrise_local)],
    ['GMT at Birth', safeStr(panchang.gmt) !== '---' ? safeStr(panchang.gmt) : safeStr(meta.generated_at_utc)],
    ['Tithi', safeStr(panchang.tithi)],
    ['Hindu Week Day', safeStr(panchang.vara)],
    ['Lagna', asc.sign_name || '---'],
    ['Lagna Lord', asc.sign ? getSignLord(parseInt(asc.sign, 10)) : '---'],
    ['Ayanamsa', meta.ayanamsa ? `${meta.ayanamsa_system || 'Lahiri'} (${Number(meta.ayanamsa).toFixed(4)})` : '---'],
    ['Julian Day', meta.jd ? `${meta.jd}` : '---'],
  ];

  return (
    <div className="mydata-table">
      <div className="mydata-table-header">
        <i className="fas fa-id-card"></i>
        <h3>Person Details</h3>
      </div>
      {rows.map(([label, value], idx) => (
        <div key={idx} className="mydata-row">
          <span className="mydata-row-label">{label}</span>
          <span className="mydata-row-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
