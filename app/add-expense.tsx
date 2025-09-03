import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Save, 
  X, 
  Calendar,
  Utensils,
  Car,
  Zap,
  Gamepad2,
  ShoppingBag,
  Heart,
  GraduationCap,
  MoreHorizontal,
  Minus,
  CreditCard,
  IndianRupee
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';
import type { CategoryType, PaymentType } from '@/types/expense';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

    const categoryIcons: Record<CategoryType, React.ComponentType<any>> = {
      Food: Utensils,
      Transport: Car,
      Utilities: Zap,
      Entertainment: Gamepad2,
      Shopping: ShoppingBag,
      Healthcare: Heart,
      Education: GraduationCap,
      Others: MoreHorizontal,
      Subtract: Minus,
      AutopayDeduction: CreditCard,
      LoanEMI: IndianRupee,
    };

    const paymentTypes: string[] = ['Pay Type', 'UPI', 'Debit Card', 'Credit Card', 'Cash'];

    export default function AddExpenseScreen() {
      const { addExpense, t } = useExpenseStore();
      const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
      const [showDatePicker, setShowDatePicker] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      const [globalPaymentType, setGlobalPaymentType] = useState<string>('Pay Type');
      const [categoryData, setCategoryData] = useState<Record<CategoryType, {amount: string, notes: string}>>(() => {
        const initial: Record<CategoryType, {amount: string, notes: string}> = {} as any;
        (Object.keys(categoryIcons) as CategoryType[]).forEach(cat => {
          initial[cat] = { amount: '', notes: '' };
        });
        return initial;
      });

      const sanitizeNumeric = (text: string) => text.replace(/[^0-9]/g, '');

      const handleConfirmAdd = async () => {
        const expensesToAdd: { category: CategoryType; amount: number; paymentType: PaymentType; notes: string }[] = [];
        (Object.keys(categoryData) as CategoryType[]).forEach(cat => {
          const { amount, notes } = categoryData[cat];
          const numAmount = parseFloat(amount);
          if (numAmount > 0) {
            const finalPaymentType: PaymentType = globalPaymentType === 'Pay Type' ? 'Cash' : globalPaymentType as PaymentType;
            expensesToAdd.push({ category: cat, amount: numAmount, paymentType: finalPaymentType, notes });
          }
        });

        if (expensesToAdd.length === 0) {
          Alert.alert('Error', 'Please enter at least one amount');
          return;
        }

        setIsLoading(true);
        let success = true;
        for (const exp of expensesToAdd) {
          const res = await addExpense({
            amount: exp.category === 'Subtract' || exp.category === 'AutopayDeduction' || exp.category === 'LoanEMI' ? -exp.amount : exp.amount,
            category: exp.category,
            date,
            notes: exp.notes.trim(),
            paymentType: exp.paymentType,
          });
          if (!res) success = false;
        }
        setIsLoading(false);

        if (success) {
          Alert.alert('Success', t.expenseAdded);
          // Keep modal open for editing, amounts remain in boxes
        } else {
          Alert.alert('Error', 'Some expenses failed to add');
        }
      };

      const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
          const today = new Date();
          if (selectedDate > today) {
            Alert.alert('Invalid Date', 'Cannot select future dates.');
            return;
          }
          const isoDate = selectedDate.toISOString().split('T')[0];
          setDate(isoDate);
        }
      };

      const updateCategoryData = (category: CategoryType, field: 'amount' | 'notes', value: string) => {
        setCategoryData(prev => ({
          ...prev,
          [category]: { ...prev[category], [field]: value }
        }));
      };

      // Reordered categories: Subtract, AutopayDeduction, LoanEMI at the end for center placement in grid
      const allCategories: CategoryType[] = [
        'Food',
        'Transport',
        'Utilities',
        'Entertainment',
        'Shopping',
        'Healthcare',
        'Education',
        'Others',
        'Subtract',
        'AutopayDeduction',
        'LoanEMI',
      ];

      return (
        <View style={styles.container}>
          <Stack.Screen 
            options={{ 
              title: t.addExpense,
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
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.dateContainer}>
                <Text style={styles.label}>{t.date}</Text>
                <View style={styles.datePicker}>
                  <Calendar size={20} color={Colors.textSecondary} />
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Text style={styles.dateText}>{new Date(date).toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(date)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={onDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              </View>

              <View style={styles.paymentContainer}>
                <Text style={styles.label}>Pay Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={globalPaymentType}
                    onValueChange={(itemValue: string) => setGlobalPaymentType(itemValue)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {paymentTypes.map((type) => (
                      <Picker.Item key={type} label={type} value={type} enabled={type !== 'Pay Type'} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.grid}>
                {allCategories.map((category) => {
                  const IconComponent = categoryIcons[category];
                  const { amount, notes } = categoryData[category];
                  return (
                    <View key={category} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                          <IconComponent size={20} color={Colors.primary} />
                        </View>
                        <Text style={styles.categoryName}>{t.categories[category]}</Text>
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Amount</Text>
                        <View style={styles.amountContainer}>
                          <Text style={styles.currencySymbol}>₹</Text>
                          <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={(txt) => updateCategoryData(category, 'amount', sanitizeNumeric(txt))}
                            placeholder="0"
                            placeholderTextColor={Colors.textSecondary}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Notes</Text>
                        <TextInput
                          style={styles.notesInput}
                          value={notes}
                          onChangeText={(txt) => updateCategoryData(category, 'notes', txt)}
                          placeholder="Optional notes..."
                          placeholderTextColor={Colors.textSecondary}
                          multiline
                          numberOfLines={2}
                          textAlignVertical="top"
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleConfirmAdd}
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
      scrollView: {
        flex: 1,
        paddingHorizontal: 20,
      },
      dateContainer: {
        marginBottom: 20,
      },
      label: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
      },
      datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
      },
      dateButton: {
        flex: 1,
        paddingVertical: 16,
      },
      dateText: {
        fontSize: 16,
        color: Colors.text,
        marginLeft: 12,
      },
      paymentContainer: {
        marginBottom: 20,
      },
      pickerContainer: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
      },
      picker: {
        color: Colors.text,
        backgroundColor: Colors.card,
      },
      pickerItem: {
        color: Colors.text,
        backgroundColor: Colors.card,
      },
      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
      },
      card: {
        width: '48%',
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
      },
      cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
      },
      iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${Colors.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      },
      categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
      },
      inputGroup: {
        marginBottom: 12,
      },
      inputLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
      },
      amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
      },
      currencySymbol: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
        marginRight: 4,
      },
      amountInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        paddingVertical: 8,
      },
      notesInput: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: Colors.text,
        minHeight: 60,
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