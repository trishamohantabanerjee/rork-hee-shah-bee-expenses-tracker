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

    import {
      Plus,
      Download,
      PieChart as PieChartIcon,
      Target,
      Clock,
      IndianRupee
    } from 'lucide-react-native';
    import * as Clipboard from 'expo-clipboard';
    import { Colors } from '@/constants/colors';
    import { useExpenseStore } from '@/hooks/expense-store';
    import { PieChart } from '@/components/PieChart';

    export default function HomeScreen() {
      const {
        expenses,
        budget,
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

      // Removed: Total spent till now (all-time)
      // const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);

      const handleExport = async () => {
        const csv = `Date,Category,Amount,Notes,PaymentType\n${expenses.map(e => `"${e.date}","${e.category}","${e.amount}","${e.notes || ''}","${e.paymentType || 'Cash'}"`).join('\n')}`;
        await Clipboard.setStringAsync(csv);
        Alert.alert('Exported', 'Copied in Excel/Sheets compatible format!');
      };

      const handleSummaryTap = (type: string) => {
        let message = '';
        switch (type) {
          case 'monthly':
            message = `Total Spent This Month: ₹${totalMonthly.toLocaleString()}
${monthlyExpenses.length} transactions`;
            break;
          case 'remaining':
            message = remainingBudget !== null
              ? `Remaining Budget: ₹${remainingBudget.toLocaleString()}`
              : 'No budget set';
            break;
        }
        Alert.alert('Summary', message);
      };

      return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
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

            {/* Updated Summary Cards */}
            <View style={styles.summaryContainer}>
              <TouchableOpacity
                style={[styles.summaryCard, { backgroundColor: Colors.card }]}
                onPress={() => router.push('/budget')}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Target size={24} color={Colors.primary} />
                  <Text style={[styles.cardLabel, { color: Colors.textSecondary }]}>
                    Monthly Budget
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: Colors.text }]}>
                  ₹{budget?.monthly.toLocaleString() || '0'}
                </Text>
                {remainingBudget !== null && (
                  <Text style={[styles.cardSubtext, { color: remainingBudget > 0 ? '#10B981' : '#EF4444' }]}>
                    {remainingBudget > 0 ? `₹${remainingBudget.toLocaleString()} left` : `₹${Math.abs(remainingBudget).toLocaleString()} over`}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summaryCard, { backgroundColor: Colors.card }]}
                onPress={() => handleSummaryTap('monthly')}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Clock size={24} color={Colors.primary} />
                  <Text style={[styles.cardLabel, { color: Colors.textSecondary }]}>
                    Spent This Month
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: Colors.text }]}>
                  ₹{totalMonthly.toLocaleString()}
                </Text>
                <Text style={[styles.cardSubtext, { color: Colors.textSecondary }]}>
                  {monthlyExpenses.length} transactions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summaryCard, { backgroundColor: Colors.card }]}
                onPress={() => handleSummaryTap('remaining')}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <IndianRupee size={24} color={Colors.primary} />
                  <Text style={[styles.cardLabel, { color: Colors.textSecondary }]}>
                    Remaining Budget
                  </Text>
                </View>
                <Text style={[styles.cardValue, { color: Colors.text }]}>
                  ₹{remainingBudget !== null ? remainingBudget.toLocaleString() : '0'}
                </Text>
                <Text style={[styles.cardSubtext, { color: remainingBudget !== null && remainingBudget > 0 ? '#10B981' : '#EF4444' }]}>
                  {remainingBudget !== null ? (remainingBudget > 0 ? 'Available' : 'Over budget') : 'Set budget'}
                </Text>
              </TouchableOpacity>
            </View>

            {Object.keys(expensesByCategory).length > 0 && (
              <View style={[styles.chartCard, { backgroundColor: Colors.card }]}>
                <View style={styles.chartHeader}>
                  <PieChartIcon size={24} color={Colors.text} />
                  <Text style={[styles.chartTitle, { color: Colors.text }]}>
                    Category Breakdown (This Month)
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
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
        padding: Platform.OS === 'android' ? 18 : 16, // Slightly more padding on Android
        paddingBottom: Platform.OS === 'android' ? 24 : 16, // Extra bottom padding on Android
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
      summaryContainer: {
        marginBottom: 24,
      },
      summaryCard: {
        padding: Platform.OS === 'android' ? 18 : 20,
        borderRadius: 16,
        marginBottom: Platform.OS === 'android' ? 14 : 12,
        borderWidth: 1,
        borderColor: Colors.border,
        // Better visual hierarchy on mobile
        ...(Platform.OS !== 'web' && {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }),
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      },
      cardLabel: {
        fontSize: 14,
        marginLeft: 8,
      },
      cardValue: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        marginBottom: 4,
      },
      cardSubtext: {
        fontSize: 12,
      },
      chartCard: {
        padding: Platform.OS === 'android' ? 18 : 20,
        borderRadius: 16,
        marginBottom: 24,
        // Better positioning and spacing for mobile
        ...(Platform.OS !== 'web' && {
          marginHorizontal: 2, // Slight margin for better visual spacing
        }),
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
        marginBottom: Platform.OS === 'android' ? 32 : 24, // More space on Android
      },
      actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Platform.OS === 'android' ? 18 : 16, // Slightly larger on Android
        borderRadius: 16,
        gap: 8,
        // Better positioning for mobile platforms
        ...(Platform.OS !== 'web' && {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }),
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