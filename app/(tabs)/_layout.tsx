import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Menu } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import SidebarMenu from '@/components/SidebarMenu';

export default function TabLayout() {
  const { googleSheets } = useApp();
  const [showSidebar, setShowSidebar] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hidden Tab Bar - We'll use sidebar instead */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide the tab bar
        }}>
        
        <Tabs.Screen name="index" />
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="charging" />
        <Tabs.Screen name="expenses" />
        <Tabs.Screen name="deposits" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="settings" />
      </Tabs>

      {/* Floating Menu Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowSidebar(true)}
        >
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sidebar Menu */}
      <SidebarMenu
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentRoute={pathname}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
  },
  floatingButton: {
    backgroundColor: '#1976d2',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});