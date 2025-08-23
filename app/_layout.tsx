import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ExpenseProvider, useExpenseStore } from "../hooks/expense-store";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="export" options={{ title: "Export CSV" }} />
      <Stack.Screen name="clear-days" options={{ title: "Clear Days" }} />

      <Stack.Screen
        name="add-expense"
        options={{
          presentation: "modal",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="budget"
        options={{
          presentation: "modal",
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const LockGate: React.FC = () => {
  const { settings } = useExpenseStore();
  const [locked, setLocked] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);

  useEffect(() => {
    async function enforceLock() {
      try {
        if (Platform.OS !== 'web' && settings.appLockEnabled) {
          setLocked(true);
          const LocalAuthentication = await import('expo-local-authentication');
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock Hee-Shah-Bee',
            fallbackLabel: 'Use Passcode',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });
          if (result.success) {
            setLocked(false);
          } else {
            setLocked(true);
          }
        } else {
          setLocked(false);
        }
      } catch (e) {
        setLocked(false);
      } finally {
        setAttempted(true);
      }
    }
    enforceLock();
  }, [settings.appLockEnabled]);

  if (!attempted) return null;

  return (
    <Modal visible={locked} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={lockStyles.overlay}>
        <View style={lockStyles.card}>
          <Text style={lockStyles.title}>App Locked</Text>
          <Text style={lockStyles.subtitle}>Authenticate to continue</Text>
          <TouchableOpacity
            testID="lock-authenticate"
            onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  setLocked(false);
                  return;
                }
                const LocalAuthentication = await import('expo-local-authentication');
                const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Hee-Shah-Bee' });
                setLocked(!res.success);
              } catch {
                setLocked(false);
              }
            }}
            activeOpacity={0.8}
            style={lockStyles.button}
          >
            <Text style={lockStyles.buttonText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ExpenseProvider>
          <LockGate />
          <RootLayoutNav />
        </ExpenseProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const lockStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#002A5C', borderRadius: 16, borderWidth: 1, borderColor: '#004080', padding: 20,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#B0B0B0', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#001F3F', fontSize: 16, fontWeight: '700' },
});
