import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, CategoryColors } from '@/constants/colors';

interface PieChartProps {
  data: Record<string, number>;
  size?: number;
  centerLabel?: string;
}

const { width } = Dimensions.get('window');

export function PieChart({ data, size = Math.min(width * 0.6, 220), centerLabel = 'Expenses by Category' }: PieChartProps) {
  const total = useMemo(() => Object.values(data).reduce((sum, value) => sum + value, 0), [data]);

  const strokeWidth = Math.max(12, Math.min(28, Math.floor(size * 0.16)));
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const entries = useMemo(() => Object.entries(data), [data]);

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyChart, { borderRadius: size / 2 }]}>
          <Text style={styles.emptyText}>No expenses yet</Text>
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

  return (
    <View style={[styles.container, { width: size, height: size }]}
      testID="piechart-container"
    >
      <Svg width={size} height={size}>
        <G x={size / 2} y={size / 2}>
          <Circle
            r={radius}
            stroke={Colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.4}
            transform={`rotate(-90)`}
          />
          {segments.map((segment) => (
            <Circle
              key={segment.category}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90)`}
            />
          ))}
        </G>
      </Svg>

      <View pointerEvents="none" style={styles.centerLabelWrap}>
        <Text style={styles.centerLabel} numberOfLines={2}>
          {centerLabel}
        </Text>
      </View>

      <View style={styles.legend}>
        {entries.map(([category, amount]) => {
          const color = CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.Others;
          const isZero = amount === 0;
          return (
            <View key={category} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: color, opacity: isZero ? 0.3 : 1 }]} />
              <Text style={[styles.legendText, isZero ? styles.legendTextZero : null]}>
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
  emptyChart: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  centerLabelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  centerLabel: {
    color: Colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  legend: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: Colors.text,
    fontSize: 14,
  },
  legendTextZero: {
    opacity: 0.6,
  },
});