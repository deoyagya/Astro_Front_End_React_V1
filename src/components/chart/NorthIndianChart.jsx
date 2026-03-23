/**
 * NorthIndianChart — SVG diamond-style Vedic chart.
 *
 * Uses shared chart constants and utilities from the chart library.
 * Dynamic font scaling prevents overflow in crowded houses.
 * 600×600 SVG viewport, scales to 100% container width.
 */
import { useState } from 'react';
import { SIGN_SHORT } from '../../utils/jyotish';
import {
  S, M, LINE, LINE_DIM, ACCENT, BG, HOVER_BG, SEL_BG, LAGNA_BG,
  MALEFIC, BENEFIC, DEG_CLR, FONT, MONO,
  SIGN_FONT, ASC_FONT, LABEL_FONT, LEGEND_FONT, LEGEND_H,
} from './chartConstants';
import { buildLabel, getHouseFontMetrics } from './chartUtils';

/* ===== CLICKABLE POLYGON PATHS ===== */
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

/*
 * Planet stacking zones: [x, minY, maxY] per house.
 *   x     — horizontal center for planet text
 *   minY  — top of allowed stacking zone
 *   maxY  — bottom of allowed stacking zone
 *
 * Sign labels are at extreme outer corners with directional textAnchor,
 * so their text extends AWAY from planet zones — no horizontal overlap.
 * Budget = maxY - minY drives the font scaling.
 */
const STACK_ZONES = {
  1:  [M,   118, 258],    // diamond — below ASC(88), above center
  2:  [155,  42, 125],    // flat △
  3:  [62,  110, 255],    // tall △
  4:  [155, 210, 405],    // diamond — generous vertical
  5:  [62,  345, 488],    // tall △
  6:  [155, 475, 558],    // flat △
  7:  [M,   342, 530],    // diamond — above sign(558)
  8:  [445, 475, 558],    // flat △
  9:  [538, 345, 488],    // tall △
  10: [445, 210, 405],    // diamond — generous vertical
  11: [538, 110, 255],    // tall △
  12: [445,  42, 125],    // flat △
};

/*
 * Sign label positions: [x, y, textAnchor].
 *
 * Left-side houses (2–6)  → textAnchor="start", x≈18  — text grows rightward
 * Right-side houses (8–12) → textAnchor="end",   x≈582 — text grows leftward
 * Top/bottom diamonds (1,7) → textAnchor="middle"
 *
 * This guarantees sign label text NEVER shares horizontal space
 * with planet text in the same or adjacent house.
 */
const SIGN_LABELS = {
  1:  [M,   50,  'middle'],   // top diamond — near top edge
  2:  [18,  18,  'start'],    // flat top-left △ — (0,0) corner
  3:  [18,  80,  'start'],    // tall left top △ — left edge
  4:  [30,  M,   'start'],    // left diamond — near left vertex (0,300)
  5:  [18,  520, 'start'],    // tall left bottom △ — left edge
  6:  [18,  582, 'start'],    // flat bottom-left △ — (0,600) corner
  7:  [M,   558, 'middle'],   // bottom diamond — near bottom edge
  8:  [582, 582, 'end'],      // flat bottom-right △ — (600,600) corner
  9:  [582, 520, 'end'],      // tall right bottom △ — right edge
  10: [570, M,   'end'],      // right diamond — near right vertex (600,300)
  11: [582, 80,  'end'],      // tall right top △ — right edge
  12: [582, 18,  'end'],      // flat top-right △ — (600,0) corner
};

export default function NorthIndianChart({
  chartData,
  chartLabel = 'D1 Chart',
  onHouseClick,
  selectedHouse,
  d9Vargas = null,
  showAscMarker = true,
}) {
  const [hoveredHouse, setHoveredHouse] = useState(null);

  if (!chartData) return null;
  const placements = chartData.placements || {};

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${S} ${S + LEGEND_H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* Structural lines */}
        <rect x={1} y={1} width={S - 2} height={S - 2}
          fill="none" stroke={LINE} strokeWidth={3} />
        <line x1={0} y1={0} x2={S} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />
        <line x1={S} y1={0} x2={0} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />
        <line x1={M} y1={0} x2={0}   y2={M} stroke={LINE} strokeWidth={2.5} />
        <line x1={M} y1={0} x2={S}   y2={M} stroke={LINE} strokeWidth={2.5} />
        <line x1={0} y1={M} x2={M}   y2={S} stroke={LINE} strokeWidth={2.5} />
        <line x1={S} y1={M} x2={M}   y2={S} stroke={LINE} strokeWidth={2.5} />

        {/* Interactive house polygons */}
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

        {/* Rashi labels — per-house textAnchor prevents cross-house bleed */}
        {Object.entries(SIGN_LABELS).map(([hStr, [hx, hy, anchor]]) => {
          const h = parseInt(hStr, 10);
          const sign = placements[String(h)]?.sign || h;
          return (
            <text key={`r-${h}`} x={hx} y={hy}
              textAnchor={anchor} dominantBaseline="central"
              fill="#e0e0e0" fontSize={SIGN_FONT} fontWeight="700"
              fontFamily={FONT} style={{ pointerEvents: 'none' }}>
              {SIGN_SHORT[sign]}({sign})
            </text>
          );
        })}

        {/* Planets — bounded stacking, never overlaps sign labels */}
        {Object.entries(STACK_ZONES).map(([hStr, [cx, minY, maxY]]) => {
          const h = parseInt(hStr, 10);
          const hData = placements[String(h)] || {};
          const pList = (hData.planets || []).filter(p => p !== 'Lagna');
          if (!pList.length) return null;

          const budget = maxY - minY;
          const { fontSize, lineHeight } = getHouseFontMetrics(pList.length, budget);
          const stackH = (pList.length - 1) * lineHeight;
          const centerY = (minY + maxY) / 2;
          // Center within bounds, clamp so stack never escapes the zone
          const startY = Math.max(minY, Math.min(centerY - stackH / 2, maxY - stackH));

          return pList.map((pName, idx) => {
            const { label, isMalefic } = buildLabel(pName, chartData, d9Vargas);
            return (
              <text
                key={`p-${h}-${pName}`}
                x={cx} y={startY + idx * lineHeight}
                textAnchor="middle" dominantBaseline="central"
                fill={isMalefic ? MALEFIC : BENEFIC}
                fontSize={fontSize} fontWeight="800" fontFamily={MONO}
                style={{ pointerEvents: 'none' }}>
                {label}
              </text>
            );
          });
        })}

        {/* ASC marker */}
        {showAscMarker && (
          <text x={M} y={88} textAnchor="middle" fill={ACCENT}
            fontSize={ASC_FONT} fontWeight="800" fontFamily={FONT}
            style={{ pointerEvents: 'none' }}>
            ASC
          </text>
        )}

        {/* Center label */}
        <text x={M} y={M - 10} textAnchor="middle" fill={ACCENT}
          fontSize={LABEL_FONT} fontWeight="600" fontFamily={FONT}
          opacity={0.5} style={{ pointerEvents: 'none' }}>
          {chartLabel}
        </text>

        {/* Legend bar */}
        <rect x={0} y={S} width={S} height={LEGEND_H}
          fill="rgba(30,33,48,0.95)" />
        <line x1={0} y1={S} x2={S} y2={S} stroke={LINE} strokeWidth={1.5} />

        <text y={S + 20} fontSize={LEGEND_FONT} fontWeight="600" fontFamily={MONO}>
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
        <text y={S + 42} fontSize={LEGEND_FONT} fontFamily={MONO}>
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
