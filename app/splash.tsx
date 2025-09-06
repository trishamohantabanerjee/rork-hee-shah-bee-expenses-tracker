import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { IndianRupee, Shield } from 'lucide-react-native';
import { useExpenseStore } from '../hooks/expense-store';

export default function SplashScreen() {
  const { settings, isLoading, markSplashAsSeen, updateSettings } = useExpenseStore();
  const [showPrivacyPrompt, setShowPrivacyPrompt] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.8), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      if (!isLoading) {
        await markSplashAsSeen();
        if (!settings.hasAcceptedPrivacy) {
          setShowPrivacyPrompt(true);
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, settings.hasAcceptedPrivacy, markSplashAsSeen, fadeAnim, scaleAnim]);

  const handleAgree = async () => {
    await updateSettings({ hasAcceptedPrivacy: true });
    router.replace('/(tabs)/home');
  };

  const handleViewPrivacyPolicy = () => {
    router.push('/privacy');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <IndianRupee size={60} color="#25D366" strokeWidth={2} />
        </View>
        <Text style={styles.title}>HeeSaaBee</Text>
        
        {showPrivacyPrompt ? (
          <View style={styles.privacyPrompt}>
            <Text style={styles.privacyText}>
              By continuing, you agree to our{' '}
              <Text 
                style={styles.privacyLink} 
                onPress={handleViewPrivacyPolicy}
              >
                Privacy Policy
              </Text>
            </Text>
            <TouchableOpacity 
              style={styles.agreeButton}
              onPress={handleAgree}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.agreeButtonText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.subtitle}>Track your expenses</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001F3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#002A5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
  },
  privacyPrompt: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  privacyLink: {
    color: '#25D366',
    textDecorationLine: 'underline',
  },
  agreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});