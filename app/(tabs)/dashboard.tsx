import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutDashboard, RefreshCw, Plus, Trash2, Eye, Settings, FileSpreadsheet, Wifi, WifiOff } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { 
    googleSheets, 
    activeSheet, 
    setActiveSheet, 
    removeGoogleSheet, 
    testSheetConnection,
    loadProducts 
  } = useApp();
  
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: 'connected' | 'disconnected' | 'testing'}>({});

  useEffect(() => {
    // Set the first sheet as selected by default
    if (googleSheets.length > 0 && !selectedSheetId) {
      setSelectedSheetId(googleSheets[0].id);
    }
  }, [googleSheets]);

  useEffect(() => {
    if (selectedSheetId) {
      loadSheetData();
    }
  }, [selectedSheetId]);

  useEffect(() => {
    // Auto-refresh when active sheet changes
    if (activeSheet && selectedSheetId === activeSheet.id) {
      loadSheetData();
    }
  }, [activeSheet]);

  const loadSheetData = async () => {
    const sheet = googleSheets.find(s => s.id === selectedSheetId);
    if (!sheet) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${sheet.url}?action=getBepInsight`);
      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }
      const data = await response.json();
      setSheetData(Array.isArray(data) ? data : []);
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        [sheet.id]: 'connected'
      }));
    } catch (err) {
      setError('Failed to load sheet data');
      setConnectionStatus(prev => ({
        ...prev,
        [sheet.id]: 'disconnected'
      }));
      console.error('Error loading sheet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSelect = async (sheetId: string) => {
    setSelectedSheetId(sheetId);
    
    // If this sheet is not the active one, switch to it
    const sheet = googleSheets.find(s => s.id === sheetId);
    if (sheet && activeSheet?.id !== sheetId) {
      await setActiveSheet(sheetId);
      // Reload products for the new active sheet
      await loadProducts();
    }
  };

  const handleDisconnectSheet = (sheetId: string, sheetName: string) => {
    Alert.alert(
      'Disconnect Sheet',
      `Are you sure you want to disconnect "${sheetName}"? This will remove it from your dashboard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoogleSheet(sheetId);
              
              // If we disconnected the selected sheet, select another one
              if (selectedSheetId === sheetId) {
                const remainingSheets = googleSheets.filter(s => s.id !== sheetId);
                if (remainingSheets.length > 0) {
                  setSelectedSheetId(remainingSheets[0].id);
                } else {
                  setSelectedSheetId(null);
                  setSheetData([]);
                }
              }
              
              Alert.alert('Success', 'Sheet disconnected successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect sheet');
            }
          },
        },
      ]
    );
  };

  const testConnection = async (sheetId: string) => {
    const sheet = googleSheets.find(s => s.id === sheetId);
    if (!sheet) return;

    setConnectionStatus(prev => ({
      ...prev,
      [sheetId]: 'testing'
    }));

    try {
      const success = await testSheetConnection(sheet.url);
      setConnectionStatus(prev => ({
        ...prev,
        [sheetId]: success ? 'connected' : 'disconnected'
      }));
      
      Alert.alert(
        success ? 'Connection Successful' : 'Connection Failed',
        success ? 'Sheet is accessible and working properly.' : 'Unable to connect to this sheet. Please check the URL and sharing settings.'
      );
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [sheetId]: 'disconnected'
      }));
      Alert.alert('Error', 'Failed to test connection');
    }
  };

  const renderSheetTabs = () => {
    if (googleSheets.length === 0) {
      return (
        <View style={styles.noSheetsContainer}>
          <FileSpreadsheet size={48} color="#ccc" />
          <Text style={styles.noSheetsText}>No sheets connected</Text>
          <TouchableOpacity
            style={styles.addSheetButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addSheetButtonText}>Add Sheet</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sheetTabs}>
        {googleSheets.map((sheet) => {
          const isSelected = selectedSheetId === sheet.id;
          const isActive = activeSheet?.id === sheet.id;
          const status = connectionStatus[sheet.id] || 'disconnected';
          
          return (
            <View key={sheet.id} style={styles.sheetTabContainer}>
              <TouchableOpacity
                style={[
                  styles.sheetTab,
                  isSelected && styles.sheetTabSelected
                ]}
                onPress={() => handleSheetSelect(sheet.id)}
              >
                <View style={styles.sheetTabHeader}>
                  <Text style={[
                    styles.sheetTabText,
                    isSelected && styles.sheetTabTextSelected
                  ]}>
                    {sheet.name}
                  </Text>
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeIndicatorText}>Active</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.sheetTabStatus}>
                  {status === 'testing' ? (
                    <ActivityIndicator size="small" color="#1976d2" />
                  ) : (
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: status === 'connected' ? '#4caf50' : '#f44336' }
                    ]}>
                      {status === 'connected' ? (
                        <Wifi size={12} color="#fff" />
                      ) : (
                        <WifiOff size={12} color="#fff" />
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.sheetTabActions}>
                <TouchableOpacity
                  style={styles.tabActionButton}
                  onPress={() => testConnection(sheet.id)}
                >
                  <RefreshCw size={14} color="#1976d2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabActionButton, styles.disconnectButton]}
                  onPress={() => handleDisconnectSheet(sheet.id, sheet.name)}
                >
                  <Trash2 size={14} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        <TouchableOpacity
          style={styles.addTabButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Plus size={20} color="#1976d2" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderSheetData = () => {
    if (!selectedSheetId) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Select a sheet to view data</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading sheet data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSheetData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!sheetData.length || !Array.isArray(sheetData[0]) || !sheetData[0].length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available in this sheet</Text>
        </View>
      );
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1).filter(row => 
      row.some((cell: any) => cell !== "" && cell !== null && cell !== undefined)
    );

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            {headers.map((header: string, index: number) => (
              <View key={index} style={[styles.tableCell, styles.headerCell]}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          {rows.map((row: any[], rowIndex: number) => (
            <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 && styles.evenRow]}>
              {row.map((cell: any, cellIndex: number) => (
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
            <LayoutDashboard size={32} color="#1976d2" />
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Manage multiple sheets</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Settings size={20} color="#1976d2" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Sheet Tabs */}
          <View style={styles.tabsContainer}>
            {renderSheetTabs()}
          </View>

          {/* Sheet Data */}
          <View style={styles.dataContainer}>
            <View style={styles.card}>
              {selectedSheetId && (
                <View style={styles.sectionHeader}>
                  <FileSpreadsheet size={24} color="#1976d2" />
                  <Text style={styles.sectionTitle}>
                    {googleSheets.find(s => s.id === selectedSheetId)?.name || 'Sheet Data'}
                  </Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadSheetData}
                    disabled={isLoading}
                  >
                    <RefreshCw size={20} color="#1976d2" />
                  </TouchableOpacity>
                </View>
              )}
              
              {renderSheetData()}
            </View>
          </View>
        </View>
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
  settingsButton: {
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
  tabsContainer: {
    marginBottom: 16,
  },
  sheetTabs: {
    maxHeight: 120,
  },
  sheetTabContainer: {
    marginRight: 12,
  },
  sheetTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  sheetTabSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  sheetTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    flex: 1,
  },
  sheetTabTextSelected: {
    color: '#fff',
  },
  activeIndicator: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  activeIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sheetTabStatus: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    borderRadius: 12,
    padding: 4,
  },
  sheetTabActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tabActionButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 6,
    flex: 1,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#ffebee',
  },
  addTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  noSheetsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSheetsText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
  },
  addSheetButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addSheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    flex: 1,
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
  refreshButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 8,
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
});