/**
 * SouthIndianChart — SVG 4×4 grid Vedic chart.
 *
 * Uses shared chart constants and utilities from the chart library.
 * Dynamic font scaling prevents overflow in crowded cells.
 * 600×600 SVG viewport, scales to 100% container width.
 */
import { useState } from 'react';
import { SIGN_SHORT } from '../../utils/jyotish';
import {
  S, LINE, ACCENT, BG, HOVER_BG, SEL_BG,
  MALEFIC, BENEFIC, DEG_CLR, FONT, MONO,
  SIGN_FONT, PLANET_FONT, ASC_FONT, LEGEND_FONT, LEGEND_H,
} from './chartConstants';
import { buildLabel, getHouseFontMetrics } from './chartUtils';

const CELL = S / 4; // 150

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

export default function SouthIndianChart({
  chartData,
  chartLabel = 'D1 Chart',
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

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${S} ${S + LEGEND_H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* Grid lines */}
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

        {/* Cells */}
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
          const { fontSize, lineHeight } = getHouseFontMetrics(pList.length, 80);
          const pStartY = y0 + 58 + (pList.length <= 2 ? 12 : 0);

          return (
            <g key={`cell-${sign}`}>
              {/* Click/hover target */}
              <rect x={x0 + 1} y={y0 + 1} width={CELL - 2} height={CELL - 2}
                fill={fill} style={{ cursor: 'pointer' }}
                onClick={() => onHouseClick?.(houseNum)}
                onMouseEnter={() => setHoveredCell(sign)}
                onMouseLeave={() => setHoveredCell(null)}
              />

              {/* Rashi label — top-left */}
              <text x={x0 + 8} y={y0 + 22}
                fill="#e0e0e0" fontSize={SIGN_FONT} fontWeight="700"
                fontFamily={FONT}
                style={{ pointerEvents: 'none' }}>
                {SIGN_SHORT[sign]}({sign})
              </text>

              {/* ASC marker */}
              {isAsc && (
                <text x={cellCx} y={y0 + 42}
                  textAnchor="middle" fill={ACCENT}
                  fontSize={ASC_FONT} fontWeight="800" fontFamily={FONT}
                  style={{ pointerEvents: 'none' }}>
                  ASC
                </text>
              )}

              {/* Diagonal in lagna cell */}
              {isAsc && (
                <line x1={x0} y1={y0} x2={x0 + 22} y2={y0 + 22}
                  stroke={ACCENT} strokeWidth={1.5} opacity={0.5} />
              )}

              {/* Planets — dynamic scaling */}
              {pList.map((pName, idx) => {
                const { label, isMalefic } = buildLabel(pName, chartData, d9Vargas);
                return (
                  <text
                    key={`p-${sign}-${pName}`}
                    x={cellCx} y={pStartY + idx * lineHeight}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isMalefic ? MALEFIC : BENEFIC}
                    fontSize={fontSize} fontWeight="800" fontFamily={MONO}
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
          fontSize={SIGN_FONT} fontWeight="600" fontFamily={FONT} opacity={0.5}
          style={{ pointerEvents: 'none' }}>
          {chartLabel}
        </text>
        <text x={S / 2} y={S / 2 + 14} textAnchor="middle" fill={ACCENT}
          fontSize={ASC_FONT} fontFamily={FONT} opacity={0.3}
          style={{ pointerEvents: 'none' }}>
          South Indian
        </text>

        {/* Legend bar */}
        <rect x={0} y={S} width={S} height={LEGEND_H}
          fill="rgba(30,33,48,0.95)" />
        <line x1={0} y1={S} x2={S} y2={S} stroke={LINE} strokeWidth={1.5} />

        <text y={S + 28} fontSize={LEGEND_FONT} fontWeight="600" fontFamily={MONO}>
          <tspan x={12} fill={MALEFIC}>*</tspan>
          <tspan fill={DEG_CLR}> Retro</tspan>
          <tspan x={110} fill="#ffa502">^</tspan>
          <tspan fill={DEG_CLR}> Combust</tspan>
          <tspan x={235} fill={ACCENT}>{'\u25A1'}</tspan>
          <tspan fill={DEG_CLR}> Vargottama</tspan>
          <tspan x={400} fill={BENEFIC}>{'\u2191'}</tspan>
          <tspan fill={DEG_CLR}> Exalted</tspan>
          <tspan x={500} fill={MALEFIC}>{'\u2193'}</tspan>
          <tspan fill={DEG_CLR}> Debil.</tspan>
        </text>
        <text y={S + 56} fontSize={LEGEND_FONT} fontFamily={MONO}>
          <tspan x={12} fill="rgba(176,183,195,0.5)">Degree after planet abbr.</tspan>
          <tspan x={290} fill={MALEFIC}>Red</tspan>
          <tspan fill="rgba(176,183,195,0.5)"> = Malefic</tspan>
          <tspan x={440} fill={BENEFIC}>Green</tspan>
          <tspan fill="rgba(176,183,195,0.5)"> = Benefic</tspan>
        </text>
      </svg>
    </div>
  );
}
