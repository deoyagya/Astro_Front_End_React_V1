/**
 * SouthIndianChart — react-native-svg 4×4 grid Vedic chart.
 * Ported from web SouthIndianChart.jsx → react-native-svg.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  SIGN_SHORT, buildChartLabel,
} from '@utils/jyotish';
import { fitSouthIndian } from '@utils/chartTextFit';

const LINE_C  = '#7b5bff';
const ACCENT  = '#9d7bff';
const BG      = '#0d0f1a';
const SEL_BG  = 'rgba(123,91,255,0.22)';
const MALEFIC = '#ff6b6b';
const BENEFIC = '#2ed573';
const DEG_CLR = '#b0b7c3';

const S = 600;
const CELL = S / 4;

const SIGN_CELLS: Record<number, { r: number; c: number }> = {
  1: { r: 0, c: 1 }, 2: { r: 0, c: 2 }, 3: { r: 0, c: 3 },
  4: { r: 1, c: 3 }, 5: { r: 2, c: 3 }, 6: { r: 3, c: 3 },
  7: { r: 3, c: 2 }, 8: { r: 3, c: 1 }, 9: { r: 3, c: 0 },
  10: { r: 2, c: 0 }, 11: { r: 1, c: 0 }, 12: { r: 0, c: 0 },
};

interface SouthIndianChartProps {
  chartData: any;
  onHousePress?: (house: number) => void;
  selectedHouse?: number | null;
  d9Vargas?: any;
}

export function SouthIndianChart({
  chartData,
  onHousePress,
  selectedHouse,
  d9Vargas = null,
}: SouthIndianChartProps) {
  const [pressedCell, setPressedCell] = useState<number | null>(null);

  if (!chartData) return null;
  const placements = chartData.placements || {};

  const signToHouse: Record<number, number> = {};
  for (const [hStr, hData] of Object.entries(placements) as any[]) {
    if (hData.sign) signToHouse[hData.sign] = parseInt(hStr, 10);
  }

  const legendH = 60;

  return (
    <View style={styles.container}>
      <Svg viewBox={`0 0 ${S} ${S + legendH}`} style={styles.svg}>
        <Rect x={0} y={0} width={S} height={S} fill={BG} />

        {/* Grid border */}
        <Rect x={1} y={1} width={S - 2} height={S - 2}
          fill="none" stroke={LINE_C} strokeWidth={3} />

        {/* Grid lines */}
        {[1, 2, 3].map(i => (
          <G key={`grid-${i}`}>
            <Line x1={0} y1={CELL * i} x2={S} y2={CELL * i}
              stroke={LINE_C} strokeWidth={2} />
            <Line x1={CELL * i} y1={0} x2={CELL * i} y2={S}
              stroke={LINE_C} strokeWidth={2} />
          </G>
        ))}

        {/* Cells */}
        {Object.entries(SIGN_CELLS).map(([signStr, { r, c }]) => {
          const sign = parseInt(signStr, 10);
          const houseNum = signToHouse[sign] || sign;
          const isSel = selectedHouse === houseNum;
          const x0 = c * CELL;
          const y0 = r * CELL;

          const hData = placements[String(houseNum)] || {};
          const pList = (hData.planets || []).filter((p: string) => p !== 'Lagna');
          const isAsc = (hData.planets || []).includes('Lagna');

          const fill = isSel ? SEL_BG : 'transparent';
          const cellCx = x0 + CELL / 2;

          // Adaptive text sizing — prevents overflow into adjacent cells
          const fit = fitSouthIndian(pList.length, isAsc);

          // Vertical centering within safe zone (below rashi/ASC, above cell bottom)
          const contentTop = isAsc ? y0 + 45 : y0 + 30;
          const contentBot = y0 + CELL - 4;
          const totalTextH = pList.length > 0
            ? (pList.length - 1) * fit.lineHeight + fit.fontSize
            : 0;
          const pStartY = pList.length > 0
            ? contentTop + (contentBot - contentTop - totalTextH) / 2 + fit.fontSize
            : contentTop;

          return (
            <G key={`cell-${sign}`}>
              <Rect
                x={x0 + 1} y={y0 + 1}
                width={CELL - 2} height={CELL - 2}
                fill={fill}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onHousePress?.(houseNum);
                }}
              />

              {/* Rashi label */}
              <SvgText
                x={x0 + 8} y={y0 + 18}
                fill="#e0e0e0" fontSize={22} fontWeight="600"
              >
                {SIGN_SHORT[sign]}( {sign})
              </SvgText>

              {/* ASC marker */}
              {isAsc && (
                <>
                  <SvgText
                    x={cellCx} y={y0 + 36}
                    textAnchor="middle" fill={ACCENT}
                    fontSize={16} fontWeight="800"
                  >
                    ASC
                  </SvgText>
                  <Line
                    x1={x0} y1={y0}
                    x2={x0 + 22} y2={y0 + 22}
                    stroke={ACCENT} strokeWidth={1.5} opacity={0.5}
                  />
                </>
              )}

              {/* Planets — adaptive sizing to prevent overflow */}
              {pList.map((pName: string, idx: number) => {
                const { label, isMalefic } = buildChartLabel(pName, chartData, d9Vargas, fit.truncate);
                return (
                  <SvgText
                    key={`p-${sign}-${pName}`}
                    x={cellCx} y={pStartY + idx * fit.lineHeight}
                    textAnchor="middle"
                    fill={isMalefic ? MALEFIC : BENEFIC}
                    fontSize={fit.fontSize} fontWeight="800"
                  >
                    {label}
                  </SvgText>
                );
              })}
            </G>
          );
        })}

        {/* Center labels */}
        <SvgText
          x={S / 2} y={S / 2 - 8}
          textAnchor="middle" fill={ACCENT}
          fontSize={20} fontWeight="600" opacity={0.5}
        >
          {chartData.ui?.chart_label || 'D1 Chart'}
        </SvgText>
        <SvgText
          x={S / 2} y={S / 2 + 10}
          textAnchor="middle" fill={ACCENT}
          fontSize={16} opacity={0.3}
        >
          South Indian
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
