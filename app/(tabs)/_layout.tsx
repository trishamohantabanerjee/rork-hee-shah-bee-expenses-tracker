import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Plus, BarChart3, Settings, List } from 'lucide-react-native';
import { useExpenseStore } from '../../hooks/expense-store';

export default function TabLayout() {
  const { t } = useExpenseStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#25D366',
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarStyle: {
          backgroundColor: '#002A5C',
          borderTopColor: '#004080',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 6,
          height: 56,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
          textAlign: 'center',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.home,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: t.summary || 'Summary',
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: t.budget,
          tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
          href: '/budget',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.reports,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}