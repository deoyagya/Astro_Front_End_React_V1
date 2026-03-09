/**
 * HouseDetailPanel — Shows detailed planetary information for a clicked house.
 *
 * Free users see: planet names, sign, house number.
 * Premium users also see: exact degrees, nakshatra + pada, dignity, retro/combust badges.
 */
import {
  SIGN_NAMES, getSignLord, getNakshatra,
  getDignity, formatDegrees, getSuffix, MALEFICS,
} from '../utils/jyotish';

export default function HouseDetailPanel({
  houseNum,
  chartData,
  natalPlanets,
  ascendant,
  isPremium,
  onClose,
}) {
  if (!houseNum || !chartData) return null;

  const placements = chartData.placements || {};
  const houseData = placements[String(houseNum)] || {};
  const signNum = houseData.sign || houseNum;
  const signName = SIGN_NAMES[signNum] || `Sign ${signNum}`;
  const signLord = getSignLord(signNum);
  const planets = (houseData.planets || []).filter((p) => p !== 'Lagna');

  // Compute ascendant sign for house label
  const ascSign = ascendant?.sign ? parseInt(ascendant.sign, 10) : null;

  return (
    <div className="house-detail-panel">
      {/* Header */}
      <div className="house-detail-header">
        <div>
          <h4>
            <i className="fas fa-home" style={{ marginRight: 8 }}></i>
            House {houseNum} — {signName}
          </h4>
          <div style={{ color: '#c7cfdd', fontSize: '0.9375rem', marginTop: 4 }}>
            Lord: <span style={{ color: '#b794ff', fontWeight: 600 }}>{signLord}</span>
          </div>
        </div>
        <button className="house-detail-close" onClick={onClose} title="Close">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Planets */}
      {planets.length === 0 ? (
        <div style={{ color: '#a0a8b8', textAlign: 'center', padding: '16px 0', fontSize: '0.9rem' }}>
          <i className="fas fa-moon" style={{ marginRight: 6, opacity: 0.5 }}></i>
          No planets in this house
        </div>
      ) : (
        planets.map((pName) => {
          const pData = natalPlanets?.[pName] || {};
          const pSign = pData.sign ? parseInt(pData.sign, 10) : null;
          const pSignName = pSign ? (SIGN_NAMES[pSign] || `Sign ${pSign}`) : signName;
          const lon = pData.longitude != null ? pData.longitude : pData.lon;
          const degInSign = lon != null ? (lon % 30) : null;
          const isRetro = pData.retrograde || pData.is_retro || false;
          const isCombust = pData.is_combust || pData.combust || false;
          const dignity = pSign ? getDignity(pName, pSign) : 'neutral';
          const nakData = lon != null ? getNakshatra(lon) : null;

          return (
            <div className="planet-detail-card" key={pName}>
              {/* Planet name */}
              <div className="planet-detail-name">
                <span style={{ color: MALEFICS.has(pName) ? '#ff6b6b' : '#e0e0e0' }}>
                  {pName}
                </span>
                {isRetro && <span className="dignity-badge badge-retro" style={{ marginLeft: 8 }}>R</span>}
                {isCombust && <span className="dignity-badge badge-combust" style={{ marginLeft: 4 }}>Combust</span>}
                {isPremium && dignity !== 'neutral' && (
                  <span className={`dignity-badge dignity-${dignity}`} style={{ marginLeft: 8 }}>
                    {dignity === 'exalted' ? 'Exalted' : dignity === 'own' ? 'Own Sign' : 'Debilitated'}
                  </span>
                )}
              </div>

              {/* Basic info (free) */}
              <div className="planet-detail-row">
                <span>Sign: {pSignName}</span>
                <span>House: {houseNum}{getSuffix(houseNum)}</span>
              </div>

              {/* Premium details */}
              {isPremium && (
                <div className="planet-detail-row" style={{ marginTop: 4 }}>
                  {degInSign != null && <span>Degree: {formatDegrees(degInSign)}</span>}
                  {nakData && <span>Nakshatra: {nakData.name} (Pada {nakData.pada})</span>}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Premium lock banner for free users */}
      {!isPremium && planets.length > 0 && (
        <div className="premium-lock">
          <i className="fas fa-lock" style={{ marginRight: 6 }}></i>
          Upgrade to Premium for degrees, nakshatras &amp; detailed analysis
          {' — '}
          <a href="/reports">View Plans</a>
        </div>
      )}
    </div>
  );
}
