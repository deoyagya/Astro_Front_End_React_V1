import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';
import {
  REPORT_CATALOG,
  BUNDLE_ORIGINAL,
  BUNDLE_PRICE,
  PLANET_STATUS_COLORS,
  type ReportType,
} from '@/data/reports';

// Bright contrast icon colors
const ICON_COLORS: Record<string, string> = {
  briefcase: '#FFD700',
  heart: '#FF6B8A',
  school: '#43D0FF',
  leaf: '#2ED573',
  sparkles: '#C084FC',
  home: '#FF9F43',
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Best Seller': { bg: '#FFD700', text: '#000' },
  'New': { bg: '#FF6B8A', text: '#FFF' },
};

export default function ReportsScreen() {
  const [sampleReport, setSampleReport] = useState<ReportType | null>(null);

  const addToCartAndGo = async (ids: string[]) => {
    await AsyncStorage.setItem('cart_ids', JSON.stringify(ids));
    router.push('/(auth)/(tabs)/reports/order' as any);
  };

  const orderSingle = (report: ReportType) => addToCartAndGo([report.id]);
  const orderBundle = () => addToCartAndGo(REPORT_CATALOG.map((r) => r.id));

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Life Area Reports</Text>
        <Text style={styles.subtitle}>
          Deep Vedic analysis of every area of your life. Tap "Sample" to preview.
        </Text>

        {/* Single-column Report Cards */}
        {REPORT_CATALOG.map((report) => {
          const iconColor = ICON_COLORS[report.icon] || colors.accent;
          const badgeStyle = BADGE_COLORS[report.badge];

          return (
            <GlassCard key={report.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
                  <Ionicons name={report.icon as any} size={29} color={iconColor} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{report.title}</Text>
                    {!!report.badge && badgeStyle && (
                      <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                          {report.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{report.desc}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="document-text-outline" size={13} color={colors.muted} />
                    <Text style={styles.metaText}>{report.pages} pages</Text>
                    <Text style={styles.price}>{'\u20B9'}{report.price.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.btnRow}>
                <Pressable style={styles.sampleBtn} onPress={() => setSampleReport(report)}>
                  <Ionicons name="eye-outline" size={16} color={colors.accent} />
                  <Text style={styles.sampleBtnText}>Sample</Text>
                </Pressable>
                <Pressable style={styles.orderBtn} onPress={() => orderSingle(report)}>
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                  <Text style={styles.orderBtnText}>Order Now</Text>
                </Pressable>
              </View>
            </GlassCard>
          );
        })}

        {/* Bundle Card */}
        <GlassCard style={styles.bundleCard}>
          <View style={styles.bundleHeader}>
            <Ionicons name="gift" size={28} color="#FFD700" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bundleTitle}>Complete Life Bundle</Text>
              <Text style={styles.bundleDesc}>All 6 reports at 40% off + free chart analysis</Text>
            </View>
          </View>
          <View style={styles.bundlePriceRow}>
            <Text style={styles.bundleOriginal}>{'\u20B9'}{BUNDLE_ORIGINAL.toLocaleString('en-IN')}</Text>
            <Text style={styles.bundlePrice}>{'\u20B9'}{BUNDLE_PRICE.toLocaleString('en-IN')}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>40% OFF</Text>
            </View>
          </View>
          <GradientButton title="Order Complete Bundle" onPress={orderBundle} />
        </GlassCard>

        {/* My Reports Link */}
        <Pressable
          style={styles.myReportsLink}
          onPress={() => router.push('/(auth)/(tabs)/reports/my-reports' as any)}
        >
          <Ionicons name="download-outline" size={18} color={colors.accent2} />
          <Text style={styles.myReportsText}>View My Purchased Reports</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent2} />
        </Pressable>
      </ScrollView>

      {sampleReport && (
        <SampleModal
          report={sampleReport}
          onClose={() => setSampleReport(null)}
          onOrder={(r) => { setSampleReport(null); orderSingle(r); }}
        />
      )}
    </Screen>
  );
}

function SampleModal({ report, onClose, onOrder }: { report: ReportType; onClose: () => void; onOrder: (r: ReportType) => void; }) {
  const iconColor = ICON_COLORS[report.icon] || colors.accent;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={ms.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ms.scroll}>
          <View style={ms.header}>
            <View style={ms.headerLeft}>
              <Ionicons name={report.icon as any} size={24} color={iconColor} />
              <Text style={ms.headerTitle} numberOfLines={2}>{report.title}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close-circle" size={28} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={ms.previewLabel}>SAMPLE PREVIEW</Text>
          {report.warnings && report.warnings.length > 0 && (
            <View style={ms.section}>
              <Text style={ms.sectionTitle}>Critical Areas of Concern</Text>
              {report.warnings.map((w, i) => (
                <View key={i} style={ms.row}>
                  <Ionicons name="warning" size={16} color={colors.warning} />
                  <Text style={[ms.rowText, { color: colors.warning }]}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={ms.section}>
            <Text style={ms.sectionTitle}>Report Highlights</Text>
            {report.highlights.map((h, i) => (
              <View key={i} style={ms.row}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={ms.rowText}>{h}</Text>
              </View>
            ))}
          </View>
          <View style={ms.section}>
            <Text style={ms.sectionTitle}>Key Planetary Analysis</Text>
            {report.planets.map((p, i) => (
              <View key={i} style={ms.planetCard}>
                <View style={ms.planetRow}>
                  <Text style={ms.planetName}>{p.name}</Text>
                  <Text style={[ms.planetStatus, { color: PLANET_STATUS_COLORS[p.status] }]}>{p.status}</Text>
                </View>
                <Text style={ms.planetHouse}>House {p.house}</Text>
                <Text style={ms.planetEffect}>{p.effect}</Text>
              </View>
            ))}
          </View>
          <View style={ms.section}>
            <Text style={ms.sectionTitle}>Included Remedies</Text>
            {report.remedies.map((r, i) => (
              <View key={i} style={ms.row}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accent2} />
                <Text style={ms.rowText}>{r}</Text>
              </View>
            ))}
            <Text style={ms.moreNote}>+ 12 more in full report</Text>
          </View>
          {report.footerNote && <Text style={ms.footer}>{report.footerNote}</Text>}
          <GradientButton title={`Order Full Report \u2014 \u20B9${report.price.toLocaleString('en-IN')}`} onPress={() => onOrder(report)} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 14 },
  title: { ...typography.styles.h3, color: colors.text, paddingTop: 4 },
  subtitle: { ...typography.styles.caption, color: colors.muted },
  card: { gap: 12 },
  cardRow: { flexDirection: 'row', gap: 14 },
  iconCircle: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...typography.styles.label, color: colors.text, fontWeight: '700', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { ...typography.styles.caption, color: colors.muted, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaText: { ...typography.styles.caption, color: colors.muted, fontSize: 12 },
  price: { ...typography.styles.label, color: colors.accent, fontWeight: '700', marginLeft: 'auto' as any },
  btnRow: { flexDirection: 'row', gap: 10 },
  sampleBtn: { flex: 1, flexDirection: 'row', height: 38, borderRadius: 8, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', gap: 6 },
  sampleBtnText: { ...typography.styles.caption, color: colors.accent, fontWeight: '700' },
  orderBtn: { flex: 1, flexDirection: 'row', height: 38, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', gap: 6 },
  orderBtnText: { ...typography.styles.caption, color: '#fff', fontWeight: '700' },
  bundleCard: { gap: 12, marginTop: 4 },
  bundleHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bundleTitle: { ...typography.styles.h3, color: colors.text },
  bundleDesc: { ...typography.styles.bodySmall, color: colors.muted },
  bundlePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bundleOriginal: { ...typography.styles.body, color: colors.muted, textDecorationLine: 'line-through' },
  bundlePrice: { ...typography.styles.h2, color: colors.accent },
  discountBadge: { backgroundColor: '#2ED573', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { fontSize: 12, color: '#fff', fontWeight: '800' },
  myReportsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  myReportsText: { ...typography.styles.body, color: colors.accent2 },
});

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 16, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerTitle: { ...typography.styles.h2, color: colors.text, flex: 1 },
  previewLabel: { ...typography.styles.caption, color: colors.accent, letterSpacing: 1.5 },
  section: { gap: 8 },
  sectionTitle: { ...typography.styles.h3, color: colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowText: { ...typography.styles.bodySmall, color: colors.text, flex: 1 },
  planetCard: { backgroundColor: colors.panelSoft, borderRadius: radius.md, padding: 12, gap: 4 },
  planetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planetName: { ...typography.styles.label, color: colors.text, fontWeight: '600' },
  planetStatus: { ...typography.styles.caption, textTransform: 'capitalize', fontWeight: '600' },
  planetHouse: { ...typography.styles.caption, color: colors.muted },
  planetEffect: { ...typography.styles.bodySmall, color: colors.text },
  moreNote: { ...typography.styles.caption, color: colors.accent, fontStyle: 'italic', marginTop: 4 },
  footer: { ...typography.styles.caption, color: colors.muted, fontStyle: 'italic', textAlign: 'center' },
});
