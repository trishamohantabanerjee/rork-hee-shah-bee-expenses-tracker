import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
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
    // Platform-specific sizing for better positioning and UI/UX
    if (Platform.OS === 'web') {
      if (width >= 1200) return 440;
      if (width >= 1024) return 360;
      if (width >= 768) return 320;
      return Math.min(width * 0.86, 280);
    } else {
      // Mobile platforms (iOS/Android) - IMPROVED positioning and sizing
      if (width >= 768) return 260; // Tablet - better fit
      // CRITICAL FIX: Better sizing for mobile phones with proper centering
      // Reduced size to prevent overflow and improve positioning
      return Math.min(width * 0.70, 220); // Further reduced for better mobile fit
    }
  }, [size, width]);

  const total = useMemo(() => Object.values(data).reduce((sum, value) => sum + value, 0), [data]);

  const baseFont = useMemo(() => {
    if (Platform.OS === 'web') {
      return width >= 1200 ? 18 : width >= 1024 ? 16 : width >= 768 ? 15 : 14;
    } else {
      // Mobile platforms - slightly smaller fonts for better fit
      return width >= 768 ? 15 : 13;
    }
  }, [width]);
  
  const desiredInnerRadius = Math.ceil(baseFont * (Platform.OS === 'web' ? 3.6 : 3.2));

  let computedStroke = useMemo(() => {
    if (Platform.OS === 'web') {
      const stroke = Math.floor(
        chartSize * (width >= 1200 ? 0.18 : width >= 1024 ? 0.17 : width >= 768 ? 0.16 : 0.135)
      );
      return Math.max(10, Math.min(width >= 1024 ? 40 : 30, stroke));
    } else {
      // Mobile platforms - optimized stroke width
      const stroke = Math.floor(chartSize * 0.14);
      return Math.max(8, Math.min(25, stroke));
    }
  }, [chartSize, width]);

  const adjustedStroke = useMemo(() => {
    const innerRadius = chartSize / 2 - computedStroke;
    if (innerRadius < desiredInnerRadius) {
      const neededStroke = Math.max(Platform.OS === 'web' ? 10 : 8, chartSize / 2 - desiredInnerRadius);
      return Math.min(computedStroke, neededStroke);
    }
    return computedStroke;
  }, [chartSize, computedStroke, desiredInnerRadius]);

  const finalRadius = chartSize / 2 - adjustedStroke / 2;
  const circumference = 2 * Math.PI * finalRadius;

  const entries = useMemo(() => Object.entries(data), [data]);

  const legendTextSize = useMemo(() => {
    if (Platform.OS === 'web') {
      return width >= 1200 ? 17 : width >= 1024 ? 16 : width >= 768 ? 15 : 14;
    } else {
      return width >= 768 ? 14 : 12;
    }
  }, [width]);
  
  const legendRowGap = useMemo(() => {
    if (Platform.OS === 'web') {
      return width >= 1200 ? 14 : width >= 1024 ? 12 : width >= 768 ? 10 : 8;
    } else {
      return width >= 768 ? 10 : 6;
    }
  }, [width]);
  
  const legendColGap = useMemo(() => {
    if (Platform.OS === 'web') {
      return width >= 1200 ? 22 : width >= 1024 ? 18 : width >= 768 ? 16 : 12;
    } else {
      return width >= 768 ? 16 : 10;
    }
  }, [width]);

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
  const positiveSegments = entries
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

  const zeroSegments = entries
    .filter(([, amount]) => amount === 0)
    .map(([category]) => category);

  const epsilon = circumference * 0.005;
  const innerDiameter = chartSize - 2 * adjustedStroke;
  const labelMaxWidth = Math.max(0, innerDiameter - 16);

  return (
    <View style={[styles.container, { width: chartSize }]} testID="piechart-container">
      <View style={[styles.chartWrap, { width: chartSize, height: chartSize }]}
        testID="piechart-svg-wrap"
      >
        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
          <G transform={`translate(${chartSize / 2}, ${chartSize / 2})`}>
            <Circle
              r={finalRadius}
              stroke={Colors.border}
              strokeWidth={adjustedStroke}
              fill="transparent"
              opacity={0.35}
              transform={`rotate(-90)`}
            />
            {positiveSegments.map((segment) => (
              <Circle
                key={segment.category}
                r={finalRadius}
                stroke={segment.color}
                strokeWidth={adjustedStroke}
                fill="transparent"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="butt"
                transform={`rotate(-90)`}
              />
            ))}
            {zeroSegments.map((category, idx) => {
              const color = CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.Others;
              const offset = -(circumference * (idx / Math.max(1, zeroSegments.length)));
              return (
                <Circle
                  key={`zero-${category}`}
                  r={finalRadius}
                  stroke={color}
                  strokeWidth={adjustedStroke}
                  fill="transparent"
                  opacity={0.3}
                  strokeDasharray={`${epsilon} ${circumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90)`}
                />
              );
            })}
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

      <View style={[styles.legend, { marginTop: width >= 1024 ? 20 : 16 }]} testID="piechart-legend">
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