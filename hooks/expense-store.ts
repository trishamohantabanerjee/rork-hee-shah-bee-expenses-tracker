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
        setExpenses(JSON.parse(expensesData));
      }

      if (budgetData) {
        setBudget(JSON.parse(budgetData));
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
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
      
      if (Platform.OS !== 'web') {
        const Haptics = await import('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
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
      setBudget(newBudget);
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(newBudget));
      
      if (Platform.OS !== 'web') {
        const Haptics = await import('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
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
    return getCurrentMonthExpenses().reduce((total, expense) => total + expense.amount, 0);
  }, [getCurrentMonthExpenses]);

  const getRemainingBudget = useCallback(() => {
    if (!budget) return null;
    const now = new Date();
    // Always calculate remaining budget for current month
    // If budget is for a different month/year, return the full budget amount
    if (budget.year !== now.getFullYear() || budget.month !== now.getMonth()) {
      return budget.monthly;
    }
    // For current month, subtract expenses from budget
    const totalExpenses = getTotalMonthlyExpenses();
    const remaining = budget.monthly - totalExpenses;
    console.log('Budget calculation:', {
      monthlyBudget: budget.monthly,
      totalExpenses,
      remaining,
      budgetMonth: budget.month,
      budgetYear: budget.year,
      currentMonth: now.getMonth(),
      currentYear: now.getFullYear()
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