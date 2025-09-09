import { Redirect } from 'expo-router';
import { useExpenseStore } from '../hooks/expense-store';

export default function Index() {
  const { hasSeenSplash, isLoading, settings, budget } = useExpenseStore();

  if (isLoading) {
    return null;
  }

  if (!hasSeenSplash) {
    return <Redirect href="/splash" />;
  }

  if (!settings.hasAcceptedPrivacy) {
    return <Redirect href="/privacy" />;
  }

  // REQUIREMENT 1: Monthly Budget Setting - Check if budget is set for current month
  const now = new Date();
  const needsBudgetSetup = !budget || 
    budget.year !== now.getFullYear() || 
    budget.month !== now.getMonth();

  if (needsBudgetSetup) {
    return <Redirect href="/budget" />;
  }

  return <Redirect href="/(tabs)/home" />;
}