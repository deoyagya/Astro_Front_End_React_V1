import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface TimelinePoint {
  date: string;
  opportunity_score: number;
  threat_score: number;
  window_type?: string;
}

interface Peak {
  date: string;
  score: number;
}

interface TimelineChartProps {
  points: TimelinePoint[];
  peakOpp?: Peak | null;
  peakThreat?: Peak | null;
  width?: number;
  height?: number;
}

function buildAreaPath(
  points: TimelinePoint[],
  key: 'opportunity_score' | 'threat_score',
  chartWidth: number,
  chartHeight: number,
  padding: { top: number; bottom: number; left: number; right: number },
): string {
  if (points.length === 0) return '';

  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;

  let d = `M ${padding.left} ${padding.top + plotH}`;

  points.forEach((pt, i) => {
    const x = padding.left + i * xStep;
    const val = Math.min(pt[key] || 0, 100);
    const y = padding.top + plotH - (val / 100) * plotH;
    d += ` L ${x} ${y}`;
  });

  // Close path back to baseline
  const lastX = padding.left + (points.length - 1) * xStep;
  d += ` L ${lastX} ${padding.top + plotH} Z`;

  return d;
}

export function TimelineChart({
  points,
  peakOpp,
  peakThreat,
  width: propWidth,
  height = 220,
}: TimelineChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = propWidth || screenWidth - 64;

  const padding = { top: 20, bottom: 40, left: 40, right: 16 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  if (points.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.empty}>No data</Text>
      </View>
    );
  }

  const xStep = points.length > 1 ? plotW / (points.length - 1) : 0;

  const oppPath = buildAreaPath(points, 'opportunity_score', chartWidth, height, padding);
  const threatPath = buildAreaPath(points, 'threat_score', chartWidth, height, padding);

  // X-axis labels (show ~5 evenly spaced)
  const labelCount = Math.min(5, points.length);
  const labelStep = Math.max(1, Math.floor((points.length - 1) / (labelCount - 1)));
  const xLabels: { x: number; label: string }[] = [];
  for (let i = 0; i < points.length; i += labelStep) {
    const x = padding.left + i * xStep;
    const d = points[i].date;
    const short = d.length >= 10 ? `${d.substring(5, 7)}/${d.substring(2, 4)}` : d;
    xLabels.push({ x, label: short });
  }

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // Peak dot positions
  const peakOppIdx = peakOpp ? points.findIndex((p) => p.date === peakOpp.date) : -1;
  const peakThreatIdx = peakThreat ? points.findIndex((p) => p.date === peakThreat.date) : -1;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {yLabels.map((val) => {
          const y = padding.top + plotH - (val / 100) * plotH;
          return (
            <React.Fragment key={val}>
              <Line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <SvgText
                x={padding.left - 6}
                y={y + 4}
                fill={colors.muted}
                fontSize={10}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Opportunity area */}
        <Path d={oppPath} fill="rgba(67,217,131,0.25)" />
        {/* Threat area */}
        <Path d={threatPath} fill="rgba(255,107,107,0.25)" />

        {/* Opportunity line */}
        {points.length > 1 && (
          <Path
            d={points.reduce((d, pt, i) => {
              const x = padding.left + i * xStep;
              const y = padding.top + plotH - (Math.min(pt.opportunity_score || 0, 100) / 100) * plotH;
              return i === 0 ? `M ${x} ${y}` : `${d} L ${x} ${y}`;
            }, '')}
            fill="none"
            stroke={colors.success}
            strokeWidth={2}
          />
        )}

        {/* Threat line */}
        {points.length > 1 && (
          <Path
            d={points.reduce((d, pt, i) => {
              const x = padding.left + i * xStep;
              const y = padding.top + plotH - (Math.min(pt.threat_score || 0, 100) / 100) * plotH;
              return i === 0 ? `M ${x} ${y}` : `${d} L ${x} ${y}`;
            }, '')}
            fill="none"
            stroke={colors.malefic}
            strokeWidth={2}
          />
        )}

        {/* Peak dots */}
        {peakOppIdx >= 0 && peakOpp && (
          <Circle
            cx={padding.left + peakOppIdx * xStep}
            cy={padding.top + plotH - (Math.min(peakOpp.score, 100) / 100) * plotH}
            r={5}
            fill={colors.success}
            stroke={colors.bg}
            strokeWidth={2}
          />
        )}
        {peakThreatIdx >= 0 && peakThreat && (
          <Circle
            cx={padding.left + peakThreatIdx * xStep}
            cy={padding.top + plotH - (Math.min(peakThreat.score, 100) / 100) * plotH}
            r={5}
            fill={colors.malefic}
            stroke={colors.bg}
            strokeWidth={2}
          />
        )}

        {/* X-axis labels */}
        {xLabels.map((lbl, i) => (
          <SvgText
            key={i}
            x={lbl.x}
            y={height - 8}
            fill={colors.muted}
            fontSize={10}
            textAnchor="middle"
          >
            {lbl.label}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Opportunity</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.malefic }]} />
          <Text style={styles.legendText}>Threat</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  empty: { ...typography.styles.bodySmall, color: colors.muted },
  legend: { flexDirection: 'row', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.styles.caption, color: colors.muted },
});
