import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: '',
    items: [
      { label: 'Home', icon: 'home-outline', route: '/' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Birth Chart', icon: 'planet-outline', route: '/tools/birth-chart' },
      { label: 'Dasha Timeline', icon: 'time-outline', route: '/tools/dasha' },
      { label: 'Compatibility', icon: 'heart-outline', route: '/tools/compatibility' },
      { label: 'Horoscope', icon: 'telescope-outline', route: '/tools/horoscope' },
    ],
  },
  {
    title: 'MY DATA',
    items: [
      { label: 'My Details', icon: 'person-outline', route: '/my-data/my-details' },
      { label: 'Avkahada Chakra', icon: 'star-outline', route: '/my-data/avkahada-chakra' },
      { label: 'My Personality', icon: 'happy-outline', route: '/my-data/my-personality' },
      { label: 'Yogas & Rajyogas', icon: 'trophy-outline', route: '/my-data/yogas' },
      { label: 'Sade Sati', icon: 'planet-outline', route: '/my-data/sade-sati' },
      { label: 'Transit', icon: 'navigate-outline', route: '/my-data/transit' },
      { label: 'Saved Charts', icon: 'albums-outline', route: '/my-data/saved-charts' },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { label: 'Life Area Reports', icon: 'document-text-outline', route: '/reports' },
      { label: 'My Reports', icon: 'download-outline', route: '/reports/my-reports' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'Profile', icon: 'person-circle-outline', route: '/profile' },
    ],
  },
];

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const pathname = usePathname();

  const navigateTo = (route: string) => {
    setMenuOpen(false);
    // Use requestAnimationFrame to let the modal close before navigating
    requestAnimationFrame(() => {
      router.navigate(route as any);
    });
  };

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(route);
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
        <View style={styles.menuOverlay}>
          {/* Tap outside to close */}
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />

          <SafeAreaView style={styles.menuPanel}>
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

            {/* Menu Items — Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
              {MENU_SECTIONS.map((section, sIdx) => (
                <View key={section.title || `s${sIdx}`}>
                  {section.title ? (
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  ) : sIdx > 0 ? (
                    <View style={styles.divider} />
                  ) : null}

                  {section.items.map((item) => {
                    const active = isActive(item.route);
                    return (
                      <Pressable
                        key={item.label}
                        onPress={() => navigateTo(item.route)}
                        style={({ pressed }) => [
                          styles.menuItem,
                          active && styles.menuItemActive,
                          pressed && styles.menuItemPressed,
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={active ? colors.accent : colors.muted}
                        />
                        <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                          {item.label}
                        </Text>
                        {active && <View style={styles.activeIndicator} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Logout */}
            <Pressable
              onPress={() => { setMenuOpen(false); logout(); }}
              style={styles.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          </SafeAreaView>
        </View>
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
    flexDirection: 'row',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLogoImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  menuAppName: {
    ...typography.styles.h3,
    color: colors.text,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 'auto',
  },
  menuScroll: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.styles.caption,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(123,91,255,0.08)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(123,91,255,0.15)',
  },
  menuLabel: {
    ...typography.styles.bodySmall,
    color: colors.text,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {
    ...typography.styles.bodySmall,
    color: colors.error,
  },
});
