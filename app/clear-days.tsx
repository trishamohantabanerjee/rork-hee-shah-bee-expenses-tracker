import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Circle, Trash2, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useExpenseStore } from '@/hooks/expense-store';
import { Colors } from '@/constants/colors';

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ClearDaysScreen() {
  const { clearDailyData, expenses } = useExpenseStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const recentDays = useMemo(() => {
    const arr: { iso: string; label: string; expenseCount: number }[] = [];
    const today = new Date();
    const expensesByDate = expenses.reduce((acc, expense) => {
      acc[expense.date] = (acc[expense.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = toISODate(d);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : iso;
      const expenseCount = expensesByDate[iso] || 0;
      if (expenseCount > 0) {
        arr.push({ iso, label, expenseCount });
      }
    }
    return arr;
  }, [expenses]);

  const toggle = (iso: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  };

  const clearSelected = async () => {
    try {
      if (selected.size === 0) {
        Alert.alert('Nothing Selected', 'Please select at least one day to clear.');
        return;
      }
      
      const selectedDays = Array.from(selected);
      const dayLabels = selectedDays.map(iso => {
        const day = recentDays.find(d => d.iso === iso);
        return day ? day.label : iso;
      }).join(', ');
      
      Alert.alert(
        'Confirm Deletion',
        `Are you sure you want to delete all expenses from: ${dayLabels}?\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              let allOk = true;
              for (const iso of selectedDays) {
                // eslint-disable-next-line no-await-in-loop
                const ok = await clearDailyData(iso);
                if (!ok) allOk = false;
              }
              
              if (allOk) {
                Alert.alert('Success', 'Selected days data cleared successfully');
                setSelected(new Set());
              } else {
                Alert.alert('Partial Success', 'Some days failed to delete. Please try again.');
              }
            }
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Clear Day Wise Data</Text>
          <View style={styles.placeholder} />
        </View>
        
        <Text style={styles.subtitle}>
          Select one or more days to delete all expense entries. Only days with expenses are shown.
        </Text>
        
        {recentDays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses found in the last 30 days</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {recentDays.map(({ iso, label, expenseCount }) => {
              const isSelected = selected.has(iso);
              return (
                <TouchableOpacity
                  key={iso}
                  testID={`day-${iso}`}
                  onPress={() => toggle(iso)}
                  style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayLeft}>
                    {isSelected ? (
                      <CheckCircle size={24} color={Colors.primary} />
                    ) : (
                      <Circle size={24} color={Colors.textSecondary} />
                    )}
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                        {label}
                      </Text>
                      <Text style={styles.expenseCount}>
                        {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        
        {selected.size > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity 
              testID="clear-days" 
              onPress={clearSelected} 
              style={styles.clearButton} 
              activeOpacity={0.8}
            >
              <Trash2 size={20} color={Colors.background} />
              <Text style={styles.clearButtonText}>
                Clear {selected.size} Day{selected.size !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  dayLabelSelected: {
    color: Colors.primary,
  },
  expenseCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});