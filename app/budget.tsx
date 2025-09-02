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
  const { budget, updateBudget, getTotalMonthlyExpenses, t, getMonthlyEMITotal } = useExpenseStore();
  const [budgetAmount, setBudgetAmount] = useState(budget?.monthly.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const totalExpenses = getTotalMonthlyExpenses();
  const monthlyEMITotal = getMonthlyEMITotal();
  const currentBudget = budget?.monthly || 0;
  const remaining = currentBudget - totalExpenses - monthlyEMITotal;
  const progressPercentage = currentBudget > 0 ? ((totalExpenses + monthlyEMITotal) / currentBudget) * 100 : 0;

  const sanitizeNumeric = (text: string) => text.replace(/[^0-9.]/g, '');

  const handleSave = async () => {
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
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
      Alert.alert('Success', t.budgetSet, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to set budget');
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
          {budget && (
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
                  <Text style={styles.statLabel}>EMI</Text>
                  <Text style={styles.statValue}>₹{monthlyEMITotal.toLocaleString()}</Text>
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
            <Text style={styles.inputLabel}>{t.monthlyBudget}</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={budgetAmount}
                onChangeText={(txt) => setBudgetAmount(sanitizeNumeric(txt))}
                placeholder="Enter budget amount"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                autoFocus={!budget}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Save size={20} color={Colors.background} />
          <Text style={styles.saveButtonText}>{t.save}</Text>
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
});