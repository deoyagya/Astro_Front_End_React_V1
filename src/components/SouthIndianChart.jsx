/**
 * SouthIndianChart — SVG 4×4 grid Vedic chart.
 *
 * CONSISTENT with NorthIndianChart:
 *  - Same site purple/dark theme
 *  - Same inline "Su²⁰*↑" planet format
 *  - Same font sizes, colors, legend
 *  - Interactive: hover glow, click highlight
 *
 * 600×600 SVG viewport, scales to 100% width.
 */
import { useState } from 'react';
import {
  SIGN_SHORT, MALEFICS, PLANET_ABBR,
  toDegreeStr, getPlanetStatusSuffix, getDignity, isVargottama,
} from '../utils/jyotish';

/* ===== THEME COLORS — identical to NorthIndianChart ===== */
const LINE     = '#7b5bff';
const ACCENT   = '#9d7bff';
const BG       = '#0d0f1a';
const HOVER_BG = 'rgba(123,91,255,0.12)';
const SEL_BG   = 'rgba(123,91,255,0.22)';
const MALEFIC  = '#ff6b6b';
const BENEFIC  = '#2ed573';
const DEG_CLR  = '#b0b7c3';

const S = 600;
const CELL = S / 4; // 150
const FONT = "'Segoe UI', Arial, sans-serif";
const MONO = "'Segoe UI', 'Courier New', monospace";

/*
 * South Indian: fixed sign → cell mapping (outer ring of 4×4 grid).
 *   [12] [1]  [2]  [3]
 *   [11]            [4]
 *   [10]            [5]
 *   [9]  [8]  [7]  [6]
 */
const SIGN_CELLS = {
  1:  { r: 0, c: 1 },  2:  { r: 0, c: 2 },  3:  { r: 0, c: 3 },
  4:  { r: 1, c: 3 },  5:  { r: 2, c: 3 },  6:  { r: 3, c: 3 },
  7:  { r: 3, c: 2 },  8:  { r: 3, c: 1 },  9:  { r: 3, c: 0 },
  10: { r: 2, c: 0 },  11: { r: 1, c: 0 },  12: { r: 0, c: 0 },
};

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

export default function SouthIndianChart({
  chartData,
  onHouseClick,
  selectedHouse,
  d9Vargas = null,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!chartData) return null;
  const placements = chartData.placements || {};

  // sign → house mapping
  const signToHouse = {};
  for (const [hStr, hData] of Object.entries(placements)) {
    if (hData.sign) signToHouse[hData.sign] = parseInt(hStr, 10);
  }

  const legendH = 60;

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${S} ${S + legendH}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* ===== BACKGROUND ===== */}
        <rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* ===== GRID LINES — purple ===== */}
        <rect x={1} y={1} width={S - 2} height={S - 2}
          fill="none" stroke={LINE} strokeWidth={3} />

        {[1, 2, 3].map(i => (
          <g key={`grid-${i}`}>
            <line x1={0} y1={CELL * i} x2={S} y2={CELL * i}
              stroke={LINE} strokeWidth={2} />
            <line x1={CELL * i} y1={0} x2={CELL * i} y2={S}
              stroke={LINE} strokeWidth={2} />
          </g>
        ))}

        {/* ===== CELLS ===== */}
        {Object.entries(SIGN_CELLS).map(([signStr, { r, c }]) => {
          const sign = parseInt(signStr, 10);
          const houseNum = signToHouse[sign] || sign;
          const isSel = selectedHouse === houseNum;
          const isHov = hoveredCell === sign;
          const x0 = c * CELL;
          const y0 = r * CELL;

          const hData = placements[String(houseNum)] || {};
          const pList = (hData.planets || []).filter(p => p !== 'Lagna');
          const isAsc = (hData.planets || []).includes('Lagna');

          let fill = 'transparent';
          if (isSel) fill = SEL_BG;
          else if (isHov) fill = HOVER_BG;

          const cellCx = x0 + CELL / 2;
          const lineH = 24;
          const pStartY = y0 + 50 + (pList.length <= 2 ? 15 : 0);

          return (
            <g key={`cell-${sign}`}>
              {/* Click/hover target */}
              <rect x={x0 + 1} y={y0 + 1} width={CELL - 2} height={CELL - 2}
                fill={fill} style={{ cursor: 'pointer' }}
                onClick={() => onHouseClick?.(houseNum)}
                onMouseEnter={() => setHoveredCell(sign)}
                onMouseLeave={() => setHoveredCell(null)}
              />

              {/* Rashi label — "Cap(8)" format, top-left */}
              <text x={x0 + 8} y={y0 + 18}
                fill="#e0e0e0" fontSize={14} fontWeight="600"
                fontFamily={FONT}
                style={{ pointerEvents: 'none' }}>
                {SIGN_SHORT[sign]}({sign})
              </text>

              {/* ASC marker for lagna house */}
              {isAsc && (
                <text x={cellCx} y={y0 + 36}
                  textAnchor="middle" fill={ACCENT}
                  fontSize={10} fontWeight="800" fontFamily={FONT}
                  style={{ pointerEvents: 'none' }}>
                  ASC
                </text>
              )}

              {/* Diagonal in lagna cell — traditional marker */}
              {isAsc && (
                <line x1={x0} y1={y0} x2={x0 + 22} y2={y0 + 22}
                  stroke={ACCENT} strokeWidth={1.5} opacity={0.5} />
              )}

              {/* Planets — inline "Su²⁰*↑" format */}
              {pList.map((pName, idx) => {
                const { label, isMalefic } = buildLabel(pName, chartData, d9Vargas);
                return (
                  <text
                    key={`p-${sign}-${pName}`}
                    x={cellCx} y={pStartY + idx * lineH}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isMalefic ? MALEFIC : BENEFIC}
                    fontSize={18} fontWeight="800" fontFamily={MONO}
                    style={{ pointerEvents: 'none' }}>
                    {label}
                  </text>
                );
              })}
            </g>
          );
        })}

        {/* Center label */}
        <text x={S / 2} y={S / 2 - 8} textAnchor="middle" fill={ACCENT}
          fontSize={13} fontWeight="600" fontFamily={FONT} opacity={0.5}
          style={{ pointerEvents: 'none' }}>
          {chartData.ui?.chart_label || 'D1 Chart'}
        </text>
        <text x={S / 2} y={S / 2 + 10} textAnchor="middle" fill={ACCENT}
          fontSize={10} fontFamily={FONT} opacity={0.3}
          style={{ pointerEvents: 'none' }}>
          South Indian
        </text>

        {/* ===== LEGEND BAR — identical to NorthIndianChart ===== */}
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
