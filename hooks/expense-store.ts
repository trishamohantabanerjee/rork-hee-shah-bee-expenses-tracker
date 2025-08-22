import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
// import * as Localization from 'expo-localization';
import type { AppSettings, Budget, Expense, CategoryType } from '@/types/expense';
import { translations } from '@/constants/translations';

const STORAGE_KEYS = {
  EXPENSES: 'hee_shah_bee_expenses',
  BUDGET: 'hee_shah_bee_budget',
  SETTINGS: 'hee_shah_bee_settings',
  DRAFT: 'hee_shah_bee_expense_draft',
} as const;

type ExpenseDraft = {
  amount: string;
  category: CategoryType;
  date: string;
  notes: string;
};

export const [ExpenseProvider, useExpenseStore] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    darkMode: true,
    hasAcceptedPrivacy: false,
  });
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);

  const t = translations[settings.language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, budgetData, settingsData, splashData, draftData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGET),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem('hee_shah_bee_splash'),
        AsyncStorage.getItem(STORAGE_KEYS.DRAFT),
      ]);

      if (expensesData) {
        setExpenses(JSON.parse(expensesData));
      }

      if (budgetData) {
        setBudget(JSON.parse(budgetData));
      }

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      } else {
        const deviceLanguage = Platform.OS === 'web' 
          ? navigator.language.startsWith('hi') ? 'hi' : 'en'
          : 'en'; // Localization.locale?.startsWith('hi') ? 'hi' : 'en';
        
        const initialSettings: AppSettings = {
          language: deviceLanguage,
          darkMode: true,
          hasAcceptedPrivacy: false,
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
        const initialDraft: ExpenseDraft = { amount: '', category: 'Food', date: today, notes: '' };
        setDraft(initialDraft);
        await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(initialDraft));
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
      const emptyDraft: ExpenseDraft = { amount: '', category: 'Food', date: today, notes: '' };
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
      ]);
      setExpenses([]);
      setBudget(null);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }, []);

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
    if (budget.year !== now.getFullYear() || budget.month !== now.getMonth()) {
      return budget.monthly;
    }
    return budget.monthly - getTotalMonthlyExpenses();
  }, [budget, getTotalMonthlyExpenses]);

  const getExpensesByCategory = useCallback(() => {
    const monthlyExpenses = getCurrentMonthExpenses();
    const categoryTotals: Record<string, number> = {};
    
    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return categoryTotals;
  }, [getCurrentMonthExpenses]);

  return useMemo(() => ({
    expenses,
    budget,
    settings,
    isLoading,
    hasSeenSplash,
    t,
    draft,
    addExpense,
    updateDraft,
    clearDraft,
    updateBudget,
    updateSettings,
    clearAllData,
    getCurrentMonthExpenses,
    getTotalMonthlyExpenses,
    getRemainingBudget,
    getExpensesByCategory,
    markSplashAsSeen,
  }), [expenses, budget, settings, isLoading, hasSeenSplash, t, draft, addExpense, updateDraft, clearDraft, updateBudget, updateSettings, clearAllData, getCurrentMonthExpenses, getTotalMonthlyExpenses, getRemainingBudget, getExpensesByCategory, markSplashAsSeen]);
});