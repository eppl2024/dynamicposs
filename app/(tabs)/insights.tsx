import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, TrendingUp, RefreshCw } from 'lucide-react-native';

export default function InsightsScreen() {
  const { user } = useAuth();
  const { googleSheetsUrl } = useApp();
  const [insightData, setInsightData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (googleSheetsUrl) {
      loadInsights();
    }
  }, [googleSheetsUrl]);

  const loadInsights = async () => {
    if (!googleSheetsUrl) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${googleSheetsUrl}?action=getBepInsight`);
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsightData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load insights');
      console.error('Error loading insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = () => {
    if (!insightData.length || !Array.isArray(insightData[0]) || !insightData[0].length) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No insight data available</Text>
        </View>
      );
    }

    const headers = insightData[0];
    const rows = insightData.slice(1).filter(row => 
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
            <BarChart3 size={32} color="#1976d2" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Business Insights</Text>
              <Text style={styles.subtitle}>Analytics and reports</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadInsights}
            disabled={isLoading}
          >
            <RefreshCw size={20} color="#1976d2" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Data Overview</Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
                <Text style={styles.loadingText}>Loading insights...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              renderTable()
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  refreshButton: {
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