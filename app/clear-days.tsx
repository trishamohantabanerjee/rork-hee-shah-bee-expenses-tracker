import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useExpenseStore } from '@/hooks/expense-store';

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ClearDaysScreen() {
  const { clearDailyData } = useExpenseStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const recentDays = useMemo(() => {
    const arr: { iso: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = toISODate(d);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : iso;
      arr.push({ iso, label });
    }
    return arr;
  }, []);

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
        Alert.alert('Nothing selected', 'Choose at least one day');
        return;
      }
      let allOk = true;
      for (const iso of Array.from(selected)) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await clearDailyData(iso);
        if (!ok) allOk = false;
      }
      Alert.alert(allOk ? 'Cleared' : 'Partial', allOk ? 'Deleted all selected days' : 'Some days failed to delete');
      setSelected(new Set());
    } catch {
      Alert.alert('Error', 'Failed to clear');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clear specific day(s)</Text>
      <Text style={styles.subtitle}>Tap to select one or more recent days to delete all entries from.</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {recentDays.map(({ iso, label }) => {
          const active = selected.has(iso);
          return (
            <TouchableOpacity
              key={iso}
              testID={`day-${iso}`}
              onPress={() => toggle(iso)}
              style={[styles.chip, active ? styles.chipActive : null]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity testID="clear-days" onPress={clearSelected} style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Clear Selected Days</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001F3F', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  subtitle: { color: '#B0B0B0', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  chip: { width: '48%', marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: '#004080', backgroundColor: '#002A5C', paddingVertical: 12, alignItems: 'center' },
  chipActive: { borderColor: '#25D366', backgroundColor: '#003463' },
  chipText: { color: '#FFFFFF' },
  chipTextActive: { color: '#25D366', fontWeight: '700' as const },
  button: { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#001F3F', fontSize: 16, fontWeight: '700' },
});
