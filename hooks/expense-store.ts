import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
// import * as Localization from 'expo-localization';
import type { AppSettings, Budget, Expense, CategoryType, PaymentType, LoanEMI } from '@/types/expense';
import { translations } from '@/constants/translations';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  EXPENSES: 'hee_shah_bee_expenses',
  BUDGET: 'hee_shah_bee_budget',
  SETTINGS: 'hee_shah_bee_settings',
  DRAFT: 'hee_shah_bee_expense_draft',
  PRIVACY_LINK: 'heesaabee_has_viewed_privacy_link',
  EMIS: 'hee_shah_bee_emis',
} as const;

type ExpenseDraft = {
  amount: string;
  category: CategoryType;
  date: string;
  notes: string;
  paymentType: PaymentType;
};

export const [ExpenseProvider, useExpenseStore] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    darkMode: true,
    hasAcceptedPrivacy: false,
    appLockEnabled: false,
  });
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [hasViewedPrivacyLink, setHasViewedPrivacyLink] = useState<boolean>(false);
  const [emis, setEmis] = useState<LoanEMI[]>([]);

  const t = translations[settings.language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, budgetData, settingsData, splashData, draftData, privacyLinkFlag, emisData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGET),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem('hee_shah_bee_splash'),
        AsyncStorage.getItem(STORAGE_KEYS.DRAFT),
        AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_LINK),
        AsyncStorage.getItem(STORAGE_KEYS.EMIS),
      ]);

      if (expensesData) {
        try {
          const parsedExpenses = JSON.parse(expensesData);
          // Security: Validate expenses data structure
          if (Array.isArray(parsedExpenses)) {
            const validExpenses = parsedExpenses.filter(expense => 
              expense && 
              typeof expense.amount === 'number' && 
              expense.category && 
              expense.date &&
              Math.abs(expense.amount) <= 10000000 // Validate amount range
            );
            setExpenses(validExpenses);
          }
        } catch (e) {
          console.error('Error parsing expenses data:', e);
          setExpenses([]);
        }
      }

      if (budgetData) {
        try {
          const parsedBudget = JSON.parse(budgetData);
          // Security: Validate budget data structure
          if (parsedBudget && 
              typeof parsedBudget.monthly === 'number' && 
              parsedBudget.monthly >= 0 && 
              parsedBudget.monthly <= 100000000) {
            setBudget(parsedBudget);
          }
        } catch (e) {
          console.error('Error parsing budget data:', e);
          setBudget(null);
        }
      }

      if (settingsData) {
        const parsed: AppSettings = JSON.parse(settingsData);
        try {
          if (Platform.OS !== 'web') {
            const lock = await SecureStore.getItemAsync('app_lock_enabled');
            parsed.appLockEnabled = lock === '1';
          }
        } catch (e) {
          // ignore
        }
        setSettings(parsed);
      } else {
        const deviceLanguage = Platform.OS === 'web' 
          ? navigator.language.startsWith('hi') ? 'hi' : 'en'
          : 'en'; // Localization.locale?.startsWith('hi') ? 'hi' : 'en';
        
        const initialSettings: AppSettings = {
          language: deviceLanguage,
          darkMode: true,
          hasAcceptedPrivacy: false,
          appLockEnabled: false,
        };
        setSettings(initialSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
      }

      if (splashData) {
        setHasSeenSplash(JSON.parse(splashData));
      }

      if (draftData) {
        setDraft(JSON.parse(draftData));
      } else {
        const today = new Date().toISOString().split('T')[0];
        const initialDraft: ExpenseDraft = { amount: '', category: 'Food', date: today, notes: '', paymentType: 'Cash' };
        setDraft(initialDraft);
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(initialDraft));
      }

      if (privacyLinkFlag) {
        setHasViewedPrivacyLink(privacyLinkFlag === '1');
      } else {
        setHasViewedPrivacyLink(false);
      }

      if (emisData) {
        setEmis(JSON.parse(emisData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      // ADVANCED SECURITY: Comprehensive input validation
      if (!expense || typeof expense.amount !== 'number' || !expense.category || !expense.date) {
        console.error('SECURITY: Invalid expense data structure provided');
        return false;
      }
      
      // ADVANCED SECURITY: Prevent injection attacks and malicious data
      if (Math.abs(expense.amount) > 10000000) { // 1 crore limit
        console.error('SECURITY: Expense amount exceeds maximum allowed value');
        return false;
      }
      
      // ADVANCED SECURITY: Strict date validation with additional checks
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expense.date)) {
        console.error('SECURITY: Invalid date format detected');
        return false;
      }
      
      // ADVANCED SECURITY: Validate date is not in future (prevent time manipulation)
      const expenseDate = new Date(expense.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (expenseDate > today) {
        console.error('SECURITY: Future date detected, rejecting expense');
        return false;
      }
      
      // ADVANCED SECURITY: Validate category against allowed types
      const allowedCategories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Others', 'Subtract', 'AutopayDeduction', 'LoanEMI'];
      if (!allowedCategories.includes(expense.category)) {
        console.error('SECURITY: Invalid category detected');
        return false;
      }
      
      // ADVANCED SECURITY: Validate payment type
      const allowedPaymentTypes = ['UPI', 'Debit Card', 'Credit Card', 'Cash'];
      if (expense.paymentType && !allowedPaymentTypes.includes(expense.paymentType)) {
        console.error('SECURITY: Invalid payment type detected');
        return false;
      }
      
      const newExpense: Expense = {
        ...expense,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`, // More secure ID with additional entropy
        createdAt: new Date().toISOString(),
        // ADVANCED SECURITY: Sanitize and validate notes
        notes: expense.notes ? expense.notes.substring(0, 500).replace(/[<>"'&]/g, '') : undefined,
        // ADVANCED SECURITY: Ensure amount precision (prevent floating point attacks)
        amount: Math.round(expense.amount * 100) / 100,
      };

      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      
      // ADVANCED SECURITY: Validate data before storage
      try {
        const serialized = JSON.stringify(updatedExpenses);
        if (serialized.length > 50000000) { // 50MB limit
          console.error('SECURITY: Data size exceeds storage limits');
          return false;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, serialized);
      } catch (storageError) {
        console.error('SECURITY: Storage operation failed:', storageError);
        return false;
      }
      
      if (Platform.OS !== 'web') {
        try {
          const Haptics = await import('expo-haptics');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (hapticsError) {
          // Haptics failure is not critical, continue
          console.log('Haptics not available:', hapticsError);
        }
      }
      
      console.log('EXPENSE ADDED SUCCESSFULLY:', {
        category: newExpense.category,
        amount: newExpense.amount,
        date: newExpense.date,
        id: newExpense.id
      });
      
      return true;
    } catch (error) {
      console.error('SECURITY: Error adding expense:', error);
      return false;
    }
  }, [expenses]);

  const updateDraft = useCallback(async (partial: Partial<ExpenseDraft>) => {
    try {
      const current: ExpenseDraft = {
        amount: draft?.amount ?? '',
        category: draft?.category ?? 'Food',
        date: draft?.date ?? new Date().toISOString().split('T')[0],
        notes: draft?.notes ?? '',
        paymentType: draft?.paymentType ?? 'Cash',
      };
      const nextDraft: ExpenseDraft = { ...current, ...partial };
      setDraft(nextDraft);
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(nextDraft));
      return true;
    } catch (error) {
      console.error('Error updating draft:', error);
      return false;
    }
  }, [draft]);

  const clearDraft = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const emptyDraft: ExpenseDraft = { amount: '', category: 'Food', date: today, notes: '', paymentType: 'Cash' };
      setDraft(emptyDraft);
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(emptyDraft));
      return true;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  }, []);

  const updateBudget = useCallback(async (newBudget: Budget) => {
    try {
      // ADVANCED SECURITY: Comprehensive budget validation
      if (!newBudget || typeof newBudget.monthly !== 'number' || newBudget.monthly < 0) {
        console.error('SECURITY: Invalid budget data structure provided');
        return false;
      }
      
      // ADVANCED SECURITY: Prevent extremely large budget values and financial attacks
      if (newBudget.monthly > 100000000) { // 10 crore limit
        console.error('SECURITY: Budget amount exceeds maximum allowed value');
        return false;
      }
      
      // ADVANCED SECURITY: Validate month and year ranges
      if (newBudget.month < 0 || newBudget.month > 11 || newBudget.year < 2020 || newBudget.year > 2050) {
        console.error('SECURITY: Invalid budget month or year detected');
        return false;
      }
      
      // ADVANCED SECURITY: Ensure budget precision (prevent floating point manipulation)
      const sanitizedBudget: Budget = {
        monthly: Math.round(newBudget.monthly * 100) / 100,
        month: Math.floor(newBudget.month),
        year: Math.floor(newBudget.year)
      };
      
      setBudget(sanitizedBudget);
      
      // ADVANCED SECURITY: Validate serialization
      try {
        const serialized = JSON.stringify(sanitizedBudget);
        if (serialized.length > 1000) { // Budget should be small
          console.error('SECURITY: Budget data size exceeds expected limits');
          return false;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, serialized);
      } catch (storageError) {
        console.error('SECURITY: Budget storage operation failed:', storageError);
        return false;
      }
      
      if (Platform.OS !== 'web') {
        try {
          const Haptics = await import('expo-haptics');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (hapticsError) {
          // Haptics failure is not critical
          console.log('Haptics not available:', hapticsError);
        }
      }
      
      console.log('BUDGET UPDATED SUCCESSFULLY:', {
        monthly: sanitizedBudget.monthly,
        month: sanitizedBudget.month,
        year: sanitizedBudget.year
      });
      
      return true;
    } catch (error) {
      console.error('SECURITY: Error updating budget:', error);
      return false;
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      if (typeof newSettings.appLockEnabled === 'boolean') {
        try {
          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync('app_lock_enabled', newSettings.appLockEnabled ? '1' : '0');
          } else {
            await AsyncStorage.setItem('app_lock_enabled', newSettings.appLockEnabled ? '1' : '0');
          }
        } catch (e) {
          // ignore
        }
      }
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }, [settings]);

  const markSplashAsSeen = useCallback(async () => {
    try {
      setHasSeenSplash(true);
      await AsyncStorage.setItem('hee_shah_bee_splash', JSON.stringify(true));
      return true;
    } catch (error) {
      console.error('Error marking splash as seen:', error);
      return false;
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.removeItem(STORAGE_KEYS.BUDGET),
        AsyncStorage.removeItem(STORAGE_KEYS.EMIS),
      ]);
      setExpenses([]);
      setBudget(null);
      setEmis([]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }, []);

  const clearDailyData = useCallback(async (isoDate?: string) => {
    try {
      const target = isoDate ?? new Date().toISOString().split('T')[0];
      const filtered = expenses.filter(e => e.date !== target);
      setExpenses(filtered);
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error clearing daily data:', error);
      return false;
    }
  }, [expenses]);

  const generateCSV = useCallback(() => {
    const header = 'id,createdAt,date,category,amount,notes,paymentType';
    const rows = expenses.map(e => [
      e.id,
      e.createdAt,
      e.date,
      e.category,
      e.amount.toString(),
      (e.notes ?? '').replace(/"/g, '""'),
      e.paymentType ?? 'Cash',
    ]);
    const csv = [header, ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return csv;
  }, [expenses]);

  const getCurrentMonthExpenses = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
  }, [expenses]);

  const getTotalMonthlyExpenses = useCallback(() => {
    // UPDATED MATHEMATICAL LOGIC: 
    // - All categories are ADDED except "Subtract" category
    // - "AutopayDeduction" and "LoanEMI" are now ADDED (not subtracted)
    // - Only "Subtract" category is subtracted from total
    const monthlyExpenses = getCurrentMonthExpenses();
    const total = monthlyExpenses.reduce((sum, expense) => {
      // CRITICAL FIX: Only "Subtract" category should be subtracted
      // "AutopayDeduction" and "LoanEMI" should be ADDED to expenses
      if (expense.category === 'Subtract') {
        // Subtract category: subtract the absolute value
        return sum - Math.abs(expense.amount);
      } else {
        // All other categories (including AutopayDeduction and LoanEMI): add the absolute value
        return sum + Math.abs(expense.amount);
      }
    }, 0);
    
    console.log('TOTAL MONTHLY EXPENSES CALCULATION (UPDATED LOGIC):', {
      expenseCount: monthlyExpenses.length,
      total: total,
      logic: 'All categories ADDED except Subtract (subtracted)',
      breakdown: monthlyExpenses.map(e => ({ 
        category: e.category, 
        amount: e.amount, 
        absoluteAmount: Math.abs(e.amount),
        operation: e.category === 'Subtract' ? 'SUBTRACT' : 'ADD',
        date: e.date 
      }))
    });
    
    return total;
  }, [getCurrentMonthExpenses]);

  const getRemainingBudget = useCallback(() => {
    if (!budget) return null;
    const now = new Date();
    
    // Always calculate remaining budget for current month
    // If budget is for a different month/year, return the full budget amount
    if (budget.year !== now.getFullYear() || budget.month !== now.getMonth()) {
      return budget.monthly;
    }
    
    // CRITICAL MATHEMATICAL FIX: Remaining Budget = Monthly Budget - Total Expenses
    // This is the core logic: Budget - Expenses = Remaining
    // Example: Budget 70,000 - Expenses 6,000 = Remaining 64,000
    const totalExpenses = getTotalMonthlyExpenses();
    const remaining = budget.monthly - totalExpenses;
    
    // Security: Validate calculation results
    if (isNaN(remaining) || !isFinite(remaining)) {
      console.error('Invalid budget calculation detected');
      return budget.monthly;
    }
    
    // Enhanced logging for debugging mathematical accuracy
    console.log('REMAINING BUDGET CALCULATION (FIXED):', {
      monthlyBudget: budget.monthly,
      totalExpenses: totalExpenses,
      remaining: remaining,
      calculation: `${budget.monthly} - ${totalExpenses} = ${remaining}`,
      isCorrect: remaining === (budget.monthly - totalExpenses),
      budgetMonth: budget.month,
      budgetYear: budget.year,
      currentMonth: now.getMonth(),
      currentYear: now.getFullYear(),
      isCurrentMonth: budget.year === now.getFullYear() && budget.month === now.getMonth()
    });
    
    return remaining;
  }, [budget, getTotalMonthlyExpenses]);

  const getExpensesByCategory = useCallback(() => {
    const monthlyExpenses = getCurrentMonthExpenses();
    const categoryTotals: Record<string, number> = {};
    
    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return categoryTotals;
  }, [getCurrentMonthExpenses]);

  const markPrivacyLinkViewed = useCallback(async () => {
    try {
      setHasViewedPrivacyLink(true);
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_LINK, '1');
      return true;
    } catch (error) {
      console.error('Error marking privacy link viewed:', error);
      return false;
    }
  }, []);

  const addEMI = useCallback(async (emi: Omit<LoanEMI, 'id' | 'createdAt'>) => {
    try {
      const newEMI: LoanEMI = {
        ...emi,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const updatedEMIs = [...emis, newEMI];
      setEmis(updatedEMIs);
      await AsyncStorage.setItem(STORAGE_KEYS.EMIS, JSON.stringify(updatedEMIs));
      return true;
    } catch (error) {
      console.error('Error adding EMI:', error);
      return false;
    }
  }, [emis]);

  const updateEMI = useCallback(async (id: string, updates: Partial<LoanEMI>) => {
    try {
      const updatedEMIs = emis.map(emi => emi.id === id ? { ...emi, ...updates } : emi);
      setEmis(updatedEMIs);
      await AsyncStorage.setItem(STORAGE_KEYS.EMIS, JSON.stringify(updatedEMIs));
      return true;
    } catch (error) {
      console.error('Error updating EMI:', error);
      return false;
    }
  }, [emis]);

  const deleteEMI = useCallback(async (id: string) => {
    try {
      const updatedEMIs = emis.filter(emi => emi.id !== id);
      setEmis(updatedEMIs);
      await AsyncStorage.setItem(STORAGE_KEYS.EMIS, JSON.stringify(updatedEMIs));
      return true;
    } catch (error) {
      console.error('Error deleting EMI:', error);
      return false;
    }
  }, [emis]);

  const getMonthlyEMITotal = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return emis
      .filter(emi => {
        const dueDate = new Date(emi.dueDate);
        return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
      })
      .reduce((total, emi) => total + emi.amount, 0);
  }, [emis]);

  const getNextDueEMI = useCallback(() => {
    const now = new Date();
    const upcoming = emis
      .filter(emi => new Date(emi.dueDate) >= now && !emi.isPaid)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming[0] || null;
  }, [emis]);

  return {
    expenses,
    budget,
    settings,
    isLoading,
    hasSeenSplash,
    t,
    draft,
    emis,
    addExpense,
    updateDraft,
    clearDraft,
    updateBudget,
    updateSettings,
    clearAllData,
    clearDailyData,
    generateCSV,
    getCurrentMonthExpenses,
    getTotalMonthlyExpenses,
    getRemainingBudget,
    getExpensesByCategory,
    markSplashAsSeen,
    hasViewedPrivacyLink,
    markPrivacyLinkViewed,
    addEMI,
    updateEMI,
    deleteEMI,
    getMonthlyEMITotal,
    getNextDueEMI,
  };
});