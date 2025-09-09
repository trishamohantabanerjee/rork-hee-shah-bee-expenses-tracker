import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronLeft,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  IndianRupee,
  Download
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, CategoryColors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';
import type { Expense, CategoryType, PaymentType } from '@/types/expense';



interface DayExpense {
  date: string;
  expenses: Expense[];
  total: number;
  hasData: boolean;
}

export default function DayWiseExpensesScreen() {
  const {
    expenses,
    addExpense,
    deleteExpense,
    updateExpense
  } = useExpenseStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form state for editing/adding expenses
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food' as CategoryType,
    paymentType: 'Cash' as PaymentType,
    notes: ''
  });

  // Generate calendar data for current month with expense indicators
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: DayExpense[] = [];
    
    // Add empty days for proper calendar alignment
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: '',
        expenses: [],
        total: 0,
        hasData: false
      });
    }
    
    // Add actual days with expense data
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayExpenses = expenses.filter(e => e.date === dateStr);
      
      // Calculate total using same logic as store
      const total = dayExpenses.reduce((sum, expense) => {
        if (expense.category === 'Subtract') {
          return sum - Math.abs(expense.amount);
        } else {
          return sum + Math.abs(expense.amount);
        }
      }, 0);
      
      days.push({
        date: dateStr,
        expenses: dayExpenses,
        total,
        hasData: dayExpenses.length > 0
      });
    }
    
    return days;
  }, [currentMonth, expenses]);

  // Get expenses for selected date
  const selectedDayExpenses = useMemo(() => {
    return expenses.filter(e => e.date === selectedDate);
  }, [expenses, selectedDate]);

  // Calculate total for selected day
  const selectedDayTotal = useMemo(() => {
    return selectedDayExpenses.reduce((sum, expense) => {
      if (expense.category === 'Subtract') {
        return sum - Math.abs(expense.amount);
      } else {
        return sum + Math.abs(expense.amount);
      }
    }, 0);
  }, [selectedDayExpenses]);

  const handleDateSelect = useCallback((date: string) => {
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: Math.abs(expense.amount).toString(),
      category: expense.category as CategoryType,
      paymentType: expense.paymentType || 'Cash',
      notes: expense.notes || ''
    });
    setShowEditModal(true);
  }, []);

  const handleAddExpense = useCallback(() => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      category: 'Food',
      paymentType: 'Cash',
      notes: ''
    });
    setShowAddModal(true);
  }, []);

  const handleSaveExpense = useCallback(async () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    let success = false;
    
    if (editingExpense) {
      // Update existing expense
      success = await updateExpense(editingExpense.id, {
        amount,
        category: formData.category,
        paymentType: formData.paymentType,
        notes: formData.notes.trim() || undefined
      });
    } else {
      // Add new expense
      success = await addExpense({
        amount,
        category: formData.category,
        date: selectedDate,
        paymentType: formData.paymentType,
        notes: formData.notes.trim() || undefined
      });
    }

    if (success) {
      setShowAddModal(false);
      setShowEditModal(false);
      Alert.alert('Success', `Expense ${editingExpense ? 'updated' : 'added'} successfully!`);
    } else {
      Alert.alert('Error', `Failed to ${editingExpense ? 'update' : 'save'} expense`);
    }
  }, [formData, selectedDate, addExpense, updateExpense, editingExpense]);

  const handleDeleteExpense = useCallback((expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${expense.category} expense of ₹${Math.abs(expense.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExpense(expense.id);
            if (success) {
              Alert.alert('Success', 'Expense deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          }
        }
      ]
    );
  }, [deleteExpense]);

  const handleExportDay = useCallback(async () => {
    if (selectedDayExpenses.length === 0) {
      Alert.alert('No Data', 'No expenses found for the selected date');
      return;
    }

    const header = 'Date\tExpenseType\tPaymentType\tAmount\tNotes';
    const rows = selectedDayExpenses.map(e => {
      let displayAmount = Math.abs(e.amount);
      if (e.category === 'Subtract') {
        displayAmount = -Math.abs(e.amount);
      }
      
      return `${e.date}\t${e.category}\t${e.paymentType || 'Cash'}\t${displayAmount}\t${(e.notes || '').replace(/"/g, '""').replace(/\t/g, ' ')}`;
    });
    const csv = [header, ...rows].join('\n');
    
    await Clipboard.setStringAsync(csv);
    Alert.alert('Exported', `Copied ${selectedDayExpenses.length} expenses for ${new Date(selectedDate).toLocaleDateString()}`);
  }, [selectedDayExpenses, selectedDate]);

  const sanitizeNumeric = (text: string) => text.replace(/[^0-9.]/g, '');

  const renderCalendarDay = useCallback(({ item, index }: { item: DayExpense; index: number }) => {
    if (!item.date) {
      return <View style={styles.emptyDay} />;
    }

    const isSelected = item.date === selectedDate;
    const isToday = item.date === new Date().toISOString().split('T')[0];
    const dayNumber = parseInt(item.date.split('-')[2]);

    return (
      <TouchableOpacity
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          isToday && styles.todayDay,
          item.hasData && styles.dayWithData
        ]}
        onPress={() => handleDateSelect(item.date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayNumber,
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText,
          item.hasData && styles.dayWithDataText
        ]}>
          {dayNumber}
        </Text>
        {item.hasData && (
          <View style={[
            styles.expenseIndicator,
            { backgroundColor: item.total >= 0 ? Colors.success : Colors.error }
          ]} />
        )}
      </TouchableOpacity>
    );
  }, [selectedDate, handleDateSelect]);

  const renderExpenseItem = useCallback(({ item }: { item: Expense }) => {
    const displayAmount = item.category === 'Subtract' ? -Math.abs(item.amount) : Math.abs(item.amount);
    const categoryColor = CategoryColors[item.category as keyof typeof CategoryColors] || Colors.primary;

    return (
      <View style={[styles.expenseItem, { backgroundColor: Colors.card }]}>
        <View style={styles.expenseHeader}>
          <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseCategory, { color: Colors.text }]}>
              {item.category}
            </Text>
            <Text style={[styles.expensePayment, { color: Colors.textSecondary }]}>
              {item.paymentType || 'Cash'}
            </Text>
          </View>
          <Text style={[
            styles.expenseAmount,
            { color: displayAmount >= 0 ? Colors.text : Colors.error }
          ]}>
            {displayAmount >= 0 ? '' : '-'}₹{Math.abs(displayAmount).toLocaleString()}
          </Text>
        </View>
        {item.notes && (
          <Text style={[styles.expenseNotes, { color: Colors.textSecondary }]}>
            {item.notes}
          </Text>
        )}
        <View style={styles.expenseActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={() => handleEditExpense(item)}
          >
            <Edit3 size={16} color={Colors.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.error }]}
            onPress={() => handleDeleteExpense(item)}
          >
            <Trash2 size={16} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleEditExpense, handleDeleteExpense]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>Day-wise Expenses</Text>
        <TouchableOpacity onPress={handleExportDay}>
          <Download size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={[styles.calendarHeader, { backgroundColor: Colors.card }]}>
          <TouchableOpacity onPress={handlePreviousMonth}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthYear, { color: Colors.text }]}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <ChevronLeft size={24} color={Colors.text} style={styles.rotatedIcon} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendar, { backgroundColor: Colors.card }]}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={[styles.weekDay, { color: Colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>
          <FlatList
            data={calendarData}
            renderItem={renderCalendarDay}
            numColumns={7}
            scrollEnabled={false}
            keyExtractor={(item, index) => `${item.date || 'empty'}-${index}`}
          />
        </View>

        {/* Selected Date Info */}
        <View style={[styles.selectedDateInfo, { backgroundColor: Colors.card }]}>
          <View style={styles.dateHeader}>
            <Calendar size={24} color={Colors.primary} />
            <Text style={[styles.selectedDateText, { color: Colors.text }]}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.dateSummary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Total Expenses</Text>
              <Text style={[styles.summaryValue, { color: selectedDayTotal >= 0 ? Colors.text : Colors.error }]}>
                ₹{Math.abs(selectedDayTotal).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Transactions</Text>
              <Text style={[styles.summaryValue, { color: Colors.text }]}>
                {selectedDayExpenses.length}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colors.primary }]}
            onPress={handleAddExpense}
          >
            <Plus size={20} color={Colors.background} />
            <Text style={[styles.addButtonText, { color: Colors.background }]}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Expenses List */}
        {selectedDayExpenses.length > 0 ? (
          <View style={styles.expensesList}>
            <Text style={[styles.expensesTitle, { color: Colors.text }]}>Expenses</Text>
            <FlatList
              data={selectedDayExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={[styles.noExpenses, { backgroundColor: Colors.card }]}>
            <IndianRupee size={48} color={Colors.textSecondary} />
            <Text style={[styles.noExpensesText, { color: Colors.textSecondary }]}>
              No expenses recorded for this date
            </Text>
            <Text style={[styles.noExpensesSubtext, { color: Colors.textSecondary }]}>
              Tap &quot;Add Expense&quot; to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Expense Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Amount Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: Colors.text }]}>Amount</Text>
                <View style={styles.amountInput}>
                  <Text style={[styles.currencySymbol, { color: Colors.primary }]}>₹</Text>
                  <TextInput
                    style={[styles.textInput, { color: Colors.text, borderColor: Colors.border }]}
                    value={formData.amount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, amount: sanitizeNumeric(text) }))}
                    placeholder="Enter amount"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: Colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {(['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Others', 'Subtract', 'AutopayDeduction', 'LoanEMI', 'Investment/MF/SIP'] as CategoryType[]).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: formData.category === category ? Colors.primary : Colors.background,
                          borderColor: Colors.border
                        }
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        {
                          color: formData.category === category ? Colors.background : Colors.text,
                          fontSize: category === 'Investment/MF/SIP' ? 11 : 12
                        }
                      ]}>
                        {category === 'Investment/MF/SIP' ? 'Investment MF/SIP' : category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Payment Type */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: Colors.text }]}>Payment Type</Text>
                <View style={styles.paymentTypes}>
                  {(['Cash', 'UPI', 'Debit Card', 'Credit Card'] as PaymentType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.paymentChip,
                        {
                          backgroundColor: formData.paymentType === type ? Colors.primary : Colors.background,
                          borderColor: Colors.border
                        }
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, paymentType: type }))}
                    >
                      <Text style={[
                        styles.paymentChipText,
                        { color: formData.paymentType === type ? Colors.background : Colors.text }
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: Colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput, { color: Colors.text, borderColor: Colors.border }]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Add notes..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: Colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: Colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: Colors.primary }]}
                onPress={handleSaveExpense}
              >
                <Save size={16} color={Colors.background} />
                <Text style={[styles.saveButtonText, { color: Colors.background }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  calendar: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500' as const,
    paddingVertical: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 8,
    position: 'relative',
  },
  emptyDay: {
    flex: 1,
    aspectRatio: 1,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayWithData: {
    backgroundColor: Colors.background,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  selectedDayText: {
    color: Colors.background,
    fontWeight: '600' as const,
  },
  todayDayText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dayWithDataText: {
    color: Colors.text,
  },
  expenseIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDateInfo: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  dateSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  expensesList: {
    marginBottom: 20,
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  expenseItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  expensePayment: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  expenseNotes: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  noExpenses: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
  },
  noExpensesText: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginTop: 16,
    marginBottom: 4,
  },
  noExpensesSubtext: {
    fontSize: 14,
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
    maxHeight: '90%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  modalForm: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  paymentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  paymentChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
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
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
});