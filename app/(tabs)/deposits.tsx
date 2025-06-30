import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, CreditCard } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

export default function DepositsScreen() {
  const { user } = useAuth();
  const { googleSheetsUrl } = useApp();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('');
  const [depositedBy, setDepositedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !mode || !depositedBy.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!googleSheetsUrl) {
      Alert.alert('Error', 'Google Sheets URL not configured');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', 'submitDeposit');
      formData.append('amount', amount);
      formData.append('mode', mode);
      formData.append('depositedBy', depositedBy.trim());

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        Alert.alert('Success', 'Deposit recorded successfully!');
        // Reset form
        setAmount('');
        setMode('');
        setDepositedBy('');
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record deposit');
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
            <DollarSign size={32} color="#1976d2" />
            <View>
              <Text style={styles.title}>Deposits</Text>
              <Text style={styles.subtitle}>Record money deposits</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <CreditCard size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Add Deposit</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deposit Amount (Rs.) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deposit Mode *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={mode}
                    onValueChange={setMode}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select deposit mode..." value="" />
                    <Picker.Item label="Fonepay" value="Fonepay" />
                    <Picker.Item label="Esewa" value="Esewa" />
                    <Picker.Item label="Bank Transfer" value="Bank transfer" />
                    <Picker.Item label="Cash Deposit" value="Cash Deposit" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deposited By *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name of depositor"
                  value={depositedBy}
                  onChangeText={setDepositedBy}
                />
              </View>

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Deposit Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>Rs. {amount || '0.00'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mode:</Text>
                  <Text style={styles.summaryValue}>{mode || 'Not selected'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Deposited by:</Text>
                  <Text style={styles.summaryValue}>{depositedBy || 'Not specified'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Recording...' : 'Record Deposit'}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  summary: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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