import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';

export default function PrivacyPolicyScreen() {
  const { updateSettings, t } = useExpenseStore();

  const handleAgree = async () => {
    await updateSettings({ hasAcceptedPrivacy: true });
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t.privacyPolicy}</Text>
          
          <Text style={styles.content}>
            HeeSaaBee collects no personal data. All expenses are stored locally on your device and never shared.
            {'\n\n'}Under India's DPDP Act 2023, we ensure data minimization and require your consent for any future updates.
            {'\n\n'}For GDPR (EU users): You have rights to access, delete, or port your data—contact support.
            {'\n\n'}For CCPA (US users): Opt-out of data sales (none occur).
            {'\n\n'}No tracking or ads. By using, you consent to local storage only.
            {'\n\n'}For questions: support@heesaabee.com
            {'\n\n'}Updated: August 2025.
          </Text>
        </ScrollView>
        
        <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
          <Text style={styles.agreeButtonText}>{t.agree}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    marginTop: 20,
  },
  content: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 40,
  },
  agreeButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  agreeButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});