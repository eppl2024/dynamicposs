import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Database, Link } from 'lucide-react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [googleSheetsUrl, setGoogleSheetsUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const { login, user } = useAuth();
  const { googleSheetsUrl: storedUrl, setGoogleSheetsUrl } = useApp();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  useEffect(() => {
    if (storedUrl) {
      setGoogleSheetsUrlInput(storedUrl);
    } else {
      setShowUrlConfig(true);
    }
  }, [storedUrl]);

  const testConnection = async () => {
    if (!googleSheetsUrl.trim()) {
      Alert.alert('Error', 'Please enter a Google Sheets URL');
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch(`${googleSheetsUrl.trim()}?action=getProducts`);
      if (response.ok) {
        Alert.alert('Success', 'Connection to Google Sheets successful!');
        return true;
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Google Sheets. Please check the URL.');
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveGoogleSheetsUrl = async () => {
    if (!googleSheetsUrl.trim()) {
      Alert.alert('Error', 'Please enter a Google Sheets URL');
      return;
    }

    try {
      await setGoogleSheetsUrl(googleSheetsUrl.trim());
      setShowUrlConfig(false);
      Alert.alert('Success', 'Google Sheets URL saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save Google Sheets URL');
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    if (!storedUrl && !googleSheetsUrl.trim()) {
      Alert.alert('Error', 'Please configure Google Sheets URL first');
      return;
    }

    // If URL is entered but not saved, save it first
    if (googleSheetsUrl.trim() && googleSheetsUrl.trim() !== storedUrl) {
      await saveGoogleSheetsUrl();
    }

    setIsLoading(true);
    try {
      const success = await login(username.trim(), password.trim());
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e3f2fd', '#fce4ec']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.loginCard}>
              <View style={styles.logoContainer}>
                <Text style={styles.title}>Energy Palace</Text>
                <Text style={styles.subtitle}>Pvt. Ltd.</Text>
              </View>

              {showUrlConfig && (
                <View style={styles.configSection}>
                  <View style={styles.configHeader}>
                    <Database size={24} color="#1976d2" />
                    <Text style={styles.configTitle}>Setup Required</Text>
                  </View>
                  
                  <Text style={styles.configDescription}>
                    Please configure your Google Sheets URL to continue.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Google Sheets Web App URL *</Text>
                    <TextInput
                      style={styles.urlInput}
                      placeholder="https://script.google.com/macros/s/..."
                      value={googleSheetsUrl}
                      onChangeText={setGoogleSheetsUrlInput}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.testButton, isTestingConnection && styles.buttonDisabled]}
                      onPress={testConnection}
                      disabled={isTestingConnection}
                    >
                      <Link size={16} color="#1976d2" />
                      <Text style={styles.testButtonText}>
                        {isTestingConnection ? 'Testing...' : 'Test'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={saveGoogleSheetsUrl}
                    >
                      <Text style={styles.saveButtonText}>Save URL</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />
                </View>
              )}

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                {!showUrlConfig && (
                  <TouchableOpacity
                    style={styles.configToggleButton}
                    onPress={() => setShowUrlConfig(true)}
                  >
                    <Settings size={16} color="#666" />
                    <Text style={styles.configToggleText}>Configure Google Sheets URL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 32,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  configSection: {
    marginBottom: 24,
    paddingBottom: 24,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  configDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
    gap: 4,
  },
  testButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1976d2',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  configToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  configToggleText: {
    color: '#666',
    fontSize: 14,
  },
});