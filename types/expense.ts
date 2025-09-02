export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  monthly: number;
  year: number;
  month: number;
}

export interface AppSettings {
  language: 'en' | 'hi';
  darkMode: boolean;
  hasAcceptedPrivacy: boolean;
  appLockEnabled?: boolean;
}

export type CategoryType = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Healthcare' | 'Education' | 'Others' | 'Subtract' | 'AutopayDeduction';