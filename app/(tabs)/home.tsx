import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useExpenseStore } from '../../hooks/expense-store';
import { PieChart } from '../../components/PieChart';

const { width } = Dimensions.get('window');

export default function HomeTab() {
  const { 
    getTotalMonthlyExpenses, 
    getRemainingBudget, 
    getExpensesByCategory,
    budget,
    t
  } = useExpenseStore();

  const totalExpenses = getTotalMonthlyExpenses();
  const remainingBudget = getRemainingBudget();
  const categoryData = getExpensesByCategory();
  const isOverBudget = remainingBudget !== null && remainingBudget < 0;

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

          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
            <PieChart data={categoryData} size={Math.min(width * 0.8, 250)} />
          </View>
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/add-expense')}
          activeOpacity={0.8}
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
    marginBottom: 32,
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
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