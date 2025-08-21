import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Download, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';

export default function ReportsScreen() {
  const { expenses, getExpensesByCategory, t } = useExpenseStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const getFilteredExpenses = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }
    
    return expenses.filter(expense => new Date(expense.date) >= startDate);
  };

  const filteredExpenses = getFilteredExpenses();
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryData = getExpensesByCategory();

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'Export functionality would generate a CSV/PDF file with your expense data.',
      [{ text: 'OK' }]
    );
  };

  const renderBarChart = () => {
    const maxAmount = Math.max(...Object.values(categoryData));
    
    return (
      <View style={styles.chartContainer}>
        {Object.entries(categoryData).map(([category, amount]) => (
          <View key={category} style={styles.barItem}>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: maxAmount > 0 ? (amount / maxAmount) * 100 : 0,
                    backgroundColor: Colors.primary 
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{category}</Text>
            <Text style={styles.barValue}>₹{amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.reports}</Text>
            
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'weekly' && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod('weekly')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === 'weekly' && styles.periodButtonTextActive
                ]}>
                  {t.weekly}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'monthly' && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod('monthly')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === 'monthly' && styles.periodButtonTextActive
                ]}>
                  {t.monthly}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <BarChart3 size={24} color={Colors.primary} />
              <Text style={styles.summaryTitle}>
                {selectedPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
              </Text>
            </View>
            <Text style={styles.summaryAmount}>₹{totalAmount.toLocaleString()}</Text>
            <Text style={styles.summarySubtext}>
              {filteredExpenses.length} transactions
            </Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Expenses by Category</Text>
            {Object.keys(categoryData).length > 0 ? (
              renderBarChart()
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>No expenses to show</Text>
              </View>
            )}
          </View>

          <View style={styles.recentExpenses}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {filteredExpenses.slice(0, 10).map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                  {expense.notes && (
                    <Text style={styles.expenseNotes}>{expense.notes}</Text>
                  )}
                </View>
                <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Download size={20} color={Colors.background} />
          <Text style={styles.exportButtonText}>{t.export}</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  periodButtonTextActive: {
    color: Colors.background,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  recentExpenses: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  expenseNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});