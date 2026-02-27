import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const MENU_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(auth)/(tabs)' },
  { label: 'Birth Chart', icon: 'planet-outline', route: '/(auth)/(tabs)/tools/birth-chart' },
  { label: 'Dasha Timeline', icon: 'time-outline', route: '/(auth)/(tabs)/tools/dasha' },
  { label: 'Compatibility', icon: 'heart-outline', route: '/(auth)/(tabs)/tools/compatibility' },
  { label: 'Horoscope', icon: 'telescope-outline', route: '/(auth)/(tabs)/tools/horoscope' },
  { label: 'Reports', icon: 'document-text-outline', route: '/(auth)/(tabs)/reports' },
  { label: 'My Reports', icon: 'download-outline', route: '/(auth)/(tabs)/reports/my-reports' },
  { label: 'My Data', icon: 'folder-outline', route: '/(auth)/(tabs)/my-data' },
  { label: 'Profile', icon: 'person-outline', route: '/(auth)/(tabs)/profile' },
];

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();

  const navigateTo = (route: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      router.navigate(route as any);
    }, 150);
  };

  return (
    <>
      <View style={styles.header}>
        {/* Hamburger */}
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>

        {/* Logo + Title */}
        <View style={styles.logoArea}>
          <Image source={require('@assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.appTitle}>Astro Yagya</Text>
        </View>

        {/* Spacer for balance */}
        <View style={styles.iconBtn} />
      </View>

      {/* Slide-in Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <SafeAreaView style={styles.menuPanel}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Menu header */}
              <View style={styles.menuHeader}>
                <Image source={require('@assets/logo.png')} style={styles.menuLogoImg} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuAppName}>Astro Yagya</Text>
                </View>
                <Pressable onPress={() => setMenuOpen(false)} style={styles.closeBtn} hitSlop={10}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </Pressable>
              </View>

              {/* Menu Items */}
              <View style={styles.menuList}>
                {MENU_ITEMS.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => navigateTo(item.route)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}
                  >
                    <Ionicons name={item.icon as any} size={20} color={colors.accent} />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Logout */}
              <Pressable
                onPress={() => { setMenuOpen(false); logout(); }}
                style={styles.logoutBtn}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </Pressable>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  appTitle: {
    ...typography.styles.h3,
    color: colors.text,
    fontWeight: '700',
  },

  // Menu overlay
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuPanel: {
    width: '78%',
    backgroundColor: colors.panel,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  menuAppName: {
    ...typography.styles.h3,
    color: colors.text,
    fontWeight: '700',
  },
  menuUserName: {
    ...typography.styles.caption,
    color: colors.muted,
  },
  closeBtn: {
    marginLeft: 'auto',
  },
  menuList: {
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(123,91,255,0.08)',
  },
  menuLabel: {
    ...typography.styles.body,
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {
    ...typography.styles.body,
    color: colors.error,
  },
});
