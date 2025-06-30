import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calculator, DollarSign } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const EXPENSE_CATEGORIES = [
  "Electricity", "Rent", "Salary", "EV Electricity", "Restaurant",
  "Fuel/Travel", "Savings", "Dues Payment", "Labour Payment", 
  "Commission", "Maintenance", "Account Opening Charge", "First Aid", "Others"
];

export default function ExpensesScreen() {
  const { user } = useAuth();
  const { googleSheetsUrl } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [category, setCategory] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || !amount || !paymentMode || !category) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!googleSheetsUrl) {
      Alert.alert('Error', 'Google Sheets URL not configured');
      return;
    }

    setIsSubmitting(true);
    try {
      const date = new Date().toLocaleDateString();
      const formData = new FormData();
      formData.append('action', 'submitExpense');
      formData.append('date', date);
      formData.append('desc', description.trim());
      formData.append('amt', amount);
      formData.append('paymode', paymentMode);
      formData.append('cat', category);
      formData.append('remarks', remarks.trim());

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        Alert.alert('Success', 'Expense recorded successfully!');
        // Reset form
        setDescription('');
        setAmount('');
        setPaymentMode('');
        setCategory('');
        setRemarks('');
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!googleSheetsUrl) {
    return (
      <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Setup Required</Text>
            <Text style={styles.setupText}>
              Please configure your Google Sheets URL in Settings to get started.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Text style={styles.setupButtonText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Calculator size={32} color="#1976d2" />
            <View>
              <Text style={styles.title}>Expenses</Text>
              <Text style={styles.subtitle}>Track business expenses</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <DollarSign size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Add Expense</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter expense description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (Rs.) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Mode *</Text>
                <View style={styles.paymentMethods}>
                  {['Cash', 'Esewa', 'Fonepay'].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentButton,
                        paymentMode === method && styles.paymentButtonActive
                      ]}
                      onPress={() => setPaymentMode(method)}
                    >
                      <Text style={[
                        styles.paymentButtonText,
                        paymentMode === method && styles.paymentButtonActiveText
                      ]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={setCategory}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select category..." value="" />
                    {EXPENSE_CATEGORIES.map(cat => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Remarks (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Additional notes"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Recording...' : 'Record Expense'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
  },
  setupText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#b3e5fc',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  paymentButtonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  paymentButtonActiveText: {
    color: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});