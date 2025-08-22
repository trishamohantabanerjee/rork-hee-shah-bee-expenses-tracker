import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, CategoryColors } from '@/constants/colors';

interface PieChartProps {
  data: Record<string, number>;
  size?: number;
  centerLabel?: string;
}

export function PieChart({ data, size, centerLabel = 'Expenses by Category' }: PieChartProps) {
  const { width } = useWindowDimensions();

  const chartSize = useMemo(() => {
    if (size) return size;
    if (width >= 1200) return 420;
    if (width >= 1024) return 360;
    if (width >= 768) return 320;
    return Math.min(width * 0.86, 280);
  }, [size, width]);

  const total = useMemo(() => Object.values(data).reduce((sum, value) => sum + value, 0), [data]);

  const baseFont = width >= 1200 ? 18 : width >= 1024 ? 16 : width >= 768 ? 15 : 14;
  const desiredInnerRadius = baseFont * 3.2;

  let computedStroke = Math.floor(
    chartSize * (width >= 1200 ? 0.18 : width >= 1024 ? 0.17 : width >= 768 ? 0.16 : 0.13)
  );
  computedStroke = Math.max(10, Math.min(width >= 1024 ? 36 : 28, computedStroke));

  const innerRadius = chartSize / 2 - computedStroke;
  if (innerRadius < desiredInnerRadius) {
    const neededStroke = Math.max(10, chartSize / 2 - desiredInnerRadius);
    computedStroke = Math.min(computedStroke, neededStroke);
  }

  const finalRadius = chartSize / 2 - computedStroke / 2;
  const circumference = 2 * Math.PI * finalRadius;

  const entries = useMemo(() => Object.entries(data), [data]);

  if (total === 0) {
    return (
      <View style={[styles.container, { width: chartSize }]} testID="piechart-container">
        <View style={[styles.emptyChart, { borderRadius: chartSize / 2, width: chartSize, height: chartSize }]}
          testID="piechart-empty"
        >
          <Text style={[styles.emptyText, { fontSize: baseFont }]}>No expenses yet</Text>
        </View>
      </View>
    );
  }

  let currentPortion = 0;
  const segments = entries
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => {
      const color = CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.Others;
      const percentage = amount / total;
      const length = percentage * circumference;
      const strokeDasharray = `${length} ${circumference}`;
      const strokeDashoffset = -currentPortion * circumference;
      currentPortion += percentage;
      return { category, amount, percentage, strokeDasharray, strokeDashoffset, color };
    });

  const innerDiameter = chartSize - 2 * computedStroke;
  const labelMaxWidth = Math.max(0, innerDiameter - 16);

  const legendTextSize = width >= 1200 ? 17 : width >= 1024 ? 16 : width >= 768 ? 15 : 14;
  const legendRowGap = width >= 1200 ? 12 : width >= 1024 ? 10 : width >= 768 ? 10 : 8;
  const legendColGap = width >= 1200 ? 20 : width >= 1024 ? 18 : width >= 768 ? 16 : 12;

  return (
    <View style={[styles.container, { width: chartSize }]} testID="piechart-container">
      <View style={[styles.chartWrap, { width: chartSize, height: chartSize }]}
        testID="piechart-svg-wrap"
      >
        <Svg width={chartSize} height={chartSize}>
          <G x={chartSize / 2} y={chartSize / 2}>
            <Circle
              r={finalRadius}
              stroke={Colors.border}
              strokeWidth={computedStroke}
              fill="transparent"
              opacity={0.4}
              transform={`rotate(-90)`}
            />
            {segments.map((segment) => (
              <Circle
                key={segment.category}
                r={finalRadius}
                stroke={segment.color}
                strokeWidth={computedStroke}
                fill="transparent"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="butt"
                transform={`rotate(-90)`}
              />
            ))}
          </G>
        </Svg>

        <View pointerEvents="none" style={styles.centerLabelWrap} testID="piechart-center-label">
          <View style={{ maxWidth: labelMaxWidth, paddingHorizontal: 8 }}>
            <Text style={[styles.centerLabel, { fontSize: baseFont }]} numberOfLines={2}>
              {centerLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.legend, { marginTop: 16 }]} testID="piechart-legend">
        {entries.map(([category, amount]) => {
          const color = CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.Others;
          const isZero = amount === 0;
          return (
            <View key={category} style={[styles.legendItem, { marginRight: legendColGap, marginVertical: legendRowGap / 4 }]}>
              <View style={[styles.legendColor, { backgroundColor: color, opacity: isZero ? 0.3 : 1 }]} />
              <Text style={[styles.legendText, { fontSize: legendTextSize }, isZero ? styles.legendTextZero : null]}>
                {category}: ₹{amount.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyChart: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  centerLabelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: Colors.text,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: Colors.text,
  },
  legendTextZero: {
    opacity: 0.6,
  },
});