import React from 'react';
    import {
      View,
      Text,
      StyleSheet,
      ScrollView,
      TouchableOpacity,
      Alert,
      Platform
    } from 'react-native';
    import { router } from 'expo-router';
    import { SafeAreaView } from 'react-native-safe-area-context';
    import {
      Plus,
      TrendingUp,
      Download,
      Calendar,
      PieChart as PieChartIcon
    } from 'lucide-react-native';
    import * as Clipboard from 'expo-clipboard';
    import { Colors } from '@/constants/colors';
    import { useExpenseStore } from '@/hooks/expense-store';
    import { PieChart } from '@/components/PieChart';

    export default function HomeScreen() {
      const {
        expenses,
        budget,
        settings,
        getCurrentMonthExpenses,
        getTotalMonthlyExpenses,
        getRemainingBudget,
        getExpensesByCategory,
        t
      } = useExpenseStore();

      const monthlyExpenses = getCurrentMonthExpenses();
      const totalMonthly = getTotalMonthlyExpenses();
      const remainingBudget = getRemainingBudget();
      const expensesByCategory = getExpensesByCategory();

      const handleExport = async () => {
        const csv = `Date,Category,Amount,Notes,PaymentType
    ${expenses.map(e => `"${e.date}","${e.category}","${e.amount}","${e.notes || ''}","${e.paymentType || 'Cash'}"`).join('\n')}`;
        await Clipboard.setStringAsync(csv);
        Alert.alert('Exported', 'Copied in Excel/Sheets compatible format!');
      };

      const today = new Date().toISOString().split('T')[0];
      const todayExpenses = expenses.filter(e => e.date === today);
      const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

      return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: Colors.text }]}>
                {t.home}
              </Text>
              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: Colors.card }]}
                onPress={handleExport}
              >
                <Download size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: Colors.card }]}>
                <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                  Today's Spent
                </Text>
                <Text style={[styles.statValue, { color: Colors.text }]}>
                  ₹{todayTotal.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: Colors.card }]}>
                <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
                  {t.monthly} Spent
                </Text>
                <Text style={[styles.statValue, { color: Colors.text }]}>
                  ₹{totalMonthly.toLocaleString()}
                </Text>
              </View>
            </View>

            {budget && (
              <View style={[styles.budgetCard, { backgroundColor: Colors.card }]}>
                <View style={styles.budgetHeader}>
                  <TrendingUp size={24} color={remainingBudget && remainingBudget > 0 ? '#10B981' : '#EF4444'} />
                  <Text style={[styles.budgetTitle, { color: Colors.text }]}>
                    {t.budget}
                  </Text>
                </View>
                <Text style={[styles.budgetAmount, { color: remainingBudget && remainingBudget > 0 ? '#10B981' : '#EF4444' }]}>
                  ₹{remainingBudget?.toLocaleString() || '0'} Remaining
                </Text>
                <View style={styles.budgetProgress}>
                  <View
                    style={[
                      styles.budgetProgressBar,
                      {
                        width: `${Math.min((totalMonthly / budget.monthly) * 100, 100)}%`,
                        backgroundColor: totalMonthly > budget.monthly ? '#EF4444' : '#10B981'
                      }
                    ]}
                  />
                </View>
              </View>
            )}

            {Object.keys(expensesByCategory).length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: Colors.card }]}>
                <View style={styles.chartHeader}>
                  <PieChartIcon size={24} color={Colors.text} />
                  <Text style={[styles.chartTitle, { color: Colors.text }]}>
                    Category Breakdown
                  </Text>
                </View>
                <PieChart data={expensesByCategory} />
              </View>
            )}

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                onPress={() => router.push('/add-expense')}
              >
                <Plus size={24} color="white" />
                <Text style={styles.actionButtonText}>{t.addExpense}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.card }]}
                onPress={() => router.push('/budget')}
              >
                <Calendar size={24} color={Colors.text} />
                <Text style={[styles.actionButtonText, { color: Colors.text }]}>
                  {t.budget}
                </Text>
              </TouchableOpacity>
            </View>

            {monthlyExpenses.length > 0 && (
              <View style={[styles.recentCard, { backgroundColor: Colors.card }]}>
                <Text style={[styles.recentTitle, { color: Colors.text }]}>
                  Recent Expenses
                </Text>
                {monthlyExpenses.slice(0, 5).map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseInfo}>
                      <Text style={[styles.expenseCategory, { color: Colors.text }]}>
                        {expense.category}
                      </Text>
                      <Text style={[styles.expenseDate, { color: Colors.textSecondary }]}>
                        {new Date(expense.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.expenseAmount, { color: Colors.text }]}>
                      ₹{expense.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
        padding: 16,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold' as const,
      },
      exportButton: {
        padding: 12,
        borderRadius: 12,
      },
      statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
      },
      statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
      },
      statLabel: {
        fontSize: 14,
        marginBottom: 8,
      },
      statValue: {
        fontSize: 24,
        fontWeight: 'bold' as const,
      },
      budgetCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
      },
      budgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      },
      budgetTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        marginLeft: 8,
      },
      budgetAmount: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        marginBottom: 16,
      },
      budgetProgress: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
      },
      budgetProgressBar: {
        height: '100%',
        borderRadius: 4,
      },
      chartCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
      },
      chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
      },
      chartTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        marginLeft: 8,
      },
      quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
      },
      actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
      },
      actionButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
      },
      recentCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
      },
      recentTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        marginBottom: 16,
      },
      expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      },
      expenseInfo: {
        flex: 1,
      },
      expenseCategory: {
        fontSize: 16,
        fontWeight: '500' as const,
        marginBottom: 4,
      },
      expenseDate: {
        fontSize: 14,
      },
      expenseAmount: {
        fontSize: 16,
        fontWeight: '600' as const,
      },
    });