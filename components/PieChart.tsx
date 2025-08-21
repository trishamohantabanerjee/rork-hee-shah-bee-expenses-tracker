import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, CategoryColors } from '@/constants/colors';

interface PieChartProps {
  data: Record<string, number>;
  size?: number;
}

const { width } = Dimensions.get('window');

export function PieChart({ data, size = Math.min(width * 0.6, 200) }: PieChartProps) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No expenses yet</Text>
        </View>
      </View>
    );
  }

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  let currentAngle = 0;

  const segments = Object.entries(data).map(([category, amount]) => {
    const percentage = amount / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentAngle * circumference;
    currentAngle += percentage;

    return {
      category,
      amount,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      color: CategoryColors[category as keyof typeof CategoryColors] || CategoryColors.Others,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G x={size / 2} y={size / 2}>
          {segments.map((segment, index) => (
            <Circle
              key={segment.category}
              r={radius}
              stroke={segment.color}
              strokeWidth={20}
              fill="transparent"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              transform={`rotate(-90)`}
            />
          ))}
        </G>
      </Svg>
      
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.category} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
            <Text style={styles.legendText}>
              {segment.category}: ₹{segment.amount.toLocaleString()}
            </Text>
          </View>
        ))}
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
    borderRadius: 100,
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
  legend: {
    marginTop: 20,
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
});