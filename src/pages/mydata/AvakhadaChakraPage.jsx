/**
 * AvakhadaChakraPage — Avakhada Chakra table (like AstroSage "Avkahada Chakra" tab).
 *
 * APIs: POST /v1/avakhada + POST /v1/chart/create?include_dasha=true
 * Shows: Paya, Varna, Yoni, Gana, Vasya, Nadi, Balance of Dasha,
 *        Lagna, Lagna Lord, Rasi, Rasi Lord, Nakshatra-Pada, Nakshatra Lord, Julian Day, SunSign
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';
import { getSignLord } from '../../utils/jyotish';

export default function AvakhadaChakraPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      api.post('/v1/avakhada', birthPayload),
      api.post('/v1/chart/create?include_dasha=true&include_panchang=true', birthPayload),
    ])
      .then(([avakRes, chartRes]) => {
        if (!cancelled) {
          setData({ avakhada: avakRes.avakhada || avakRes, bundle: chartRes.bundle || chartRes });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message || 'Failed to load Avakhada Chakra'); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-dharmachakra"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Avakhada Chakra data will appear here</p>
      </div>
    );
  }

  if (loading) {
    return <div className="api-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading Avakhada Chakra...</p></div>;
  }

  if (error) {
    return <div className="api-error"><i className="fas fa-exclamation-triangle"></i><p>{error}</p></div>;
  }

  if (!data) return null;

  const av = data.avakhada || {};
  const bundle = data.bundle || {};
  const meta = bundle.meta || {};
  const natal = bundle.natal || {};
  const asc = natal.ascendant || {};
  const planets = natal.planets || {};
  const moon = planets.Moon || {};
  const sun = planets.Sun || {};

  // Balance of Dasha (first dasha period)
  const dashaTree = bundle.dasha_tree || [];
  let balanceDasha = '---';
  if (dashaTree.length > 0) {
    const first = dashaTree[0];
    balanceDasha = `${first.planet || first.lord || '?'} ${first.remaining_years || ''}Y ${first.remaining_months || ''}M ${first.remaining_days || ''}D`;
  }

  const rows = [
    ['Paya (Nakshatra Based)', av.paya || '---'],
    ['Varna', av.varan || av.varna || '---'],
    ['Yoni', av.yoni || '---'],
    ['Gana', av.gana || '---'],
    ['Vasya', av.vashya || av.vasya || '---'],
    ['Nadi', av.nadi || '---'],
    ['Balance of Dasha', balanceDasha],
    ['Lagna', asc.sign_name ? `${asc.sign_name}${asc.rashi ? ` (${asc.rashi})` : ''}` : '---'],
    ['Lagna Lord', asc.sign ? getSignLord(parseInt(asc.sign, 10)) : '---'],
    ['Rasi', moon.sign_name ? `${moon.sign_name}${moon.rashi ? ` (${moon.rashi})` : ''}` : '---'],
    ['Rasi Lord', moon.sign ? getSignLord(parseInt(moon.sign, 10)) : '---'],
    ['Nakshatra-Pada', av.nakshatra ? `${av.nakshatra}-${av.pada || moon.nakshatra_pada || ''}` : (moon.nakshatra ? `${moon.nakshatra}-${moon.nakshatra_pada || ''}` : '---')],
    ['Nakshatra Lord', av.nakshatra_lord || moon.nakshatra_lord || '---'],
    ['Julian Day', meta.jd ? `${Math.round(meta.jd)}` : '---'],
    ['SunSign (Indian)', sun.sign_name ? `${sun.sign_name}${sun.rashi ? ` (${sun.rashi})` : ''}` : '---'],
  ];

  return (
    <div className="mydata-table">
      <div className="mydata-table-header">
        <i className="fas fa-dharmachakra"></i>
        <h3>Avakhada Chakra</h3>
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
