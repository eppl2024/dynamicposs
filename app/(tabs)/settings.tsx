import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Database, User, LogOut, Save, Link, Plus, Trash2, Eye, EyeOff } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { 
    googleSheets, 
    activeSheet, 
    addGoogleSheet, 
    removeGoogleSheet, 
    setActiveSheet, 
    testSheetConnection 
  } = useApp();
  
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async (url: string) => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const success = await testSheetConnection(url);
      setConnectionStatus(success ? 'success' : 'error');
      Alert.alert(
        success ? 'Success' : 'Error',
        success ? 'Connection successful!' : 'Failed to connect to Google Sheets.'
      );
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert('Error', 'Failed to test connection.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAddSheet = async () => {
    if (!newSheetName.trim() || !newSheetUrl.trim()) {
      Alert.alert('Error', 'Please fill in both name and URL');
      return;
    }

    try {
      await addGoogleSheet(newSheetName, newSheetUrl);
      setNewSheetName('');
      setNewSheetUrl('');
      setShowAddSheetModal(false);
      Alert.alert('Success', 'Google Sheet added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add Google Sheet');
    }
  };

  const handleRemoveSheet = (sheetId: string, sheetName: string) => {
    Alert.alert(
      'Remove Sheet',
      `Are you sure you want to remove "${sheetName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoogleSheet(sheetId);
              Alert.alert('Success', 'Google Sheet removed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove Google Sheet');
            }
          },
        },
      ]
    );
  };

  const handleSetActiveSheet = async (sheetId: string) => {
    try {
      await setActiveSheet(sheetId);
      Alert.alert('Success', 'Active sheet changed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to change active sheet');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connection successful';
      case 'error':
        return 'Connection failed';
      default:
        return 'Not tested';
    }
  };

  return (
    <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Settings size={32} color="#1976d2" />
            <View>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Configure your app</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* User Info Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <User size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>User Information</Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Name:</Text>
                <Text style={styles.userInfoValue}>{user?.name}</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Username:</Text>
                <Text style={styles.userInfoValue}>{user?.username}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Google Sheets Management Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Database size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Google Sheets Management</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddSheetModal(true)}
              >
                <Plus size={20} color="#1976d2" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.description}>
              Manage your Google Sheets connections. Each sheet will appear as a separate tab.
            </Text>

            {googleSheets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No Google Sheets configured</Text>
                <TouchableOpacity
                  style={styles.addFirstSheetButton}
                  onPress={() => setShowAddSheetModal(true)}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addFirstSheetButtonText}>Add Your First Sheet</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.sheetsList}>
                {googleSheets.map((sheet) => (
                  <View key={sheet.id} style={styles.sheetItem}>
                    <View style={styles.sheetInfo}>
                      <View style={styles.sheetHeader}>
                        <Text style={styles.sheetName}>{sheet.name}</Text>
                        {sheet.id === activeSheet?.id && (
                          <View style={styles.activeIndicator}>
                            <Text style={styles.activeIndicatorText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sheetUrl} numberOfLines={1}>
                        {sheet.url}
                      </Text>
                    </View>
                    <View style={styles.sheetActions}>
                      {sheet.id !== activeSheet?.id && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleSetActiveSheet(sheet.id)}
                        >
                          <Eye size={16} color="#1976d2" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => testConnection(sheet.url)}
                      >
                        <Link size={16} color="#1976d2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleRemoveSheet(sheet.id, sheet.name)}
                      >
                        <Trash2 size={16} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Setup Instructions Card */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Database size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Setup Instructions</Text>
            </View>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>How to set up Google Sheets integration:</Text>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1.</Text>
                <Text style={styles.stepText}>Create a Google Apps Script project</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2.</Text>
                <Text style={styles.stepText}>Set up your backend code to handle requests</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3.</Text>
                <Text style={styles.stepText}>Deploy as web app and get the URL</Text>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4.</Text>
                <Text style={styles.stepText}>Add the web app URL using the + button above</Text>
              </View>

              <Text style={styles.note}>
                Note: Your Google Apps Script should handle the following actions: login, getProducts, submitOrder, submitCharging, submitExpense, submitDeposit, and getBepInsight.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Add Sheet Modal */}
        <Modal
          visible={showAddSheetModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddSheetModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Google Sheet</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddSheetModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sheet Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Main Store, Branch 2"
                  value={newSheetName}
                  onChangeText={setNewSheetName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Google Sheets Web App URL *</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://script.google.com/macros/s/..."
                  value={newSheetUrl}
                  onChangeText={setNewSheetUrl}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.connectionStatus}>
                <Text style={styles.connectionStatusLabel}>Connection Status:</Text>
                <Text style={[styles.connectionStatusText, { color: getConnectionStatusColor() }]}>
                  {getConnectionStatusText()}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.testButton, isTestingConnection && styles.buttonDisabled]}
                  onPress={() => testConnection(newSheetUrl)}
                  disabled={isTestingConnection}
                >
                  <Link size={20} color="#1976d2" />
                  <Text style={styles.testButtonText}>
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddSheet}>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Add Sheet</Text>
                </TouchableOpacity>
              </View>
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
    flex: 1,
  },
  addButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
  },
  userInfo: {
    marginBottom: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfoLabel: {
    fontSize: 16,
    color: '#666',
  },
  userInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addFirstSheetButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFirstSheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetsList: {
    gap: 12,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  sheetInfo: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  activeIndicator: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetUrl: {
    fontSize: 14,
    color: '#666',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  connectionStatusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  connectionStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
    gap: 8,
  },
  testButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  instructions: {
    gap: 12,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    minWidth: 20,
  },
  stepText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    lineHeight: 20,
  },
});