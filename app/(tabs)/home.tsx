import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Platform, Animated, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, TrendingDown, Utensils, Car, Zap, Gamepad2, ShoppingBag, Heart, GraduationCap, MoreHorizontal, ExternalLink, Minus, CreditCard, Calendar, Download, Home as HomeIcon, Trash2, Shield, ChevronDown } from 'lucide-react-native';
import { Colors, CategoryColors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';
import { PieChart } from '@/components/PieChart';
import type { CategoryType, PaymentType } from '@/types/expense';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const categoryIcons: Record<string, React.ComponentType<any>> = {
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
  LoanEMI: HomeIcon,
};

const allCategories = ['Food','Transport','Utilities','Entertainment','Shopping','Healthcare','Education','Others','Subtract','AutopayDeduction','LoanEMI'];

const paymentTypes: PaymentType[] = ['UPI', 'Debit Card', 'Credit Card', 'Cash'];

export default function HomeTab() {
  const { 
    getTotalMonthlyExpenses, 
    getRemainingBudget, 
    getExpensesByCategory,
    addExpense,
    budget,
    t,
    expenses,
    hasViewedPrivacyLink,
    markPrivacyLinkViewed,
    clearAllData,
    draft,
    updateDraft,
    getMonthlyEMITotal,
    getNextDueEMI,
  } = useExpenseStore();

  const totalExpenses = getTotalMonthlyExpenses();
  const remainingBudget = getRemainingBudget();
  const categoryData = useMemo(() => getExpensesByCategory(), [expenses]);
  const isOverBudget = remainingBudget !== null && remainingBudget < 0;
  const monthlyEMITotal = getMonthlyEMITotal();
  const nextDueEMI = getNextDueEMI();

  const [quickValues, setQuickValues] = useState<Record<string, string>>({
    Food: '', Transport: '', Utilities: '', Entertainment: '', Shopping: '', Healthcare: '', Education: '', Others: '', Subtract: '', AutopayDeduction: '', LoanEMI: '',
  });
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({
    Food: '', Transport: '', Utilities: '', Entertainment: '', Shopping: '', Healthcare: '', Education: '', Others: '', Subtract: '', AutopayDeduction: '', LoanEMI: '',
  });
  const [quickPaymentTypes, setQuickPaymentTypes] = useState<Record<string, PaymentType>>({
    Food: 'Cash', Transport: 'Cash', Utilities: 'Cash', Entertainment: 'Cash', Shopping: 'Cash', Healthcare: 'Cash', Education: 'Cash', Others: 'Cash', Subtract: 'Cash', AutopayDeduction: 'Cash', LoanEMI: 'Cash',
  });
  const timersRef = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});
  const flashesRef = useRef<Record<string, Animated.Value>>({
    Food: new Animated.Value(0),
    Transport: new Animated.Value(0),
    Utilities: new Animated.Value(0),
    Entertainment: new Animated.Value(0),
    Shopping: new Animated.Value(0),
    Healthcare: new Animated.Value(0),
    Education: new Animated.Value(0),
    Others: new Animated.Value(0),
    Subtract: new Animated.Value(0),
    AutopayDeduction: new Animated.Value(0),
    LoanEMI: new Animated.Value(0),
  });
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(draft?.date ?? new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const triggerFlash = (category: string) => {
    const v = flashesRef.current[category];
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const sanitizeNumeric = (text: string) => text.replace(/[^0-9]/g, '');

  const onQuickChange = (category: string, text: string) => {
    const sanitized = sanitizeNumeric(text);
    setQuickValues(prev => ({ ...prev, [category]: sanitized }));

    const existing = timersRef.current[category];
    if (existing) clearTimeout(existing);

    timersRef.current[category] = setTimeout(async () => {
      const amount = parseFloat(sanitized);
      if (!isNaN(amount) && amount > 0) {
        const isNegative = category === 'Subtract' || category === 'AutopayDeduction' || category === 'LoanEMI';
        const finalAmount = isNegative ? -amount : amount;
        const success = await addExpense({ 
          amount: finalAmount, 
          category: category as CategoryType, 
          date: selectedDate, 
          notes: quickNotes[category] || '', 
          paymentType: quickPaymentTypes[category] 
        });
        if (success) {
          if (Platform.OS !== 'web') {
            try {
              const Haptics = await import('expo-haptics');
              await Haptics.selectionAsync();
            } catch (e) {
              console.log('Haptics not available');
            }
          }
          triggerFlash(category);
        }
      }
      setQuickValues(prev => ({ ...prev, [category]: '' }));
      setQuickNotes(prev => ({ ...prev, [category]: '' }));
    }, 600);
  };

  const hasAnyValue = Object.values(quickValues).some(v => v.trim() !== '');

  const handleAddExpense = async () => {
    if (!hasAnyValue) return;
    const promises = allCategories.map(async (cat) => {
      const val = quickValues[cat];
      if (val.trim() === '') return;
      const amount = parseFloat(val);
      if (!isNaN(amount) && amount > 0) {
        const isNegative = cat === 'Subtract' || cat === 'AutopayDeduction' || cat === 'LoanEMI';
        const finalAmount = isNegative ? -amount : amount;
        return addExpense({ 
          amount: finalAmount, 
          category: cat as CategoryType, 
          date: selectedDate, 
          notes: quickNotes[cat] || '', 
          paymentType: quickPaymentTypes[cat] 
        });
      }
    });
    await Promise.all(promises);
    setQuickValues({
      Food: '', Transport: '', Utilities: '', Entertainment: '', Shopping: '', Healthcare: '', Education: '', Others: '', Subtract: '', AutopayDeduction: '', LoanEMI: '',
    });
    setQuickNotes({
      Food: '', Transport: '', Utilities: '', Entertainment: '', Shopping: '', Healthcare: '', Education: '', Others: '', Subtract: '', AutopayDeduction: '', LoanEMI: '',
    });
    Alert.alert('Success', 'Expenses added successfully');
  };

  const dailyExpenses = useMemo(() => {
    const grouped: Record<string, { total: number; items: typeof expenses }> = {};
    expenses.forEach(exp => {
      if (!grouped[exp.date]) grouped[exp.date] = { total: 0, items: [] };
      grouped[exp.date].total += exp.amount;
      grouped[exp.date].items.push(exp);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);

  const handleExport = async () => {
    const csv = 'Date,Category,Amount,Notes,PaymentType\n' + expenses.map(e => `"${e.date}","${e.category}","${e.amount}","${e.notes || ''}","${e.paymentType || 'Cash'}"`).join('\n');
    await Clipboard.setStringAsync(csv);
    Alert.alert('Exported', 'Copied in Excel/Sheets compatible format!');
  };

  const handleDeleteAll = () => {
    Alert.alert('Delete All Data', 'Are you sure? This will delete all expenses and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await clearAllData();
        Alert.alert('Deleted', 'All data cleared.');
      }},
    ]);
  };

  const [policyVisible, setPolicyVisible] = useState<boolean>(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      if (selectedDate > today) {
        Alert.alert('Invalid Date', 'Cannot select future dates.');
        return;
      }
      const isoDate = selectedDate.toISOString().split('T')[0];
      setSelectedDate(isoDate);
      updateDraft({ date: isoDate });
    }
  };

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

          <View style={styles.datePickerContainer}>
            <Calendar size={20} color={Colors.textSecondary} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              <Text style={styles.dateText}>{new Date(selectedDate).toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(selectedDate)}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.quickAddContainer}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickGrid}>
              {allCategories.map((cat) => {
                const Icon = categoryIcons[cat];
                const flash = flashesRef.current[cat].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(37,211,102,0)', 'rgba(37,211,102,0.25)'],
                });
                const isLastRow = cat === 'Subtract' || cat === 'AutopayDeduction' || cat === 'LoanEMI';
                const gridItemWidth = isLastRow ? '31%' : '48%';
                return (
                  <Animated.View key={cat} style={[styles.quickItem, { backgroundColor: flash, width: gridItemWidth, marginBottom: isLastRow ? 0 : 16 }]}>
                    <View style={styles.quickHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: CategoryColors[cat as keyof typeof CategoryColors] + '20' }]}>
                        <Icon size={18} color={CategoryColors[cat as keyof typeof CategoryColors]} />
                      </View>
                      <Text style={styles.quickLabel}>{cat === 'AutopayDeduction' ? 'Autopay Deduction' : cat === 'LoanEMI' ? 'Loan EMI' : cat}</Text>
                      <TouchableOpacity 
                        style={styles.paymentSelector}
                        onPress={() => {
                          const current = quickPaymentTypes[cat];
                          const nextIndex = (paymentTypes.indexOf(current) + 1) % paymentTypes.length;
                          setQuickPaymentTypes(prev => ({ ...prev, [cat]: paymentTypes[nextIndex] }));
                        }}
                      >
                        <Text style={styles.paymentText}>{quickPaymentTypes[cat]}</Text>
                        <ChevronDown size={14} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <View style={[
                      styles.inputRow,
                      focusedCategory === cat ? styles.inputRowFocused : null,
                      Platform.OS === 'web' ? (styles.inputRowWeb as any) : null,
                    ]}>
                      <Text style={styles.currency}>₹</Text>
                      <TextInput
                        testID={`quick-input-${cat}`}
                        style={[styles.quickInput, Platform.OS === 'web' ? (styles.quickInputWeb as any) : null]}
                        value={quickValues[cat]}
                        onChangeText={(txt) => onQuickChange(cat, txt)}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                        returnKeyType="done"
                        onFocus={() => setFocusedCategory(cat)}
                        onBlur={() => setFocusedCategory(null)}
                        selectionColor="#25D366"
                        underlineColorAndroid="transparent"
                        accessibilityLabel={`Enter amount for ${cat}`}
                      />
                    </View>
                    <TextInput
                      style={styles.notesInput}
                      value={quickNotes[cat]}
                      onChangeText={(txt) => setQuickNotes(prev => ({ ...prev, [cat]: txt }))}
                      placeholder="Notes (optional)"
                      placeholderTextColor={Colors.textSecondary}
                      maxLength={100}
                    />
                  </Animated.View>
                );
              })}
            </View>
            <TouchableOpacity 
              style={[styles.addButton, !hasAnyValue && styles.addButtonDisabled]} 
              onPress={handleAddExpense}
              disabled={!hasAnyValue}
              accessibilityRole="button"
              accessibilityLabel="Add Expenses"
            >
              <Plus size={20} color={Colors.background} />
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emiSection}>
            <Text style={styles.sectionTitle}>Loan EMI</Text>
            <View style={styles.emiCard}>
              <Text style={styles.emiTotal}>Monthly EMI: ₹{monthlyEMITotal.toLocaleString()}</Text>
              {nextDueEMI && (
                <Text style={styles.emiNext}>Next Due: {new Date(nextDueEMI.dueDate).toLocaleDateString()} - ₹{nextDueEMI.amount.toLocaleString()}</Text>
              )}
              <TouchableOpacity style={styles.emiButton} onPress={() => router.push('/emi')}>
                <Text style={styles.emiButtonText}>Manage EMIs</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <PieChart data={categoryData} size={width >= 1024 ? Math.min(width * 0.35, 360) : width >= 768 ? Math.min(width * 0.5, 320) : Math.min(width * 0.86, 280)} />
          </View>

          <View style={styles.dailyExpensesContainer}>
            <Text style={styles.sectionTitle}>Daily Expenses</Text>
            {dailyExpenses.map(([date, { total, items }]) => (
              <View key={date} style={styles.dailyItem}>
                <View style={styles.dailyHeader}>
                  <Text style={styles.dailyDate}>{new Date(date).toLocaleDateString()}</Text>
                  <Text style={[styles.dailyTotal, total >= 0 ? styles.positive : styles.negative]}>
                    {total >= 0 ? '▲' : '▼'} ₹{Math.abs(total).toLocaleString()}
                  </Text>
                </View>
                {items.map(item => (
                  <Text key={item.id} style={styles.dailyDetail}>
                    {item.category}: ₹{item.amount.toLocaleString()} ({item.paymentType || 'Cash'}) - {item.notes || 'No notes'}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={handleExport} accessibilityRole="button" accessibilityLabel="Export to Google Sheets">
            <Download size={20} color={Colors.primary} />
            <Text style={styles.exportButtonText}>Copy for Google Sheets</Text>
          </TouchableOpacity>

          {!hasViewedPrivacyLink && (
            <View style={styles.privacyLinkWrap}>
              <TouchableOpacity
                onPress={() => setPolicyVisible(true)}
                activeOpacity={0.7}
                testID="home-privacy-inline-link"
                accessibilityRole="button"
                accessibilityLabel="View Privacy Policy"
              >
                <Text style={styles.privacyLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={() => router.push('/(tabs)/home')} accessibilityRole="button" accessibilityLabel="Home">
            <HomeIcon size={20} color={Colors.primary} />
            <Text style={styles.footerText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={handleDeleteAll} accessibilityRole="button" accessibilityLabel="Delete All Data">
            <Trash2 size={20} color={Colors.error} />
            <Text style={styles.footerText}>Delete All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={() => router.push('/privacy')} accessibilityRole="button" accessibilityLabel="Privacy Policy">
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.footerText}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <PrivacyGate />

      <Modal
        visible={policyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={policyStyles.overlay}>
          <View style={policyStyles.sheet}>
            <ScrollView contentContainerStyle={policyStyles.content} showsVerticalScrollIndicator={true}>
              <Text style={policyStyles.title}>Privacy Policy</Text>
              <Text style={policyStyles.text}>
                HeeSaaBee does not share your data with third parties. Your expense data stays on your device. We only collect minimal, anonymized diagnostics if you explicitly opt-in later. You may export or delete all data at any time. For questions, contact support-heesaabee@beindiya.online.
              </Text>
              <Text style={policyStyles.text}>Updated: August 2025</Text>
            </ScrollView>
            <TouchableOpacity
              style={policyStyles.agreeBtn}
              onPress={async () => {
                await markPrivacyLinkViewed();
                setPolicyVisible(false);
              }}
              activeOpacity={0.85}
              testID="home-privacy-inline-agree"
              accessibilityRole="button"
              accessibilityLabel="Agree to Privacy Policy"
            >
              <Text style={policyStyles.agreeText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PrivacyGate: React.FC = React.memo(() => {
  const { settings, updateSettings, t } = useExpenseStore();
  const [visible, setVisible] = useState<boolean>(!settings.hasAcceptedPrivacy);

  React.useEffect(() => {
    setVisible(!settings.hasAcceptedPrivacy);
  }, [settings.hasAcceptedPrivacy]);

  const onAgree = async () => {
    await updateSettings({ hasAcceptedPrivacy: true });
    setVisible(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Please review and agree to our Privacy Policy to continue.</Text>
          <TouchableOpacity style={modalStyles.button} onPress={onAgree} activeOpacity={0.8} testID="privacy-agree" accessibilityRole="button" accessibilityLabel="Agree">
            <Text style={modalStyles.buttonText}>{t.agree}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.linkRow} onPress={() => router.push('/privacy')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="View Privacy Policy">
            <ExternalLink size={16} color={Colors.primary} />
            <Text style={modalStyles.linkText}>View Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#002A5C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#004080',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#001F3F',
    fontSize: 16,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 as unknown as number,
  },
  linkText: {
    color: '#25D366',
    marginLeft: 6,
  },
});

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
    marginBottom: 24,
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002A5C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004080',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  quickAddContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickItem: {
    backgroundColor: '#002A5C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#004080',
    padding: 12,
    overflow: 'hidden',
    height: 160,
    marginBottom: 16,
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001A33',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginRight: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001A33',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#001A33',
    overflow: 'hidden',
    shadowColor: 'transparent',
    elevation: 0,
  },
  inputRowFocused: {
    borderColor: '#25D366',
    backgroundColor: '#001F3F',
  },
  inputRowWeb: {
    boxSizing: 'border-box',
  } as any,
  currency: {
    color: '#25D366',
    fontSize: 18,
    marginRight: 6,
  },
  quickInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 10,
    maxWidth: '100%',
    includeFontPadding: false as unknown as boolean,
    textAlignVertical: 'center',
  },
  quickInputWeb: {
    outlineStyle: 'none',
    outlineWidth: 0,
  } as any,
  notesInput: {
    backgroundColor: '#001A33',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#001F3F',
    fontSize: 16,
    fontWeight: '600',
  },
  emiSection: {
    marginBottom: 24,
  },
  emiCard: {
    backgroundColor: '#002A5C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#004080',
  },
  emiTotal: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emiNext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  emiButton: {
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  emiButtonText: {
    color: '#001F3F',
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  dailyExpensesContainer: {
    marginBottom: 24,
  },
  dailyItem: {
    backgroundColor: '#002A5C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#004080',
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dailyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#25D366',
  },
  negative: {
    color: '#FF6B6B',
  },
  dailyDetail: {
    fontSize: 14,
    color: '#B0B0B0',
    marginLeft: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002A5C',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#004080',
    gap: 8,
  },
  exportButtonText: {
    color: '#25D366',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyLinkWrap: {
    paddingTop: 6,
    paddingBottom: 24,
    alignItems: 'center',
  },
  privacyLinkText: {
    color: '#25D366',
    fontSize: 12,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#002A5C',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#004080',
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
});

const policyStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxHeight: '80%', backgroundColor: '#002A5C', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: '#004080' },
  content: { padding: 20 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  text: { color: '#D0D8E8', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  agreeBtn: { backgroundColor: '#25D366', paddingVertical: 14, alignItems: 'center' },
  agreeText: { color: '#001F3F', fontSize: 16, fontWeight: '700' },
});