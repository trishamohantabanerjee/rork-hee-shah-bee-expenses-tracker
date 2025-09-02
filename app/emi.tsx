import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Platform 
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Save, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useExpenseStore } from '@/hooks/expense-store';
import type { PaymentType } from '@/types/expense';
import DateTimePicker from '@react-native-community/datetimepicker';

const paymentTypes: PaymentType[] = ['UPI', 'Debit Card', 'Credit Card', 'Cash'];

export default function EMIScreen() {
  const { emis, addEMI, updateEMI, deleteEMI, t } = useExpenseStore();
  const [loanType, setLoanType] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sanitizeNumeric = (text: string) => text.replace(/[^0-9.]/g, '');

  const handleAddEMI = async () => {
    if (!loanType || !amount || !dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const success = await addEMI({
      loanType,
      amount: numAmount,
      dueDate,
      paymentType,
      notes,
      isPaid: false,
    });
    if (success) {
      resetForm();
      Alert.alert('Success', 'EMI added successfully');
    } else {
      Alert.alert('Error', 'Failed to add EMI');
    }
  };

  const handleTogglePaid = async (id: string, isPaid: boolean) => {
    const success = await updateEMI(id, { isPaid: !isPaid });
    if (!success) {
      Alert.alert('Error', 'Failed to update EMI');
    }
  };

  const handleDeleteEMI = (id: string) => {
    Alert.alert('Delete EMI', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const success = await deleteEMI(id);
        if (success) {
          Alert.alert('Deleted', 'EMI deleted successfully');
        } else {
          Alert.alert('Error', 'Failed to delete EMI');
        }
      }},
    ]);
  };

  const resetForm = () => {
    setLoanType('');
    setAmount('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setPaymentType('Cash');
    setNotes('');
    setEditingId(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      if (selectedDate < today) {
        Alert.alert('Invalid Date', 'Cannot select past dates for due date.');
        return;
      }
      setDueDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Loan EMI Management',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Manage Loan EMIs</Text>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={loanType}
              onChangeText={setLoanType}
              placeholder="Loan Type (e.g., Home, Car)"
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.amountContainer}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(txt) => setAmount(sanitizeNumeric(txt))}
                placeholder="EMI Amount"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={20} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>{new Date(dueDate).toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(dueDate)}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            <View style={styles.paymentContainer}>
              <Text style={styles.label}>Payment Type:</Text>
              {paymentTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.paymentOption, paymentType === type && styles.paymentOptionActive]}
                  onPress={() => setPaymentType(type)}
                >
                  <Text style={[styles.paymentText, paymentType === type && styles.paymentTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textSecondary}
              multiline
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddEMI}>
              <Plus size={20} color={Colors.background} />
              <Text style={styles.addButtonText}>Add EMI</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emiList}>
            <Text style={styles.sectionTitle}>Your EMIs</Text>
            {emis.map((emi) => (
              <View key={emi.id} style={styles.emiItem}>
                <View style={styles.emiHeader}>
                  <Text style={styles.emiType}>{emi.loanType}</Text>
                  <TouchableOpacity onPress={() => handleTogglePaid(emi.id, emi.isPaid)}>
                    {emi.isPaid ? <CheckCircle size={24} color={Colors.primary} /> : <Circle size={24} color={Colors.textSecondary} />}
                  </TouchableOpacity>
                </View>
                <Text style={styles.emiAmount}>₹{emi.amount.toLocaleString()}</Text>
                <Text style={styles.emiDue}>Due: {new Date(emi.dueDate).toLocaleDateString()}</Text>
                <Text style={styles.emiPayment}>Payment: {emi.paymentType}</Text>
                {emi.notes && <Text style={styles.emiNotes}>{emi.notes}</Text>}
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEMI(emi.id)}>
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    marginTop: 20,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    color: Colors.text,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  currency: {
    color: Colors.primary,
    fontSize: 18,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  paymentContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  paymentOption: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentOptionActive: {
    backgroundColor: Colors.primary,
  },
  paymentText: {
    color: Colors.text,
    textAlign: 'center',
  },
  paymentTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    color: Colors.text,
    fontSize: 16,
    minHeight: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  emiList: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  emiItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emiType: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emiAmount: {
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 4,
  },
  emiDue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emiPayment: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emiNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});