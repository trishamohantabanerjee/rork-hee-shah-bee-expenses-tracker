import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Globe, 
  Moon, 
  Trash2, 
  Download, 
  Upload, 
  Shield,
  ChevronRight,
  CalendarClock,
  Lock
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData, clearDailyData, generateCSV, t } = useExpenseStore();

  const handleLanguageToggle = () => {
    const newLanguage = settings.language === 'en' ? 'hi' : 'en';
    updateSettings({ language: newLanguage });
  };

  const handleDarkModeToggle = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      t.confirmClear,
      [
        { text: t.no, style: 'cancel' },
        { 
          text: t.yes, 
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              Alert.alert('Success', 'All data cleared successfully');
            } else {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleBackup = () => {
    try {
      const csv = generateCSV();
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'heesaabee-backup.csv';
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Backup', 'CSV downloaded');
      } else {
        router.push({ pathname: '/export', params: { t: Date.now().toString() } });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create backup');
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Data',
      'Restore functionality would load data from a backup file.',
      [{ text: 'OK' }]
    );
  };

  const settingsItems = [
    {
      icon: Globe,
      title: t.language,
      subtitle: settings.language === 'en' ? 'English' : 'हिंदी',
      onPress: handleLanguageToggle,
      showChevron: true,
    },
    {
      icon: CalendarClock,
      title: t.clearDailyData ?? 'Clear Daily Data',
      subtitle: t.clearDailyDataSubtitle ?? "Delete today's entries only",
      onPress: () => router.push('/clear-days'),
      showChevron: true,
    },
    {
      icon: Moon,
      title: t.darkMode,
      subtitle: 'Always enabled for better experience',
      onPress: handleDarkModeToggle,
      showSwitch: true,
      switchValue: settings.darkMode,
    },
    {
      icon: Download,
      title: t.backup,
      subtitle: 'Save your data locally',
      onPress: handleBackup,
      showChevron: true,
    },
    {
      icon: Upload,
      title: t.restore,
      subtitle: 'Load data from backup',
      onPress: handleRestore,
      showChevron: true,
    },
    {
      icon: Shield,
      title: t.privacyPolicy,
      subtitle: 'View privacy policy',
      onPress: () => router.push('/privacy'),
      showChevron: true,
    },
    {
      icon: Lock,
      title: 'App Lock',
      subtitle: settings.appLockEnabled ? 'Biometric lock enabled' : 'Enable biometric lock',
      onPress: async () => {
        try {
          if (settings.appLockEnabled) {
            await updateSettings({ appLockEnabled: false });
            Alert.alert('App Lock', 'Disabled');
            return;
          }
          if (typeof navigator !== 'undefined' && 'credentials' in navigator && Platform.OS === 'web') {
            await updateSettings({ appLockEnabled: true });
            Alert.alert('App Lock', 'Enabled (web mock)');
            return;
          }
          const LocalAuthentication = await import('expo-local-authentication');
          const enrolled = await LocalAuthentication.hasHardwareAsync();
          const supported = await LocalAuthentication.isEnrolledAsync();
          if (!enrolled || !supported) {
            Alert.alert('Unavailable', 'No biometrics enrolled on this device.');
            return;
          }
          const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable App Lock' });
          if (result.success) {
            await updateSettings({ appLockEnabled: true });
            Alert.alert('App Lock', 'Enabled');
          }
        } catch (e) {
          Alert.alert('Error', 'Failed to configure app lock');
        }
      },
      showChevron: true,
    },
    {
      icon: Trash2,
      title: t.clearData,
      subtitle: 'Delete all expenses and budget',
      onPress: handleClearData,
      showChevron: true,
      destructive: true,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t.settings}</Text>
          
          <View style={styles.settingsContainer}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.settingItem,
                  item.destructive && styles.destructiveItem
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[
                    styles.iconContainer,
                    item.destructive && styles.destructiveIconContainer
                  ]}>
                    <item.icon 
                      size={20} 
                      color={item.destructive ? Colors.error : Colors.primary} 
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[
                      styles.settingTitle,
                      item.destructive && styles.destructiveText
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                
                <View style={styles.settingRight}>
                  {item.showSwitch && (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onPress}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.text}
                    />
                  )}
                  {item.showChevron && (
                    <ChevronRight 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>{t.appName}</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.description}>
              A simple and secure expense tracker that keeps your data private.
            </Text>
          </View>
        </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
    marginTop: 20,
  },
  settingsContainer: {
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  destructiveItem: {
    borderColor: `${Colors.error}30`,
    backgroundColor: `${Colors.error}10`,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIconContainer: {
    backgroundColor: `${Colors.error}20`,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  destructiveText: {
    color: Colors.error,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});