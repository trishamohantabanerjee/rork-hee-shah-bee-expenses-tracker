export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  paymentType?: PaymentType;
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

export type CategoryType = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Shopping' | 'Healthcare' | 'Education' | 'Others' | 'Subtract' | 'AutopayDeduction' | 'LoanEMI';

export type PaymentType = 'UPI' | 'Debit Card' | 'Credit Card' | 'Cash';

export interface LoanEMI {
  id: string;
  loanType: string;
  amount: number;
  dueDate: string;
  paymentType: PaymentType;
  notes?: string;
  isPaid: boolean;
  createdAt: string;
}