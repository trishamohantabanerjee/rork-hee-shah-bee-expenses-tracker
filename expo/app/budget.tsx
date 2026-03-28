import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Target } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';

export default function BudgetScreen() {
  const { budget, updateBudget, getTotalMonthlyExpenses, t, getExpensesByCategory } = useExpenseStore();
  const [budgetAmount, setBudgetAmount] = useState(budget?.monthly.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  // REQUIREMENT 2: Calculation Logic - Use correct mathematical logic
  const totalExpenses = getTotalMonthlyExpenses();
  const expensesByCategory = getExpensesByCategory();
  const currentBudget = budget?.monthly || 0;
  // FIXED: Remaining = Budget - Total Expenses
  const remaining = currentBudget - totalExpenses;
  const progressPercentage = currentBudget > 0 ? (totalExpenses / currentBudget) * 100 : 0;

  // Check if this is a new month setup
  const now = new Date();
  const isNewMonthSetup = !budget || 
    budget.year !== now.getFullYear() || 
    budget.month !== now.getMonth();

  const sanitizeNumeric = (text: string) => text.replace(/[^0-9.]/g, '');

  const handleSave = async () => {
    // REQUIREMENT 3: Edge Case Handling - Comprehensive validation
    const amount = parseFloat(budgetAmount);
    
    // Validate input
    if (!budgetAmount.trim()) {
      Alert.alert('Input Required', 'Please enter your monthly budget amount.');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount greater than zero.');
      return;
    }
    
    if (amount > 100000000) {
      Alert.alert('Amount Too Large', 'Budget amount cannot exceed ₹10 crores for security reasons.');
      return;
    }
    
    if (amount < 100) {
      Alert.alert('Amount Too Small', 'Budget amount should be at least ₹100 for practical tracking.');
      return;
    }

    setIsLoading(true);
    
    const now = new Date();
    const success = await updateBudget({
      monthly: amount,
      year: now.getFullYear(),
      month: now.getMonth(),
    });

    setIsLoading(false);

    if (success) {
      // REQUIREMENT: Automatically redirect to home after setting budget
      router.replace('/(tabs)/home');
      // Show success message after navigation
      setTimeout(() => {
        const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        Alert.alert(
          'Budget Set Successfully!', 
          `Your monthly budget of ₹${amount.toLocaleString()} for ${monthName} has been saved. You can now track your expenses against this budget.`
        );
      }, 100);
    } else {
      Alert.alert('Error', 'Failed to set budget. Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: t.setBudget,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Welcome message for new month setup */}
          {isNewMonthSetup && (
            <View style={[styles.welcomeCard, { backgroundColor: Colors.primary, marginBottom: 20 }]}>
              <Text style={[styles.welcomeTitle, { color: Colors.background }]}>
                {budget ? 'New Month Setup' : 'Welcome to HeeSaaBee!'}
              </Text>
              <Text style={[styles.welcomeText, { color: Colors.background }]}>
                {budget 
                  ? `Set your budget for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to start tracking expenses.`
                  : 'Set your monthly budget to start tracking your expenses effectively.'
                }
              </Text>
            </View>
          )}
          
          {budget && !isNewMonthSetup && (
            <View style={styles.currentBudgetCard}>
              <View style={styles.budgetHeader}>
                <Target size={24} color={Colors.primary} />
                <Text style={styles.budgetTitle}>Current Budget</Text>
              </View>
              
              <Text style={styles.budgetAmount}>₹{currentBudget.toLocaleString()}</Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: progressPercentage > 100 ? Colors.error : Colors.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressPercentage.toFixed(1)}% used
                </Text>
              </View>
              
              <View style={styles.budgetStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Spent</Text>
                  <Text style={styles.statValue}>₹{totalExpenses.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Categories</Text>
                  <Text style={styles.statValue}>{Object.keys(expensesByCategory).length}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={[
                    styles.statValue,
                    { color: remaining < 0 ? Colors.error : Colors.primary }
                  ]}>
                    ₹{Math.abs(remaining).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>
              {isNewMonthSetup 
                ? `Monthly Budget for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` 
                : t.monthlyBudget
              }
            </Text>
            <Text style={[styles.inputHint, { color: Colors.textSecondary, marginBottom: 12 }]}>
              Enter the total amount you plan to spend this month. All your expenses will be tracked against this budget.
            </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={budgetAmount}
                onChangeText={(txt) => setBudgetAmount(sanitizeNumeric(txt))}
                placeholder="e.g., 50000"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                autoFocus={true}
                selectTextOnFocus={true}
              />
            </View>
            {budgetAmount && parseFloat(budgetAmount) > 0 && (
              <Text style={[styles.previewText, { color: Colors.primary, marginTop: 8 }]}>
                Budget: ₹{parseFloat(budgetAmount).toLocaleString()}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save size={20} color={Colors.background} />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Setting Budget...' : (isNewMonthSetup ? 'Set Budget & Continue' : 'Update Budget')}
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentBudgetCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  inputCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    paddingVertical: 8,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
  },
});