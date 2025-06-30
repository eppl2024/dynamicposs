import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Calculator } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function ChargingScreen() {
  const { user } = useAuth();
  const { googleSheetsUrl } = useApp();
  const [startPercent, setStartPercent] = useState('');
  const [endPercent, setEndPercent] = useState('');
  const [perPercentRate, setPerPercentRate] = useState('');
  const [kcal, setKcal] = useState('');
  const [perUnitRate, setPerUnitRate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateAmount = () => {
    const start = parseFloat(startPercent) || 0;
    const end = parseFloat(endPercent) || 0;
    const perPct = parseFloat(perPercentRate) || 0;
    const kcalValue = parseFloat(kcal) || 0;
    const perUnit = parseFloat(perUnitRate) || 0;

    let amount1 = 0;
    let amount2 = 0;

    if (end > start && perPct) {
      amount1 = (end - start) * perPct;
    }

    if (kcalValue && perUnit) {
      amount2 = kcalValue * perUnit;
    }

    return amount1 + amount2;
  };

  const totalAmount = calculateAmount();

  const handleSubmit = async () => {
    if (!totalAmount || !paymentMode) {
      Alert.alert('Error', 'Please fill at least one charging method and select payment mode');
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
      formData.append('action', 'submitCharging');
      formData.append('date', date);
      formData.append('start', startPercent);
      formData.append('end', endPercent);
      formData.append('perpct', perPercentRate);
      formData.append('kcal', kcal);
      formData.append('perunit', perUnitRate);
      formData.append('amount', totalAmount.toFixed(2));
      formData.append('paymode', paymentMode);

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        Alert.alert('Success', 'Charging record submitted successfully!');
        // Reset form
        setStartPercent('');
        setEndPercent('');
        setPerPercentRate('');
        setKcal('');
        setPerUnitRate('');
        setPaymentMode('');
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit charging record');
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
            <Zap size={32} color="#1976d2" />
            <View>
              <Text style={styles.title}>Charging Station</Text>
              <Text style={styles.subtitle}>Calculate billing amounts</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Calculator size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Billing Calculator</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Percentage-based Charging</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Start %"
                  value={startPercent}
                  onChangeText={setStartPercent}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="End %"
                  value={endPercent}
                  onChangeText={setEndPercent}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Rate per %"
                value={perPercentRate}
                onChangeText={setPerPercentRate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Unit-based Charging</Text>
              <TextInput
                style={styles.input}
                placeholder="Kcal consumed"
                value={kcal}
                onChangeText={setKcal}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Rate per unit"
                value={perUnitRate}
                onChangeText={setPerUnitRate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>Rs. {totalAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payment Method</Text>
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

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Charging'}
              </Text>
            </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  totalContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
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
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
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