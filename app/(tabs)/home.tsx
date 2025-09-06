import React, { useState } from 'react';
    import {
      View,
      Text,
      StyleSheet,
      ScrollView,
      TouchableOpacity,
      Alert,
      Platform,
      TextInput,
      Modal
    } from 'react-native';
    import { router } from 'expo-router';

    import {
      Plus,
      Download,
      PieChart as PieChartIcon,
      Target,
      Clock,
      IndianRupee,
      Edit3,
      Save,
      X
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
        updateBudget,
        t
      } = useExpenseStore();
      
      const [showBudgetModal, setShowBudgetModal] = useState(false);
      const [budgetInput, setBudgetInput] = useState('');
      const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

      const monthlyExpenses = getCurrentMonthExpenses();
      const totalMonthly = getTotalMonthlyExpenses();
      const remainingBudget = getRemainingBudget();
      const expensesByCategory = getExpensesByCategory();
      
      // MATHEMATICAL LOGIC EXPLANATION:
      // Monthly Budget: User sets this amount (e.g., 70,000)
      // Total Expenses: Sum of all expenses (positive amounts add, negative amounts subtract)
      // Remaining Budget: Monthly Budget - Total Expenses
      // Example: 70,000 - 6,000 = 64,000 remaining

      const handleExport = async () => {
        const csv = `Date,Category,Amount,Notes,PaymentType\n${expenses.map(e => `"${e.date}","${e.category}","${e.amount}","${e.notes || ''}","${e.paymentType || 'Cash'}"`).join('\n')}`;
        await Clipboard.setStringAsync(csv);
        Alert.alert('Exported', 'Copied in Excel/Sheets compatible format!');
      };

      const handleSummaryTap = (type: string) => {
        let message = '';
        switch (type) {
          case 'monthly':
            message = `Total Spent This Month: ₹${totalMonthly.toLocaleString()}\n${monthlyExpenses.length} transactions`;
            break;
          case 'remaining':
            if (remainingBudget !== null && budget) {
              message = `Budget: ₹${budget.monthly.toLocaleString()}\nSpent: ₹${totalMonthly.toLocaleString()}\nRemaining: ₹${remainingBudget.toLocaleString()}\n\nCalculation: ${budget.monthly.toLocaleString()} - ${totalMonthly.toLocaleString()} = ${remainingBudget.toLocaleString()}`;
            } else {
              message = 'No budget set. Tap to set your monthly budget.';
            }
            break;
        }
        Alert.alert('Budget Summary', message);
      };
      
      const handleSetBudget = () => {
        setBudgetInput(budget?.monthly.toString() || '');
        setShowBudgetModal(true);
      };
      
      const handleSaveBudget = async () => {
        const amount = parseFloat(budgetInput);
        if (!amount || amount <= 0) {
          Alert.alert('Error', 'Please enter a valid budget amount');
          return;
        }
        
        setIsUpdatingBudget(true);
        const now = new Date();
        const success = await updateBudget({
          monthly: amount,
          year: now.getFullYear(),
          month: now.getMonth(),
        });
        
        setIsUpdatingBudget(false);
        
        if (success) {
          setShowBudgetModal(false);
          Alert.alert('Success', 'Monthly budget updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to update budget');
        }
      };
      
      const sanitizeNumeric = (text: string) => text.replace(/[^0-9.]/g, '');

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

            {/* UPDATED: Budget Setting Card with Direct Edit */}
            <View style={styles.summaryContainer}>
              <TouchableOpacity
                style={[styles.summaryCard, { backgroundColor: Colors.card }]}
                onPress={handleSetBudget}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Target size={24} color={Colors.primary} />
                  <Text style={[styles.cardLabel, { color: Colors.textSecondary }]}>
                    Monthly Budget
                  </Text>
                  <Edit3 size={16} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                </View>
                <Text style={[styles.cardValue, { color: Colors.text }]}>
                  ₹{budget?.monthly.toLocaleString() || 'Set Budget'}
                </Text>
                {remainingBudget !== null && budget && (
                  <Text style={[styles.cardSubtext, { color: remainingBudget >= 0 ? '#10B981' : '#EF4444' }]}>
                    {remainingBudget >= 0 ? `₹${remainingBudget.toLocaleString()} remaining` : `₹${Math.abs(remainingBudget).toLocaleString()} over budget`}
                  </Text>
                )}
                {!budget && (
                  <Text style={[styles.cardSubtext, { color: Colors.textSecondary }]}>
                    Tap to set your monthly budget
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
                <Text style={[styles.cardSubtext, { color: remainingBudget !== null && remainingBudget >= 0 ? '#10B981' : '#EF4444' }]}>
                  {remainingBudget !== null ? (remainingBudget >= 0 ? 'Available to spend' : 'Over budget') : 'Set budget first'}
                </Text>
                {budget && remainingBudget !== null && (
                  <Text style={[styles.cardSubtext, { color: Colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                    {budget.monthly.toLocaleString()} - {totalMonthly.toLocaleString()} = {remainingBudget.toLocaleString()}
                  </Text>
                )}
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
          
          {/* Budget Setting Modal */}
          <Modal
            visible={showBudgetModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowBudgetModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: Colors.text }]}>Set Monthly Budget</Text>
                  <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                    <X size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.modalDescription, { color: Colors.textSecondary }]}>
                  Set your monthly budget to track your spending. All expenses will be deducted from this amount.
                </Text>
                
                <View style={styles.budgetInputContainer}>
                  <Text style={[styles.currencySymbol, { color: Colors.primary }]}>₹</Text>
                  <TextInput
                    style={[styles.budgetInput, { color: Colors.text, borderColor: Colors.border }]}
                    value={budgetInput}
                    onChangeText={(text) => setBudgetInput(sanitizeNumeric(text))}
                    placeholder="Enter budget amount"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    autoFocus={true}
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { borderColor: Colors.border }]}
                    onPress={() => setShowBudgetModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: Colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: Colors.primary }]}
                    onPress={handleSaveBudget}
                    disabled={isUpdatingBudget}
                  >
                    <Save size={16} color={Colors.background} />
                    <Text style={[styles.saveButtonText, { color: Colors.background }]}>
                      {isUpdatingBudget ? 'Saving...' : 'Save Budget'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
      scrollView: {
        flex: 1,
        padding: Platform.OS === 'android' ? 20 : 16, // Better padding on Android
        paddingBottom: Platform.OS === 'android' ? 32 : 20, // More bottom padding on Android
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
        // IMPROVED positioning and spacing for mobile platforms
        ...(Platform.OS !== 'web' && {
          marginHorizontal: 4, // Better margin for visual spacing
          alignSelf: 'center', // Center the chart card
          maxWidth: '100%', // Prevent overflow
        }),
        // Additional styling for better UI/UX
        borderWidth: 1,
        borderColor: Colors.border,
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
      // Modal styles
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: '600' as const,
      },
      modalDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
      },
      budgetInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
      },
      currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        marginRight: 8,
      },
      budgetInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold' as const,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderRadius: 12,
      },
      modalButtons: {
        flexDirection: 'row',
        gap: 12,
      },
      modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
      },
      cancelButton: {
        borderWidth: 1,
      },
      saveButton: {
        // backgroundColor set dynamically
      },
      cancelButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
      },
      saveButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
      },
    });