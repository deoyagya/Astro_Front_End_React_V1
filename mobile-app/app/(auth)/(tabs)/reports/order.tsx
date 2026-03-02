import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { api } from '@api/client';
import { PAYMENT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface ReportPrice {
  id: string;
  name: string;
  icon?: string;
  price_paisa: number;
  price_display: string;
}

interface ValidatedCart {
  items: ReportPrice[];
  total_paisa: number;
  total_display: string;
}

export default function OrderScreen() {
  const [reports, setReports] = useState<ReportPrice[]>([]);
  const [fetchingPrices, setFetchingPrices] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [validatedCart, setValidatedCart] = useState<ValidatedCart | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load prices + pre-select from cart
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(PAYMENT.REPORT_PRICES);
        const list = data.reports || data || [];
        setReports(list);

        // Pre-select from cart
        const stored = await AsyncStorage.getItem('cart_ids');
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          const valid = ids.filter((id: string) => list.some((r: ReportPrice) => r.id === id));
          setSelectedIds(valid);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load prices');
      } finally {
        setFetchingPrices(false);
      }
    })();
  }, []);

  // Debounced cart validation
  useEffect(() => {
    if (selectedIds.length === 0) {
      setValidatedCart(null);
      return;
    }
    setValidating(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.post(PAYMENT.VALIDATE_CART, { item_ids: selectedIds });
        setValidatedCart(data);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Validation failed');
      } finally {
        setValidating(false);
      }
    }, 300);
  }, [selectedIds]);

  const toggleReport = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePlaceOrder = async () => {
    if (!validatedCart || selectedIds.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const receipt = `vedic_order_${Date.now()}`;
      const orderData = await api.post(PAYMENT.CREATE_ORDER, {
        amount: validatedCart.total_paisa,
        currency: 'INR',
        items: validatedCart.items.map((i) => ({ id: i.id, name: i.name })),
        receipt,
      });
      // Store order data for payment screen
      await AsyncStorage.setItem('razorpay_order', JSON.stringify(orderData));
      await AsyncStorage.setItem('cart', JSON.stringify(validatedCart.items));
      router.push('/(auth)/(tabs)/reports/payment' as any);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPrices) {
    return (
      <Screen>
        <LoadingSpinner message="Loading report prices..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Select Your Reports</Text>
        <Text style={styles.subtitle}>
          Choose the life areas you want analyzed. Prices verified by server.
        </Text>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Report checkboxes */}
        {reports.map((report) => {
          const selected = selectedIds.includes(report.id);
          return (
            <Pressable key={report.id} onPress={() => toggleReport(report.id)}>
              <GlassCard style={styles.reportRow} noHaptic>
                <View style={styles.checkbox}>
                  {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName}>{report.name}</Text>
                  <Text style={styles.reportPrice}>{report.price_display}</Text>
                </View>
              </GlassCard>
            </Pressable>
          );
        })}

        {/* Order Summary */}
        {selectedIds.length > 0 && (
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {validatedCart?.items.map((item) => (
              <View key={item.id} style={styles.summaryRow}>
                <Text style={styles.summaryItem} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.summaryPrice}>{item.price_display}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>
                {validatedCart?.total_display || '...'}
              </Text>
            </View>

            {validatedCart && !validating && (
              <View style={styles.verifiedRow}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <Text style={styles.verifiedText}>Prices verified by server</Text>
              </View>
            )}

            {validating && (
              <Text style={styles.validatingText}>Validating prices...</Text>
            )}
          </GlassCard>
        )}

        <GradientButton
          title={loading ? 'Creating Order...' : 'Place Order'}
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={!validatedCart || validating || selectedIds.length === 0}
        />

        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.muted} />
          <Text style={styles.backText}>Back to Reports</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  title: { ...typography.styles.h3, color: colors.text, paddingTop: 8 },
  subtitle: { ...typography.styles.caption, color: colors.muted, marginBottom: 4 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(123,91,255,0.15)',
  },
  reportInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportName: { ...typography.styles.body, color: colors.text, flex: 1 },
  reportPrice: { ...typography.styles.label, color: colors.accent, fontWeight: '600' },
  summaryCard: { gap: 10, marginTop: 8 },
  summaryTitle: { ...typography.styles.h3, color: colors.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { ...typography.styles.bodySmall, color: colors.text, flex: 1, marginRight: 12 },
  summaryPrice: { ...typography.styles.bodySmall, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  totalPrice: { ...typography.styles.h3, color: colors.accent },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: { ...typography.styles.caption, color: colors.success },
  validatingText: { ...typography.styles.caption, color: colors.muted, fontStyle: 'italic' },
  backLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14,
  },
  backText: { ...typography.styles.body, color: colors.muted },
});
