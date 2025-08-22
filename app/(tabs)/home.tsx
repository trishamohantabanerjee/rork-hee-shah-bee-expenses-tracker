import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, TrendingDown, Utensils, Car, Zap, Gamepad2, ShoppingBag, Heart, GraduationCap, MoreHorizontal } from 'lucide-react-native';
import { Colors, CategoryColors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';
import { PieChart } from '@/components/PieChart';
import type { CategoryType } from '@/types/expense';

const { width } = Dimensions.get('window');

const categoryIcons: Record<CategoryType, React.ComponentType<any>> = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Gamepad2,
  Shopping: ShoppingBag,
  Healthcare: Heart,
  Education: GraduationCap,
  Others: MoreHorizontal,
};

export default function HomeTab() {
  const { 
    getTotalMonthlyExpenses, 
    getRemainingBudget, 
    getExpensesByCategory,
    addExpense,
    budget,
    t,
    expenses,
  } = useExpenseStore();

  const totalExpenses = getTotalMonthlyExpenses();
  const remainingBudget = getRemainingBudget();
  const categoryData = useMemo(() => getExpensesByCategory(), [expenses]);
  const isOverBudget = remainingBudget !== null && remainingBudget < 0;

  const allCategories: CategoryType[] = ['Food','Transport','Utilities','Entertainment','Shopping','Healthcare','Education','Others'];
  const [quickValues, setQuickValues] = useState<Record<CategoryType, string>>({
    Food: '', Transport: '', Utilities: '', Entertainment: '', Shopping: '', Healthcare: '', Education: '', Others: '',
  });
  const timersRef = useRef<Partial<Record<CategoryType, ReturnType<typeof setTimeout>>>>({});
  const flashesRef = useRef<Record<CategoryType, Animated.Value>>({
    Food: new Animated.Value(0),
    Transport: new Animated.Value(0),
    Utilities: new Animated.Value(0),
    Entertainment: new Animated.Value(0),
    Shopping: new Animated.Value(0),
    Healthcare: new Animated.Value(0),
    Education: new Animated.Value(0),
    Others: new Animated.Value(0),
  });

  const triggerFlash = (category: CategoryType) => {
    const v = flashesRef.current[category];
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const onQuickChange = async (category: CategoryType, text: string) => {
    const sanitized = text.replace(/[^0-9.]/g, '');
    setQuickValues(prev => ({ ...prev, [category]: sanitized }));

    const existing = timersRef.current[category];
    if (existing) clearTimeout(existing);

    timersRef.current[category] = setTimeout(async () => {
      const amount = parseFloat(sanitized);
      if (!isNaN(amount) && amount > 0) {
        const today = new Date().toISOString().split('T')[0];
        const success = await addExpense({ amount, category, date: today, notes: '' });
        if (success) {
          if (Platform.OS !== 'web') {
            try {
              const Haptics = await import('expo-haptics');
              await Haptics.selectionAsync();
            } catch (e) {
              console.log('Haptics not available');
            }
          }
          triggerFlash(category);
        }
      }
      setQuickValues(prev => ({ ...prev, [category]: '' }));
    }, 600);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t.appName}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <TrendingUp size={24} color="#FF6B6B" />
                <Text style={styles.statLabel}>{t.totalExpenses}</Text>
              </View>
              <Text style={styles.statValue}>₹{totalExpenses.toLocaleString()}</Text>
            </View>
            
            {budget && (
              <View style={[styles.statCard, isOverBudget && styles.overBudgetCard]}>
                <View style={styles.statHeader}>
                  <TrendingDown size={24} color={isOverBudget ? "#FF6B6B" : "#25D366"} />
                  <Text style={styles.statLabel}>
                    {isOverBudget ? t.overBudget : t.remainingBudget}
                  </Text>
                </View>
                <Text style={[styles.statValue, isOverBudget && styles.overBudgetText]}>
                  ₹{Math.abs(remainingBudget || 0).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.quickAddContainer}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickGrid}>
              {allCategories.map((cat) => {
                const Icon = categoryIcons[cat];
                const flash = flashesRef.current[cat].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(37,211,102,0)', 'rgba(37,211,102,0.25)'],
                });
                return (
                  <Animated.View key={cat} style={[styles.quickItem, { backgroundColor: flash }]}> 
                    <View style={styles.quickHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: CategoryColors[cat] + '20' }]}>
                        <Icon size={18} color={CategoryColors[cat]} />
                      </View>
                      <Text style={styles.quickLabel}>{t.categories[cat]}</Text>
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.currency}>₹</Text>
                      <TextInput
                        testID={`quick-input-${cat}`}
                        style={styles.quickInput}
                        value={quickValues[cat]}
                        onChangeText={(txt) => onQuickChange(cat, txt)}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
            <PieChart data={categoryData} size={Math.min(width * 0.8, 250)} />
          </View>
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/add-expense')}
          activeOpacity={0.8}
          testID="home-add-expense"
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001F3F',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#002A5C',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#004080',
  },
  overBudgetCard: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B15',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overBudgetText: {
    color: '#FF6B6B',
  },
  quickAddContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickItem: {
    width: '48%',
    backgroundColor: '#002A5C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004080',
    padding: 12,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001A33',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  currency: {
    color: '#25D366',
    fontSize: 18,
    marginRight: 6,
  },
  quickInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});