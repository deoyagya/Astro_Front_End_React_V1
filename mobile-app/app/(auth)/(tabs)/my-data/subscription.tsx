import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useAuth } from '@context/AuthContext';
import { api } from '@api/client';
import { SUBSCRIPTION } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface Plan {
  slug: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_current?: boolean;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  feature_key: string;
}

interface CreditBalance {
  feature_key: string;
  balance: number;
  expires_at?: string;
}

interface CurrentSub {
  plan_slug: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  period_end?: string;
  features_json?: Record<string, any>;
}

const PLAN_COLORS: Record<string, string> = {
  free: colors.muted,
  basic: colors.accent2,
  premium: colors.accent,
  elite: colors.warning,
};

const PLAN_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  free: 'leaf-outline',
  basic: 'star-outline',
  premium: 'diamond-outline',
  elite: 'trophy-outline',
};

export default function SubscriptionScreen() {
  const { user, refreshUser } = useAuth();

  const [currentSub, setCurrentSub] = useState<CurrentSub | null>(null);
  const [creditBalances, setCreditBalances] = useState<CreditBalance[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Plan picker modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, balRes, planRes, packRes] = await Promise.all([
        api.get(SUBSCRIPTION.CURRENT).catch(() => null),
        api.get(SUBSCRIPTION.CREDIT_BALANCE).catch(() => ({ balances: [] })),
        api.get(SUBSCRIPTION.PLANS, { noAuth: true }).catch(() => ({ plans: [] })),
        api.get(SUBSCRIPTION.CREDIT_PACKS, { noAuth: true }).catch(() => ({ packs: [] })),
      ]);
      setCurrentSub(subRes);
      setCreditBalances(balRes?.balances || []);
      setPlans(planRes?.plans || []);
      setCreditPacks(packRes?.packs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post(SUBSCRIPTION.VALIDATE_COUPON, { coupon_code: couponCode.trim() });
      setCouponDiscount(res.discount_display || `${res.discount_percent}% off`);
    } catch (err: any) {
      setCouponDiscount(null);
      Alert.alert('Invalid Coupon', err.message || 'Coupon code is not valid.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setCheckingOut(true);
    try {
      const res = await api.post(SUBSCRIPTION.CHECKOUT, {
        plan_slug: selectedPlan.slug,
        billing_cycle: billingCycle,
        coupon_code: couponCode.trim() || undefined,
      });

      // For now, show order details. Razorpay SDK integration requires native setup.
      Alert.alert(
        'Payment Required',
        `Plan: ${res.plan_name || selectedPlan.name}\nAmount: ₹${(res.final_amount_paisa || 0) / 100}\n\nRazorpay payment flow will open on device. Use the web app for testing.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Success',
            onPress: async () => {
              // In production: RazorpayCheckout.open(options).then(verify)
              setShowPlanModal(false);
              await refreshUser();
              loadData();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Could not create order.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your subscription will remain active until the end of the current billing period. Are you sure?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(SUBSCRIPTION.CANCEL, { reason: 'User requested cancellation', immediate: false });
              Alert.alert('Cancelled', 'Your subscription will end at the current period.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  const handlePurchaseCredits = async (pack: CreditPack) => {
    try {
      const res = await api.post(SUBSCRIPTION.PURCHASE_CREDITS, { pack_id: pack.id });
      Alert.alert(
        'Purchase Credits',
        `${pack.name} — ₹${pack.price}\n\nRazorpay payment flow will open on device.`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to purchase credits.');
    }
  };

  const planColor = PLAN_COLORS[currentSub?.plan_slug || 'free'] || colors.muted;

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Subscription</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading subscription..." />}

        {!loading && (
          <>
            {/* Current Plan */}
            <GlassCard style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={[styles.planIconCircle, { backgroundColor: `${planColor}15` }]}>
                  <Ionicons
                    name={PLAN_ICONS[currentSub?.plan_slug || 'free'] || 'leaf-outline'}
                    size={28}
                    color={planColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{currentSub?.plan_name || 'Free Plan'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: currentSub?.status === 'active' ? `${colors.success}20` : `${colors.warning}20` }]}>
                    <Text style={[styles.statusText, { color: currentSub?.status === 'active' ? colors.success : colors.warning }]}>
                      {currentSub?.status || 'active'}
                    </Text>
                  </View>
                </View>
              </View>

              {currentSub?.billing_cycle && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Billing</Text>
                  <Text style={styles.detailValue}>{currentSub.billing_cycle}</Text>
                </View>
              )}
              {currentSub?.period_end && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Renews</Text>
                  <Text style={styles.detailValue}>{new Date(currentSub.period_end).toLocaleDateString()}</Text>
                </View>
              )}

              {currentSub?.features_json && (
                <View style={styles.featuresList}>
                  {Object.entries(currentSub.features_json).map(([key, val]) => (
                    <View key={key} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.featureText}>{key}: {String(val)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>

            {/* Credit Balance */}
            {creditBalances.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>Credit Balance</Text>
                {creditBalances.map((bal) => (
                  <View key={bal.feature_key} style={styles.creditRow}>
                    <Ionicons name="flash" size={16} color={colors.accent2} />
                    <Text style={styles.creditKey}>{bal.feature_key}</Text>
                    <Text style={styles.creditVal}>{bal.balance}</Text>
                    {bal.expires_at && (
                      <Text style={styles.creditExpiry}>
                        exp {new Date(bal.expires_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Credit Packs */}
            {creditPacks.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Credit Packs</Text>
                <FlatList
                  data={creditPacks}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(p) => p.id}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <GlassCard
                      onPress={() => handlePurchaseCredits(item)}
                      style={styles.packCard}
                    >
                      <Text style={styles.packName}>{item.name}</Text>
                      <Text style={styles.packCredits}>{item.credits} credits</Text>
                      <Text style={styles.packPrice}>₹{item.price}</Text>
                    </GlassCard>
                  )}
                />
              </View>
            )}

            {/* Actions */}
            <GradientButton
              title="Change Plan"
              onPress={() => setShowPlanModal(true)}
              style={styles.actionBtn}
            />

            {currentSub?.plan_slug && currentSub.plan_slug !== 'free' && (
              <GradientButton
                title="Cancel Subscription"
                variant="secondary"
                onPress={handleCancel}
                style={styles.actionBtn}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Plan Picker Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Plan</Text>
              <Pressable onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Billing toggle */}
            <View style={styles.billingToggle}>
              <Pressable
                style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleActive]}
                onPress={() => setBillingCycle('monthly')}
              >
                <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleActive]}
                onPress={() => setBillingCycle('yearly')}
              >
                <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {plans.map((plan) => {
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                const isSelected = selectedPlan?.slug === plan.slug;
                const planClr = PLAN_COLORS[plan.slug] || colors.accent;
                return (
                  <Pressable
                    key={plan.slug}
                    onPress={() => setSelectedPlan(plan)}
                    style={[styles.planOption, isSelected && { borderColor: planClr }]}
                  >
                    <View style={styles.planOptionHeader}>
                      <Ionicons name={PLAN_ICONS[plan.slug] || 'star-outline'} size={20} color={planClr} />
                      <Text style={styles.planOptionName}>{plan.name}</Text>
                      <Text style={styles.planOptionPrice}>
                        {price > 0 ? `₹${price}/${billingCycle === 'monthly' ? 'mo' : 'yr'}` : 'Free'}
                      </Text>
                    </View>
                    {plan.features?.map((f, i) => (
                      <View key={i} style={styles.planFeatureRow}>
                        <Ionicons name="checkmark" size={14} color={colors.success} />
                        <Text style={styles.planFeatureText}>{f}</Text>
                      </View>
                    ))}
                  </Pressable>
                );
              })}

              {/* Coupon */}
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Coupon code"
                  placeholderTextColor={colors.muted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <Pressable style={styles.couponBtn} onPress={handleValidateCoupon} disabled={validatingCoupon}>
                  {validatingCoupon ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Text style={styles.couponBtnText}>Apply</Text>
                  )}
                </Pressable>
              </View>
              {couponDiscount && (
                <Text style={styles.couponSuccess}>{couponDiscount}</Text>
              )}
            </ScrollView>

            <GradientButton
              title={checkingOut ? 'Processing...' : 'Subscribe'}
              onPress={handleCheckout}
              loading={checkingOut}
              disabled={!selectedPlan || selectedPlan.slug === 'free'}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  planCard: { gap: 12 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { ...typography.styles.h3, color: colors.text },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: { ...typography.styles.caption, fontWeight: '600', textTransform: 'capitalize' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { ...typography.styles.bodySmall, color: colors.muted },
  detailValue: { ...typography.styles.bodySmall, color: colors.text, fontWeight: '600' },
  featuresList: { gap: 6, marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { ...typography.styles.caption, color: colors.muted },
  sectionTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  creditKey: { ...typography.styles.bodySmall, color: colors.text, flex: 1 },
  creditVal: { ...typography.styles.body, color: colors.accent2, fontWeight: '700' },
  creditExpiry: { ...typography.styles.caption, color: colors.muted },
  packCard: { width: 140, alignItems: 'center', gap: 6 },
  packName: { ...typography.styles.label, color: colors.text },
  packCredits: { ...typography.styles.caption, color: colors.accent2 },
  packPrice: { ...typography.styles.body, color: colors.success, fontWeight: '700' },
  actionBtn: { marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { ...typography.styles.h3, color: colors.text },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: colors.accent,
  },
  toggleText: { ...typography.styles.label, color: colors.muted },
  toggleTextActive: { color: colors.text },
  planOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  planOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planOptionName: { ...typography.styles.body, color: colors.text, fontWeight: '600', flex: 1 },
  planOptionPrice: { ...typography.styles.body, color: colors.success, fontWeight: '700' },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 28 },
  planFeatureText: { ...typography.styles.caption, color: colors.muted },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.styles.bodySmall,
  },
  couponBtn: {
    backgroundColor: `${colors.accent}20`,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  couponBtnText: { ...typography.styles.label, color: colors.accent },
  couponSuccess: { ...typography.styles.caption, color: colors.success, marginTop: 4 },
});
