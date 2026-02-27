/**
 * NorthIndianChart — react-native-svg diamond-style Vedic chart.
 * Ported from web NorthIndianChart.jsx → react-native-svg.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Line,
  Path,
  Text as SvgText,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { buildChartLabel } from '@utils/jyotish';
import { fitNorthIndian } from '@utils/chartTextFit';

const LINE_C   = '#7b5bff';
const LINE_DIM = '#5a42cc';
const ACCENT   = '#9d7bff';
const BG       = '#0d0f1a';
const SEL_BG   = 'rgba(123,91,255,0.22)';
const LAGNA_BG = 'rgba(123,91,255,0.06)';
const MALEFIC  = '#ff6b6b';
const BENEFIC  = '#2ed573';
const DEG_CLR  = '#b0b7c3';

const S = 600;
const M = S / 2;

const PATHS: Record<number, string> = {
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

// Per-house bounds: cx for horizontal center, topY/botY for usable vertical range.
// Derived from house polygon geometry with margins for rashi labels and vertices.
const HOUSE_BOUNDS: Record<number, { cx: number; topY: number; botY: number }> = {
  1:  { cx: 300, topY: 118, botY: 280 },  // below ASC(106), above bottom vertex(300)
  2:  { cx: 148, topY: 12,  botY: 120 },  // top edge, above converging edges
  3:  { cx: 58,  topY: 75,  botY: 225 },  // below upper diagonal, above lower diagonal
  4:  { cx: 148, topY: 170, botY: 430 },  // below top vertex(150), above bottom vertex(450)
  5:  { cx: 58,  topY: 375, botY: 525 },  // below upper diagonal, above lower diagonal
  6:  { cx: 148, topY: 465, botY: 588 },  // below converging edges, above bottom edge
  7:  { cx: 300, topY: 320, botY: 520 },  // below top vertex(300), above rashi(540)
  8:  { cx: 452, topY: 465, botY: 588 },  // below converging edges, above bottom edge
  9:  { cx: 542, topY: 375, botY: 525 },  // below upper diagonal, above lower diagonal
  10: { cx: 452, topY: 170, botY: 430 },  // below top vertex(150), above bottom vertex(450)
  11: { cx: 542, topY: 75,  botY: 225 },  // below upper diagonal, above lower diagonal
  12: { cx: 452, topY: 12,  botY: 120 },  // top edge, above converging edges
};

const HNUM_POS: Record<number, [number, number]> = {
  1: [M, 60],     2: [82, 20],    3: [20, 82],
  4: [82, M],     5: [20, 518],   6: [82, 580],
  7: [M, 540],    8: [518, 580],  9: [580, 518],
  10: [518, M],   11: [580, 82],  12: [518, 20],
};

interface NorthIndianChartProps {
  chartData: any;
  chartLabel?: string;
  onHousePress?: (house: number) => void;
  selectedHouse?: number | null;
  d9Vargas?: any;
}

export function NorthIndianChart({
  chartData,
  chartLabel = 'D1 Chart',
  onHousePress,
  selectedHouse,
  d9Vargas = null,
}: NorthIndianChartProps) {
  if (!chartData) return null;
  const placements = chartData.placements || {};
  const legendH = 60;

  return (
    <View style={styles.container}>
      <Svg viewBox={`0 0 ${S} ${S + legendH}`} style={styles.svg}>
        <Rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* Outer border */}
        <Rect x={1} y={1} width={S - 2} height={S - 2}
          fill="none" stroke={LINE_C} strokeWidth={3} />

        {/* Diagonals */}
        <Line x1={0} y1={0} x2={S} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />
        <Line x1={S} y1={0} x2={0} y2={S} stroke={LINE_DIM} strokeWidth={1.5} />

        {/* Diamond */}
        <Line x1={M} y1={0} x2={0} y2={M} stroke={LINE_C} strokeWidth={2.5} />
        <Line x1={M} y1={0} x2={S} y2={M} stroke={LINE_C} strokeWidth={2.5} />
        <Line x1={0} y1={M} x2={M} y2={S} stroke={LINE_C} strokeWidth={2.5} />
        <Line x1={S} y1={M} x2={M} y2={S} stroke={LINE_C} strokeWidth={2.5} />

        {/* House polygons */}
        {Object.entries(PATHS).map(([hStr, pathD]) => {
          const h = parseInt(hStr, 10);
          const isSel = selectedHouse === h;
          const isAsc = h === 1;

          let fill = 'transparent';
          if (isSel) fill = SEL_BG;
          else if (isAsc) fill = LAGNA_BG;

          return (
            <Path
              key={h}
              d={pathD}
              fill={fill}
              stroke="none"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onHousePress?.(h);
              }}
            />
          );
        })}

        {/* Rashi labels */}
        {Object.entries(HNUM_POS).map(([hStr, [hx, hy]]) => {
          const h = parseInt(hStr, 10);
          const sign = placements[String(h)]?.sign || h;
          return (
            <SvgText
              key={`r-${h}`} x={hx} y={hy}
              textAnchor="middle"
              fill="#e0e0e0" fontSize={22} fontWeight="600"
            >
              {sign}
            </SvgText>
          );
        })}

        {/* Planets — bounds-based centering within each house */}
        {Object.entries(HOUSE_BOUNDS).map(([hStr, { cx, topY, botY }]) => {
          const h = parseInt(hStr, 10);
          const hData = placements[String(h)] || {};
          const pList = (hData.planets || []).filter((p: string) => p !== 'Lagna');
          if (!pList.length) return null;

          const fit = fitNorthIndian(h, pList.length);
          const totalTextH = (pList.length - 1) * fit.lineHeight + fit.fontSize;
          const startY = topY + (botY - topY - totalTextH) / 2 + fit.fontSize;

          return pList.map((pName: string, idx: number) => {
            const { label, isMalefic } = buildChartLabel(pName, chartData, d9Vargas, fit.truncate);
            return (
              <SvgText
                key={`p-${h}-${pName}`}
                x={cx} y={startY + idx * fit.lineHeight}
                textAnchor="middle"
                fill={isMalefic ? MALEFIC : BENEFIC}
                fontSize={fit.fontSize} fontWeight="800"
              >
                {label}
              </SvgText>
            );
          });
        })}

        {/* ASC marker */}
        <SvgText
          x={M} y={106}
          textAnchor="middle" fill={ACCENT}
          fontSize={18} fontWeight="800"
        >
          ASC
        </SvgText>

        {/* Center label */}
        <SvgText
          x={M} y={M - 8}
          textAnchor="middle" fill={ACCENT}
          fontSize={20} fontWeight="600" opacity={0.5}
        >
          {chartLabel}
        </SvgText>

        {/* Legend */}
        <Rect x={0} y={S} width={S} height={legendH} fill="rgba(30,33,48,0.95)" />
        <Line x1={0} y1={S} x2={S} y2={S} stroke={LINE_C} strokeWidth={1.5} />

        <SvgText y={S + 22} fontSize={13} fontWeight="600">
          <SvgText x={15} fill={MALEFIC}>*</SvgText>
          <SvgText fill={DEG_CLR}> Retro  </SvgText>
          <SvgText fill="#ffa502">^</SvgText>
          <SvgText fill={DEG_CLR}> Combust  </SvgText>
          <SvgText fill={ACCENT}>{'\u25A1'}</SvgText>
          <SvgText fill={DEG_CLR}> Vargottama  </SvgText>
          <SvgText fill={BENEFIC}>{'\u2191'}</SvgText>
          <SvgText fill={DEG_CLR}> Exalted  </SvgText>
          <SvgText fill={MALEFIC}>{'\u2193'}</SvgText>
          <SvgText fill={DEG_CLR}> Debil.</SvgText>
        </SvgText>
        <SvgText y={S + 45} fontSize={12}>
          <SvgText x={15} fill="rgba(176,183,195,0.5)">Degree after abbr. </SvgText>
          <SvgText fill={MALEFIC}>Red</SvgText>
          <SvgText fill="rgba(176,183,195,0.5)">=Malefic </SvgText>
          <SvgText fill={BENEFIC}>Green</SvgText>
          <SvgText fill="rgba(176,183,195,0.5)">=Benefic</SvgText>
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  svg: {
    width: '100%',
    height: undefined,
    aspectRatio: 600 / 660,
  },
});
