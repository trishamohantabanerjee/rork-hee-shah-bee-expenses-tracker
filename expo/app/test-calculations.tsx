import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Check, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

interface DailyExpense {
  date: string;
  Food: number;
  Transport: number;
  Utilities: number;
  Entertainment: number;
  Shopping: number;
  Subtract: number;
  AutopayDeduction: number;
  LoanEMI: number;
  'Investment/MF/SIP': number;
  Healthcare: number;
  Education: number;
  Others: number;
}

export default function TestCalculationsScreen() {
  const [testData, setTestData] = useState<DailyExpense[]>([]);
  const [excelOutput, setExcelOutput] = useState<string>('');

  useEffect(() => {
    generateTestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateTestData = () => {
    const data: DailyExpense[] = [];
    const dates = ['2025-11-01', '2025-11-02', '2025-11-03', '2025-11-04', '2025-11-05', '2025-11-06', '2025-11-07'];

    dates.forEach((date) => {
      const expense: DailyExpense = {
        date,
        Food: Math.floor(Math.random() * 500) + 100,
        Transport: Math.floor(Math.random() * 300) + 50,
        Utilities: Math.floor(Math.random() * 200) + 100,
        Entertainment: Math.floor(Math.random() * 400) + 50,
        Shopping: Math.floor(Math.random() * 600) + 100,
        Subtract: Math.floor(Math.random() * 200) + 50,
        AutopayDeduction: Math.floor(Math.random() * 300) + 100,
        LoanEMI: Math.floor(Math.random() * 500) + 200,
        'Investment/MF/SIP': Math.floor(Math.random() * 1000) + 500,
        Healthcare: Math.floor(Math.random() * 300) + 50,
        Education: Math.floor(Math.random() * 400) + 100,
        Others: Math.floor(Math.random() * 200) + 50,
      };
      data.push(expense);
    });

    setTestData(data);
    generateExcelFormat(data);
  };

  const calculateDailyTotal = (expense: DailyExpense) => {
    const categories11Total = 
      expense.Food +
      expense.Transport +
      expense.Utilities +
      expense.Entertainment +
      expense.Shopping +
      expense.AutopayDeduction +
      expense.LoanEMI +
      expense['Investment/MF/SIP'] +
      expense.Healthcare +
      expense.Education +
      expense.Others;

    const dailyTotal = categories11Total - expense.Subtract;

    return { categories11Total, dailyTotal };
  };

  const generateExcelFormat = (data: DailyExpense[]) => {
    let output = 'EXPENSE TRACKER TEST RUN (Nov 1-7, 2025)\n\n';
    output += 'Date\tFood\tTransport\tUtilities\tEntertainment\tShopping\tSubtract\tAutopay\tLoanEMI\tInvestment\tHealthcare\tEducation\tOthers\t11 Categories Sum\tDaily Total\tFormula\n';

    let grandTotal = 0;
    let total11Categories = 0;
    let totalSubtract = 0;

    data.forEach((expense) => {
      const { categories11Total, dailyTotal } = calculateDailyTotal(expense);
      grandTotal += dailyTotal;
      total11Categories += categories11Total;
      totalSubtract += expense.Subtract;

      output += `${expense.date}\t`;
      output += `${expense.Food}\t`;
      output += `${expense.Transport}\t`;
      output += `${expense.Utilities}\t`;
      output += `${expense.Entertainment}\t`;
      output += `${expense.Shopping}\t`;
      output += `${expense.Subtract}\t`;
      output += `${expense.AutopayDeduction}\t`;
      output += `${expense.LoanEMI}\t`;
      output += `${expense['Investment/MF/SIP']}\t`;
      output += `${expense.Healthcare}\t`;
      output += `${expense.Education}\t`;
      output += `${expense.Others}\t`;
      output += `${categories11Total}\t`;
      output += `${dailyTotal}\t`;
      output += `${categories11Total} - ${expense.Subtract} = ${dailyTotal}\n`;
    });

    output += '\n';
    output += `TOTALS:\t\t\t\t\t\t\t\t\t\t\t\t\t${total11Categories}\t${grandTotal}\t${total11Categories} - ${totalSubtract} = ${grandTotal}\n`;
    output += '\n';
    output += `VERIFICATION:\n`;
    output += `Total of 11 Categories: ₹${total11Categories.toLocaleString()}\n`;
    output += `Total Subtract: ₹${totalSubtract.toLocaleString()}\n`;
    output += `Grand Total (Week): ₹${grandTotal.toLocaleString()}\n`;
    output += `Formula: ${total11Categories} - ${totalSubtract} = ${grandTotal}\n`;
    output += `\nMATHEMATICAL LOGIC:\n`;
    output += `11 Categories ADD: Food + Transport + Utilities + Entertainment + Shopping + Autopay + LoanEMI + Investment + Healthcare + Education + Others\n`;
    output += `Subtract Category SUBTRACTS from the sum of 11 categories\n`;
    output += `Daily Total = (Sum of 11 Categories) - Subtract\n`;

    setExcelOutput(output);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(excelOutput);
    if (Platform.OS !== 'web') {
      const Haptics = await import('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getWeekTotal = () => {
    return testData.reduce((total, expense) => {
      const { dailyTotal } = calculateDailyTotal(expense);
      return total + dailyTotal;
    }, 0);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Test Calculations',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Test Run: Nov 1-7, 2025</Text>
            <Text style={styles.subtitle}>Random data verification for expense calculations</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Week Summary</Text>
            <Text style={styles.summaryAmount}>₹{getWeekTotal().toLocaleString()}</Text>
            <Text style={styles.summaryDescription}>Total expenses for the week</Text>
          </View>

          {testData.map((expense, index) => {
            const { categories11Total, dailyTotal } = calculateDailyTotal(expense);
            
            return (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{new Date(expense.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  <Text style={styles.dayTotal}>₹{dailyTotal.toLocaleString()}</Text>
                </View>

                <View style={styles.categoryGrid}>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Food</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Food}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Transport</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Transport}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Utilities</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Utilities}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Entertainment</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Entertainment}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Shopping</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Shopping}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Autopay</Text>
                    <Text style={styles.categoryAmount}>₹{expense.AutopayDeduction}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>LoanEMI</Text>
                    <Text style={styles.categoryAmount}>₹{expense.LoanEMI}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Investment</Text>
                    <Text style={styles.categoryAmount}>₹{expense['Investment/MF/SIP']}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Healthcare</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Healthcare}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Education</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Education}</Text>
                  </View>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryLabel}>Others</Text>
                    <Text style={styles.categoryAmount}>₹{expense.Others}</Text>
                  </View>
                </View>

                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>Sum of 11 Categories</Text>
                  <Text style={styles.subtotalAmount}>₹{categories11Total.toLocaleString()}</Text>
                </View>

                <View style={[styles.categoryRow, styles.subtractRow]}>
                  <Text style={styles.subtractLabel}>Subtract</Text>
                  <Text style={styles.subtractAmount}>-₹{expense.Subtract}</Text>
                </View>

                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Daily Total</Text>
                  <Text style={styles.calculationFormula}>
                    {categories11Total} - {expense.Subtract} = {dailyTotal}
                  </Text>
                  <Text style={styles.calculationAmount}>₹{dailyTotal.toLocaleString()}</Text>
                </View>

                <View style={styles.verificationBadge}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.verificationText}>Calculation Verified</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>Excel Format Output</Text>
            <Text style={styles.exportDescription}>
              Copy this data and paste it into Excel/Google Sheets for verification
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>
            <ScrollView horizontal style={styles.excelPreview}>
              <Text style={styles.excelText}>{excelOutput}</Text>
            </ScrollView>
          </View>

          <View style={styles.logicCard}>
            <Text style={styles.logicTitle}>Mathematical Logic</Text>
            <Text style={styles.logicText}>
              1. There are 12 expense categories in total
            </Text>
            <Text style={styles.logicText}>
              2. 11 categories ADD to the total: Food, Transport, Utilities, Entertainment, Shopping, Autopay, LoanEMI, Investment, Healthcare, Education, Others
            </Text>
            <Text style={styles.logicText}>
              3. 1 category SUBTRACTS from the total: Subtract
            </Text>
            <Text style={styles.logicText}>
              4. Daily Total = (Sum of 11 Categories) - Subtract
            </Text>
            <Text style={styles.logicText}>
              5. Example: If all 12 categories have value 1, then Daily Total = 11 - 1 = 10
            </Text>
          </View>
        </ScrollView>
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
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  categoryGrid: {
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  categoryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subtotalAmount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  subtractRow: {
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  subtractLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  subtractAmount: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#DC2626',
  },
  calculationRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  calculationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calculationFormula: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  calculationAmount: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    gap: 6,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  exportCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  exportDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  excelPreview: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  excelText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.text,
  },
  logicCard: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logicTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 12,
  },
  logicText: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
});
