import { Redirect } from 'expo-router';
import { useExpenseStore } from '../hooks/expense-store';

export default function Index() {
  const { hasSeenSplash, isLoading, settings } = useExpenseStore();

  if (isLoading) {
    return null;
  }

  if (!hasSeenSplash) {
    return <Redirect href="/splash" />;
  }

  if (!settings.hasAcceptedPrivacy) {
    return <Redirect href="/privacy" />;
  }

  return <Redirect href="/(tabs)/home" />;
}