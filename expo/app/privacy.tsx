import React from 'react';
    import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
    import { router } from 'expo-router';
    import { SafeAreaView } from 'react-native-safe-area-context';
    import { ArrowLeft, Shield } from 'lucide-react-native';
    import { Colors } from '@/constants/colors';
    import { useExpenseStore } from '@/hooks/expense-store';

    export default function PrivacyPolicyScreen() {
      const { updateSettings, t, settings } = useExpenseStore();

      const handleAgree = async () => {
        await updateSettings({ hasAcceptedPrivacy: true });
        router.replace('/(tabs)/home');
      };

      const handleBack = () => {
        router.replace('/(tabs)/home');
      };

      const privacyText = `HeeSaaBee collects no personal data. All expenses, including payment types and EMI data, remain local on your device. We only collect minimal, anonymized diagnostics if you explicitly opt-in later. You may export or delete all data at any time. For questions, contact support-heesaabee@beindiya.online.

    Under India's DPDP Act 2023, we ensure data minimization and require your consent for any future updates.

    For GDPR (EU users): You have rights to access, delete, or port your data—contact support.

    For CCPA (US users): Opt-out of data sales (none occur).

    No tracking or ads. By using, you consent to local storage only.

    No login, sign-in, or personal identifiers are required or stored.

    Users can delete their data at any time ("Delete All Data").

    "Copy Expenses for Sheets" is user's responsibility; no data is sent outside the browser/app.

    "Autopay Deduction" is for logging detected autopayments only; no banking integrations or third-party sharing.

    For questions: support-heesaabee@beindiya.online

    Updated: September 2025.`;

      return (
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              {settings.hasAcceptedPrivacy && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <ArrowLeft size={24} color={Colors.text} />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>{t.privacyPolicy}</Text>
            </View>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.content}>
                {privacyText}
              </Text>
            </ScrollView>
            
            {!settings.hasAcceptedPrivacy && (
              <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
                <Shield size={20} color={Colors.background} />
                <Text style={styles.agreeButtonText}>{t.agree}</Text>
              </TouchableOpacity>
            )}
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
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
      },
      backButton: {
        marginRight: 12,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        flex: 1,
      },
      scrollView: {
        flex: 1,
        paddingHorizontal: 20,
      },
      content: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        marginBottom: 40,
      },
      agreeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
      },
      agreeButtonText: {
        color: Colors.background,
        fontSize: 18,
        fontWeight: '600',
      },
    });