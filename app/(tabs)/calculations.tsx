import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Calculator, RefreshCw, Plus, Settings } from 'lucide-react-native';

export default function CalculationsScreen() {
  const { user } = useAuth();
  const [calculationData, setCalculationData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationSheetUrl, setCalculationSheetUrl] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    loadStoredUrl();
  }, []);

  useEffect(() => {
    if (calculationSheetUrl) {
      loadCalculations();
    }
  }, [calculationSheetUrl]);

  const loadStoredUrl = async () => {
    try {
      const stored = localStorage.getItem('calculationSheetUrl');
      if (stored) {
        setCalculationSheetUrl(stored);
      } else {
        setShowUrlModal(true);
      }
    } catch (error) {
      console.error('Error loading stored URL:', error);
    }
  };

  const saveUrl = () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid Google Sheets URL');
      return;
    }

    try {
      localStorage.setItem('calculationSheetUrl', tempUrl.trim());
      setCalculationSheetUrl(tempUrl.trim());
      setShowUrlModal(false);
      setTempUrl('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save URL');
    }
  };

  const loadCalculations = async () => {
    if (!calculationSheetUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract sheet ID from Google Sheets URL
      const sheetId = extractSheetId(calculationSheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }

      // Use Google Sheets API to fetch data as CSV
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calculation data');
      }
      
      const csvText = await response.text();
      const data = parseCSV(csvText);
      setCalculationData(data);
    } catch (err) {
      setError('Failed to load calculations. Please check your sheet URL and sharing settings.');
      console.error('Error loading calculations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n');
    return lines
      .filter(line => line.trim())
      .map(line => {
        // Simple CSV parsing - handles basic cases
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      });
  };

  const renderTable = () => {
    if (!calculationData.length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No calculation data available</Text>
        </View>
      );
    }

    const headers = calculationData[0];
    const rows = calculationData.slice(1).filter(row => 
      row.some(cell => cell !== "" && cell !== null && cell !== undefined)
    );

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            {headers.map((header: string, index: number) => (
              <View key={index} style={[styles.tableCell, styles.headerCell]}>
                <Text style={styles.headerText}>{header || ''}</Text>
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          {rows.map((row: string[], rowIndex: number) => (
            <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 && styles.evenRow]}>
              {row.map((cell: string, cellIndex: number) => (
                <View key={cellIndex} style={styles.tableCell}>
                  <Text style={styles.cellText}>{cell || ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Calculator size={32} color="#1976d2" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Calculations</Text>
              <Text style={styles.subtitle}>Your custom calculations</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowUrlModal(true)}
            >
              <Settings size={20} color="#1976d2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={loadCalculations}
              disabled={isLoading || !calculationSheetUrl}
            >
              <RefreshCw size={20} color="#1976d2" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Calculator size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Calculation Results</Text>
            </View>

            {!calculationSheetUrl ? (
              <View style={styles.setupContainer}>
                <Text style={styles.setupTitle}>Setup Required</Text>
                <Text style={styles.setupText}>
                  Please configure your calculation sheet URL to display your custom calculations.
                </Text>
                <TouchableOpacity
                  style={styles.setupButton}
                  onPress={() => setShowUrlModal(true)}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.setupButtonText}>Add Sheet URL</Text>
                </TouchableOpacity>
              </View>
            ) : isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.loadingText}>Loading calculations...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadCalculations}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              renderTable()
            )}
          </View>

          {calculationSheetUrl && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Sheet Information</Text>
              <Text style={styles.infoText}>
                Connected to your calculation sheet. Data updates automatically when you refresh.
              </Text>
              <Text style={styles.infoNote}>
                Note: Make sure your Google Sheet is shared with "Anyone with the link can view" for the app to access it.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* URL Configuration Modal */}
        <Modal
          visible={showUrlModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowUrlModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculation Sheet URL</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUrlModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Google Sheets URL *</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={tempUrl}
                  onChangeText={setTempUrl}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to get your sheet URL:</Text>
                <Text style={styles.instructionStep}>1. Open your Google Sheets calculation file</Text>
                <Text style={styles.instructionStep}>2. Click "Share" and set to "Anyone with the link can view"</Text>
                <Text style={styles.instructionStep}>3. Copy the entire URL from your browser</Text>
                <Text style={styles.instructionStep}>4. Paste it above and save</Text>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveUrl}>
                <Text style={styles.saveButtonText}>Save URL</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  setupContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  setupText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e3f2fd',
    minWidth: 120,
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#e3f2fd',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});