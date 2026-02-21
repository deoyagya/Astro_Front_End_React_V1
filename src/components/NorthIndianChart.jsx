/**
 * NorthIndianChart — SVG diamond-style Vedic chart.
 *
 * Site purple/dark theme (#9d7bff / #7b5bff / #2a2f3e).
 * Large readable planets with INLINE degree superscripts.
 * Interactive: hover glow, click highlight, cursor pointer.
 * 600×600 SVG viewport, scales to 100% container width.
 */
import { useState } from 'react';
import {
  SIGN_SHORT, MALEFICS, PLANET_ABBR,
  toDegreeStr, getPlanetStatusSuffix, getDignity, isVargottama,
} from '../utils/jyotish';

/* ===== THEME COLORS (site palette) ===== */
const LINE     = '#7b5bff';   // purple lines
const LINE_DIM = '#5a42cc';   // slightly dimmer for inner
const ACCENT   = '#9d7bff';   // labels, sign names
const BG       = '#0d0f1a';   // chart bg (darker than page)
const HOVER_BG = 'rgba(123,91,255,0.12)';
const SEL_BG   = 'rgba(123,91,255,0.22)';
const LAGNA_BG = 'rgba(123,91,255,0.06)';
const MALEFIC  = '#ff6b6b';
const BENEFIC  = '#2ed573';
const DEG_CLR  = '#b0b7c3'; // muted gray for degrees

/* ===== GEOMETRY — 600×600 ===== */
const S = 600;
const M = S / 2; // 300 midpoint

/*
 * North Indian diamond chart line structure:
 *
 *   (0,0) ——————— (M,0) ——————— (S,0)
 *     |\          / \          /|
 *     | \   2    /   \   12  / |
 *     |  \      / 1   \    /   |
 *     | 3 \    / (ASC)  \ / 11 |
 *     |    (M/2,M/2)—(3M/2,M/2)
 *     |   / \            / \   |
 *     |  / 4 \          /10 \  |
 *   (0,M)     (M,M)   (S,M)
 *     |  \ 5  /          \ 9/ |
 *     |   \ /            \ /  |
 *     |  (M/2,3M/2)—(3M/2,3M/2)
 *     | 6 /    \ 7     /  \ 8 |
 *     |  /      \      /   |
 *     | /        \    /    |
 *   (0,S) ——————(M,S)——————(S,S)
 */

/* Clickable polygon paths for each house */
const PATHS = {
  1:  `M${M/2},${M/2} L${M},0 L${M*3/2},${M/2} L${M},${M} Z`,
  2:  `M0,0 L${M},0 L${M/2},${M/2} Z`,
  3:  `M0,0 L${M/2},${M/2} L0,${M} Z`,
  4:  `M0,${M} L${M/2},${M/2} L${M},${M} L${M/2},${M*3/2} Z`,
  5:  `M0,${M} L0,${S} L${M/2},${M*3/2} Z`,
  6:  `M0,${S} L${M/2},${M*3/2} L${M},${S} Z`,
  7:  `M${M/2},${M*3/2} L${M},${M} L${M*3/2},${M*3/2} L${M},${S} Z`,
  8:  `M${M},${S} L${M*3/2},${M*3/2} L${S},${S} Z`,
  9:  `M${M*3/2},${M*3/2} L${S},${M} L${S},${S} Z`,
  10: `M${M},${M} L${M*3/2},${M/2} L${S},${M} L${M*3/2},${M*3/2} Z`,
  11: `M${M*3/2},${M/2} L${S},0 L${S},${M} Z`,
  12: `M${M},0 L${S},0 L${M*3/2},${M/2} Z`,
};

/* Planet text centroids */
const CENTROIDS = {
  1:  [M, 150],     2:  [148, 58],   3:  [58, 148],
  4:  [148, M],     5:  [58, 452],   6:  [148, 542],
  7:  [M, 450],     8:  [452, 542],  9:  [542, 452],
  10: [452, M],     11: [542, 148],  12: [452, 58],
};

/* House number positions — tucked into quiet corners */
const HNUM_POS = {
  1:  [M, 60],       2:  [82, 20],    3:  [20, 82],
  4:  [82, M],       5:  [20, 518],   6:  [82, 580],
  7:  [M, 540],      8:  [518, 580],  9:  [580, 518],
  10: [518, M],      11: [580, 82],   12: [518, 20],
};

const FONT = "'Segoe UI', Arial, sans-serif";
const MONO = "'Segoe UI', 'Courier New', monospace";

/**
 * Build planet display info for a single planet.
 * Returns { label, isMalefic } where label = "Su²⁰*↑"
 */
function buildLabel(pName, chartData, d9Vargas) {
  const placements = chartData.placements || {};
  let pInfo = null, signNum = null;
  for (const [, hData] of Object.entries(placements)) {
    if ((hData.planets || []).includes(pName)) {
      signNum = hData.sign;
      pInfo = hData.planetData?.[pName] || null;
      break;
    }
  }

  const degree   = pInfo?.degree ?? null;
  const isRetro  = pInfo?.isRetro || false;
  const isCombust = pInfo?.isCombust || false;
  const dignity  = signNum ? getDignity(pName, signNum) : 'neutral';

  let isVarg = false;
  if (d9Vargas && signNum) {
    const d9 = d9Vargas[pName];
    if (d9?.sign) isVarg = isVargottama(signNum, d9.sign);
  }

  const abbr   = PLANET_ABBR[pName] || pName.slice(0, 2);
  const degStr = degree != null ? toDegreeStr(degree) : '';
  const suffix = getPlanetStatusSuffix({ isRetro, isCombust, isVargottama: isVarg, dignity });

  return {
    label: `${abbr}${degStr}${suffix}`,
    isMalefic: MALEFICS.has(pName),
  };
}

export default function NorthIndianChart({
  chartData,
  chartLabel = 'D1 Chart',
  onHouseClick,
  selectedHouse,
  d9Vargas = null,
}) {
  const [hoveredHouse, setHoveredHouse] = useState(null);

  if (!chartData) return null;
  const placements = chartData.placements || {};

  const legendH = 60;

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${S} ${S + legendH}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* ===== BACKGROUND ===== */}
        <rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* ===== STRUCTURAL LINES ===== */}
        {/* Outer border */}
        <rect x={1} y={1} width={S - 2} height={S - 2}
          fill="none" stroke={LINE} strokeWidth={3} />

        {/* Two full diagonals (corner to corner of outer square) */}
        <line x1={0} y1={0} x2={S} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />
        <line x1={S} y1={0} x2={0} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />

        {/* Outer diamond: midpoint-to-midpoint */}
        <line x1={M} y1={0} x2={0}   y2={M} stroke={LINE} strokeWidth={2.5} />
        <line x1={M} y1={0} x2={S}   y2={M} stroke={LINE} strokeWidth={2.5} />
        <line x1={0} y1={M} x2={M}   y2={S} stroke={LINE} strokeWidth={2.5} />
        <line x1={S} y1={M} x2={M}   y2={S} stroke={LINE} strokeWidth={2.5} />

        {/* ===== INTERACTIVE HOUSE POLYGONS ===== */}
        {Object.entries(PATHS).map(([hStr, pathD]) => {
          const h = parseInt(hStr, 10);
          const isSel = selectedHouse === h;
          const isHov = hoveredHouse === h;
          const isAsc = h === 1;

          let fill = 'transparent';
          if (isSel) fill = SEL_BG;
          else if (isHov) fill = HOVER_BG;
          else if (isAsc) fill = LAGNA_BG;

          return (
            <path
              key={h}
              d={pathD}
              fill={fill}
              stroke="none"
              style={{ cursor: 'pointer' }}
              onClick={() => onHouseClick?.(h)}
              onMouseEnter={() => setHoveredHouse(h)}
              onMouseLeave={() => setHoveredHouse(null)}
            />
          );
        })}

        {/* ===== RASHI LABELS — "Cap(8)" format ===== */}
        {Object.entries(HNUM_POS).map(([hStr, [hx, hy]]) => {
          const h = parseInt(hStr, 10);
          const sign = placements[String(h)]?.sign || h;
          return (
            <text key={`r-${h}`} x={hx} y={hy}
              textAnchor="middle" dominantBaseline="central"
              fill="#e0e0e0" fontSize={14} fontWeight="600"
              fontFamily={FONT} style={{ pointerEvents: 'none' }}>
              {SIGN_SHORT[sign]}({sign})
            </text>
          );
        })}

        {/* ===== PLANETS — inline "Su²⁰*↑" format ===== */}
        {Object.entries(CENTROIDS).map(([hStr, [cx, cy]]) => {
          const h = parseInt(hStr, 10);
          const hData = placements[String(h)] || {};
          const pList = (hData.planets || []).filter(p => p !== 'Lagna');
          if (!pList.length) return null;

          const lineH = 26;
          const startY = cy - ((pList.length - 1) * lineH) / 2;

          return pList.map((pName, idx) => {
            const { label, isMalefic } = buildLabel(pName, chartData, d9Vargas);
            return (
              <text
                key={`p-${h}-${pName}`}
                x={cx} y={startY + idx * lineH}
                textAnchor="middle" dominantBaseline="central"
                fill={isMalefic ? MALEFIC : BENEFIC}
                fontSize={18} fontWeight="800" fontFamily={MONO}
                style={{ pointerEvents: 'none' }}>
                {label}
              </text>
            );
          });
        })}

        {/* ===== ASC marker ===== */}
        <text x={M} y={106} textAnchor="middle" fill={ACCENT}
          fontSize={12} fontWeight="800" fontFamily={FONT}
          style={{ pointerEvents: 'none' }}>
          ASC
        </text>

        {/* ===== Center label ===== */}
        <text x={M} y={M - 8} textAnchor="middle" fill={ACCENT}
          fontSize={13} fontWeight="600" fontFamily={FONT}
          opacity={0.5} style={{ pointerEvents: 'none' }}>
          {chartLabel}
        </text>

        {/* ===== LEGEND BAR — site dark theme ===== */}
        <rect x={0} y={S} width={S} height={legendH}
          fill="rgba(30,33,48,0.95)" />
        <line x1={0} y1={S} x2={S} y2={S} stroke={LINE} strokeWidth={1.5} />

        <text y={S + 22} fontSize={14} fontWeight="600" fontFamily={MONO}>
          <tspan x={15} fill={MALEFIC}>*</tspan>
          <tspan fill={DEG_CLR}> Retro</tspan>
          <tspan x={105} fill="#ffa502">^</tspan>
          <tspan fill={DEG_CLR}> Combust</tspan>
          <tspan x={215} fill={ACCENT}>{'\u25A1'}</tspan>
          <tspan fill={DEG_CLR}> Vargottama</tspan>
          <tspan x={355} fill={BENEFIC}>{'\u2191'}</tspan>
          <tspan fill={DEG_CLR}> Exalted</tspan>
          <tspan x={465} fill={MALEFIC}>{'\u2193'}</tspan>
          <tspan fill={DEG_CLR}> Debilitated</tspan>
        </text>
        <text y={S + 45} fontSize={14} fontFamily={MONO}>
          <tspan x={15} fill="rgba(176,183,195,0.5)">Degree shown after planet abbr.</tspan>
          <tspan x={270} fill={MALEFIC}>Red</tspan>
          <tspan fill="rgba(176,183,195,0.5)"> = Malefic</tspan>
          <tspan x={420} fill={BENEFIC}>Green</tspan>
          <tspan fill="rgba(176,183,195,0.5)"> = Benefic</tspan>
        </text>
      </svg>
    </div>
  );
}
