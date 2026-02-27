import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { api } from '@api/client';
import { PAYMENT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_COLORS: Record<string, string> = {
  captured: colors.success,
  paid: colors.success,
  created: colors.warning,
  attempted: colors.warning,
  failed: colors.error,
  refunded: colors.accent2,
};

export default function PurchaseHistoryScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(PAYMENT.ORDERS);
      setOrders(Array.isArray(data) ? data : data?.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Purchase History</Text>
        </View>

        {loading && <LoadingSpinner message="Loading orders..." />}
        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!loading && orders.length === 0 && !error && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={64} color={colors.combust} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Purchase History</Text>
            <Text style={styles.emptySubtitle}>
              Your orders will appear here after you purchase a report.
            </Text>
            <GradientButton
              title="Browse Reports"
              onPress={() => router.navigate('/(auth)/(tabs)/reports' as any)}
            />
          </GlassCard>
        )}

        {orders.map((order, idx) => {
          const status = (order.status || 'created').toLowerCase();
          const statusColor = STATUS_COLORS[status] || colors.muted;
          const amount = order.amount ? `₹${(order.amount / 100).toFixed(0)}` : '—';
          const items = order.items || [];

          return (
            <GlassCard key={order.id || idx}>
              <View style={styles.orderHeader}>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderDate}>
                    {order.created_at ? formatDate(order.created_at) : '—'}
                  </Text>
                  <Text style={styles.orderId}>
                    {order.razorpay_order_id || order.receipt || `Order #${idx + 1}`}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>{amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {status}
                    </Text>
                  </View>
                </View>
              </View>

              {items.length > 0 && (
                <View style={styles.itemsList}>
                  {items.map((item: any, iIdx: number) => (
                    <View key={item.id || iIdx} style={styles.itemRow}>
                      <Ionicons name="document-text-outline" size={14} color={colors.muted} />
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.report_name || item.report_type_id || 'Report'}
                      </Text>
                      {item.price != null && (
                        <Text style={styles.itemPrice}>
                          ₹{(item.price / 100).toFixed(0)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          );
        })}

        {!loading && orders.length > 0 && (
          <GradientButton
            title="Refresh"
            variant="secondary"
            onPress={fetchOrders}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    marginBottom: 4,
  },
  title: { ...typography.styles.h2, color: colors.text },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderMeta: { flex: 1, gap: 2 },
  orderDate: { ...typography.styles.label, color: colors.text },
  orderId: { ...typography.styles.caption, color: colors.muted },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { ...typography.styles.h3, color: colors.text },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.styles.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,56,86,0.3)',
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    flex: 1,
  },
  itemPrice: {
    ...typography.styles.caption,
    color: colors.text,
  },
});
