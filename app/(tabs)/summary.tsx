import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus,
  Utensils,
  Car,
  Zap,
  Gamepad2,
  ShoppingBag,
  Heart,
  GraduationCap,
  MoreHorizontal,
  Trash2,
} from 'lucide-react-native';
import { useExpenseStore } from '@/hooks/expense-store';
import { Colors, CategoryColors } from '@/constants/colors';
import type { CategoryType } from '@/types/expense';

const categoryIcons: Record<CategoryType, React.ComponentType<any>> = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Gamepad2,
  Shopping: ShoppingBag,
  Healthcare: Heart,
  Education: GraduationCap,
  Others: MoreHorizontal,
};

interface CategoryRowProps {
  category: CategoryType;
  amount: number;
  isActive: boolean;
  onPress: () => void;
  animatedValue: Animated.Value;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  amount,
  isActive,
  onPress,
  animatedValue,
}) => {
  const { t } = useExpenseStore();
  const IconComponent = categoryIcons[category];
  
  const animatedStyle = {
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.categoryRow, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.categoryContent,
          isActive && { backgroundColor: Colors.primary + '20' },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: CategoryColors[category] + '20' },
            ]}
          >
            <IconComponent
              size={20}
              color={CategoryColors[category]}
            />
          </View>
          <Text style={styles.categoryName}>
            {t.categories[category]}
          </Text>
        </View>
        <Text style={styles.categoryAmount}>₹{amount.toLocaleString()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SummaryScreen() {
  const {
    getExpensesByCategory,
    getTotalMonthlyExpenses,
    clearAllData,
    t,
  } = useExpenseStore();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [animatedValues] = useState<Record<CategoryType, Animated.Value>>(() => {
    const entries = (Object.keys(categoryIcons) as Array<CategoryType>).map((cat) => [cat, new Animated.Value(0)] as const);
    return Object.fromEntries(entries) as Record<CategoryType, Animated.Value>;
  });

  const { expenses } = useExpenseStore();
  const categoryTotals = useMemo(() => getExpensesByCategory(), [expenses]);
  const totalExpenses = useMemo(() => getTotalMonthlyExpenses(), [expenses]);
  
  const allCategories: CategoryType[] = [
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Others',
  ];

  React.useEffect(() => {
    const animations = allCategories.map((category, index) => {
      return Animated.timing(animatedValues[category], {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      });
    });

    Animated.stagger(50, animations).start();
  }, []);

  React.useEffect(() => {
    (Object.keys(categoryTotals) as Array<CategoryType>).forEach((category) => {
      const val = animatedValues[category];
      if (!val) return;
      val.stopAnimation(() => {
        val.setValue(0.8);
        Animated.timing(val, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    });
  }, [categoryTotals]);

  const handleCategoryPress = async (category: CategoryType) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    
    if (Platform.OS !== 'web') {
      try {
        const Haptics = await import('expo-haptics');
        await Haptics.selectionAsync();
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  };

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  const handleClearAll = () => {
    Alert.alert(
      t.clearAll,
      t.confirmClear,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              setSelectedCategory(null);
            }
          },
        },
      ]
    );
  };

  const hasExpenses = totalExpenses > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="summary-safe-area">
      <View style={styles.header} testID="summary-header">
        <Text style={styles.title}>{t.summary}</Text>
        {hasExpenses && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
            testID="summary-clear-all"
          >
            <Trash2 size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="summary-scroll"
      >
        {!hasExpenses ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.noExpenses}</Text>
            <Text style={styles.emptySubtitle}>{t.addFirstExpense}</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableContainer} testID="summary-table">
              <View style={styles.tableHeader} testID="summary-table-header">
                <Text style={styles.tableHeaderText}>{t.category}</Text>
                <Text style={styles.tableHeaderText}>{t.amount}</Text>
              </View>
              
              {allCategories.map((category) => {
                const amount = categoryTotals[category] || 0;
                return (
                  <CategoryRow
                    key={category}
                    category={category}
                    amount={amount}
                    isActive={selectedCategory === category}
                    onPress={() => handleCategoryPress(category)}
                    animatedValue={animatedValues[category]}
                  />
                );
              })}
              
              <View style={styles.totalRow} testID="summary-total-row">
                <View style={styles.totalContent}>
                  <Text style={styles.totalLabel}>{t.total}</Text>
                  <Text style={styles.totalAmount}>₹{totalExpenses.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddExpense}
        activeOpacity={0.8}
        testID="summary-add-expense"
        accessibilityRole="button"
        accessibilityLabel={t.addExpense}
      >
        <Plus size={24} color={Colors.text} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'system-ui',
    }),
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tableContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalRow: {
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});