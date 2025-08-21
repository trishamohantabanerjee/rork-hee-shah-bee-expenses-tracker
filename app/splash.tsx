import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { IndianRupee } from 'lucide-react-native';
import { useExpenseStore } from '../hooks/expense-store';

export default function SplashScreen() {
  const { settings, isLoading, markSplashAsSeen } = useExpenseStore();
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
          router.replace('/privacy');
        } else {
          router.replace('/(tabs)/home');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, settings.hasAcceptedPrivacy, markSplashAsSeen, fadeAnim, scaleAnim]);

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
        <Text style={styles.title}>Hee-Shah-Bee</Text>
        <Text style={styles.subtitle}>Track your expenses</Text>
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
});