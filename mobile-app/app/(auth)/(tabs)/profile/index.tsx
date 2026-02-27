import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@components/layout/Screen';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { useAuth } from '@context/AuthContext';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

const CHART_STYLES = ['South Indian', 'North Indian'] as const;
type ChartStyle = (typeof CHART_STYLES)[number];

const REPORT_LANGUAGES = [
  { code: 'en', label: 'English (USA)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'or', label: 'Odia' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'as', label: 'Assamese' },
  { code: 'ur', label: 'Urdu' },
  { code: 'sa', label: 'Sanskrit' },
] as const;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [chartStyle, setChartStyle] = useState<ChartStyle>('South Indian');
  const [reportLanguage, setReportLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load persisted preferences
  React.useEffect(() => {
    AsyncStorage.getItem('chart_style').then((v) => {
      if (v === 'North Indian' || v === 'South Indian') setChartStyle(v);
    });
    AsyncStorage.getItem('report_language').then((v) => {
      if (v && REPORT_LANGUAGES.some((l) => l.code === v)) setReportLanguage(v);
    });
  }, []);

  const toggleChartStyle = async () => {
    const next = chartStyle === 'South Indian' ? 'North Indian' : 'South Indian';
    setChartStyle(next);
    await AsyncStorage.setItem('chart_style', next);
    Haptics.selectionAsync();
  };

  const selectLanguage = async (code: string) => {
    setReportLanguage(code);
    setShowLanguagePicker(false);
    await AsyncStorage.setItem('report_language', code);
    Haptics.selectionAsync();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <GlassCard>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.full_name || 'Explorer'}
              </Text>
              <Text style={styles.userContact}>
                {user?.email || user?.phone || ''}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || 'user'}</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <GlassCard onPress={toggleChartStyle}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="grid-outline"
                size={20}
                color={colors.accent2}
              />
              <View>
                <Text style={styles.settingLabel}>Chart Style</Text>
                <Text style={styles.settingValue}>{chartStyle}</Text>
              </View>
            </View>
            <Ionicons
              name="swap-horizontal"
              size={20}
              color={colors.muted}
            />
          </View>
        </GlassCard>

        <GlassCard onPress={() => setShowLanguagePicker(true)}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="language-outline"
                size={20}
                color={colors.accent2}
              />
              <View>
                <Text style={styles.settingLabel}>Report Language</Text>
                <Text style={styles.settingValue}>
                  {REPORT_LANGUAGES.find((l) => l.code === reportLanguage)?.label || 'English (USA)'}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.muted}
            />
          </View>
        </GlassCard>

        <Text style={styles.settingHint}>
          Report language applies to generated PDF reports only, not app screens.
        </Text>

        {/* Language picker modal */}
        <Modal
          visible={showLanguagePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowLanguagePicker(false)}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Report Language</Text>
              <Text style={styles.modalSubtitle}>
                Choose the language for your generated reports
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
              >
                {REPORT_LANGUAGES.map((lang) => {
                  const isSelected = reportLanguage === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      style={[
                        styles.langOption,
                        isSelected && styles.langOptionSelected,
                      ]}
                      onPress={() => selectLanguage(lang.code)}
                    >
                      <Text
                        style={[
                          styles.langLabel,
                          isSelected && styles.langLabelSelected,
                        ]}
                      >
                        {lang.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.success}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <GradientButton
            title="Sign Out"
            onPress={handleLogout}
            loading={loggingOut}
            variant="secondary"
          />
        </View>

        {/* App version */}
        <Text style={styles.version}>Astro Yagya v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
    gap: 16,
  },
  title: {
    ...typography.styles.h1,
    color: colors.text,
    paddingTop: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(123,91,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    ...typography.styles.h3,
    color: colors.text,
  },
  userContact: {
    ...typography.styles.bodySmall,
    color: colors.muted,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(67,208,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: 2,
  },
  roleText: {
    ...typography.styles.caption,
    color: colors.accent2,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    ...typography.styles.label,
    color: colors.text,
  },
  settingValue: {
    ...typography.styles.caption,
    color: colors.muted,
  },
  settingHint: {
    ...typography.styles.caption,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: -8,
  },

  // Language picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...typography.styles.h3,
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.styles.caption,
    color: colors.muted,
    marginBottom: 16,
  },
  modalScroll: {
    flexGrow: 0,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(42,56,86,0.3)',
  },
  langOptionSelected: {
    backgroundColor: 'rgba(67,217,131,0.08)',
  },
  langLabel: {
    ...typography.styles.body,
    color: colors.text,
  },
  langLabelSelected: {
    color: colors.success,
    fontWeight: '600',
  },

  logoutSection: {
    marginTop: 24,
  },
  version: {
    ...typography.styles.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
  },
});
