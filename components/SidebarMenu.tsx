import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  LayoutDashboard, 
  Zap, 
  Calculator, 
  DollarSign, 
  ChartBar as BarChart3, 
  Settings,
  Mic,
  User,
  LogOut
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import VoiceAssistant from './VoiceAssistant';

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
  currentRoute: string;
}

export default function SidebarMenu({ visible, onClose, currentRoute }: SidebarMenuProps) {
  const { user, logout } = useAuth();
  const { googleSheets, activeSheet } = useApp();
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    {
      id: 'orders',
      title: 'Orders',
      titleNe: 'अर्डरहरू',
      icon: ShoppingCart,
      route: '/(tabs)/',
      color: '#1976d2',
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      titleNe: 'ड्यासबोर्ड',
      icon: LayoutDashboard,
      route: '/(tabs)/dashboard',
      color: '#1976d2',
      badge: googleSheets.length > 0 ? googleSheets.length.toString() : undefined,
    },
    {
      id: 'charging',
      title: 'Charging',
      titleNe: 'चार्जिङ',
      icon: Zap,
      route: '/(tabs)/charging',
      color: '#ff9800',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      titleNe: 'खर्चहरू',
      icon: Calculator,
      route: '/(tabs)/expenses',
      color: '#f44336',
    },
    {
      id: 'deposits',
      title: 'Deposits',
      titleNe: 'जम्माहरू',
      icon: DollarSign,
      route: '/(tabs)/deposits',
      color: '#4caf50',
    },
    {
      id: 'insights',
      title: 'Insights',
      titleNe: 'विश्लेषण',
      icon: BarChart3,
      route: '/(tabs)/insights',
      color: '#9c27b0',
    },
    {
      id: 'settings',
      title: 'Settings',
      titleNe: 'सेटिङहरू',
      icon: Settings,
      route: '/(tabs)/settings',
      color: '#607d8b',
    },
  ];

  const handleMenuItemPress = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleVoiceAssistant = () => {
    setShowVoiceAssistant(true);
  };

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/login');
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} />
          
          <Animated.View 
            style={[
              styles.sidebar,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <LinearGradient colors={['#1976d2', '#1565c0']} style={styles.sidebarGradient}>
              <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <User size={24} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userRole}>
                          {activeSheet?.name || 'Energy Palace'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                      <X size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Voice Assistant Button */}
                <TouchableOpacity 
                  style={styles.voiceButton} 
                  onPress={handleVoiceAssistant}
                >
                  <Mic size={24} color="#fff" />
                  <Text style={styles.voiceButtonText}>Voice Assistant</Text>
                  <Text style={styles.voiceButtonSubtext}>आवाज सहायक</Text>
                </TouchableOpacity>

                {/* Menu Items */}
                <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                  {menuItems.map((item) => {
                    const isActive = currentRoute.includes(item.id) || 
                      (item.id === 'orders' && currentRoute === '/(tabs)/');
                    const IconComponent = item.icon;
                    
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, isActive && styles.menuItemActive]}
                        onPress={() => handleMenuItemPress(item.route)}
                      >
                        <View style={styles.menuItemContent}>
                          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                            <IconComponent size={20} color="#fff" />
                          </View>
                          <View style={styles.menuItemText}>
                            <Text style={[styles.menuItemTitle, isActive && styles.menuItemTitleActive]}>
                              {item.title}
                            </Text>
                            <Text style={[styles.menuItemSubtitle, isActive && styles.menuItemSubtitleActive]}>
                              {item.titleNe}
                            </Text>
                          </View>
                          {item.badge && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{item.badge}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#fff" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.footerText}>Energy Palace POS v1.0</Text>
                </View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      <VoiceAssistant 
        visible={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 300,
    height: '100%',
  },
  sidebarGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  voiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  voiceButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  menuItemTitleActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  menuItemSubtitleActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badge: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});