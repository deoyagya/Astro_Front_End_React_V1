import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { useAuth } from '@context/AuthContext';
import { api } from '@api/client';
import { PAYMENT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface OrderData {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
}

interface CartItem {
  id: string;
  name: string;
  price_display?: string;
  price_paisa?: number;
}

export default function PaymentScreen() {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const orderStr = await AsyncStorage.getItem('razorpay_order');
        const cartStr = await AsyncStorage.getItem('cart');
        if (!orderStr) {
          router.replace('/(auth)/(tabs)/reports/order' as any);
          return;
        }
        setOrder(JSON.parse(orderStr));
        setCart(cartStr ? JSON.parse(cartStr) : []);
      } catch {
        router.replace('/(auth)/(tabs)/reports/order' as any);
      }
    })();
  }, []);

  const handlePay = async () => {
    if (!order) return;
    setStatus('processing');
    setError('');

    try {
      // On React Native, we would use react-native-razorpay SDK.
      // For now, we open the Razorpay checkout in the browser as a fallback.
      // In production, install: npm install react-native-razorpay
      // and use: RazorpayCheckout.open(options)

      // Attempt to use the Razorpay native module if available
      let RazorpayCheckout: any;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch {
        // Module not installed — show alert with instructions
        Alert.alert(
          'Razorpay SDK Not Installed',
          'To enable payments, install react-native-razorpay:\n\nnpm install react-native-razorpay\n\nThen rebuild the app.',
          [
            { text: 'OK', onPress: () => setStatus('idle') },
          ]
        );
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.order_id,
        name: 'Astro Yagya',
        description: cart.map((c) => c.name).join(', '),
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#7b5bff' },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment on backend
      const verifyResult = await api.post(PAYMENT.VERIFY, {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      // Success
      setStatus('success');
      await AsyncStorage.removeItem('razorpay_order');
      await AsyncStorage.removeItem('cart');
      await AsyncStorage.removeItem('cart_ids');

      // Auto-navigate to My Reports after 2.5s
      setTimeout(() => {
        router.replace('/(auth)/(tabs)/reports/my-reports' as any);
      }, 2500);
    } catch (err: any) {
      setStatus('failed');
      setError(err.message || err.description || 'Payment failed');
    }
  };

  if (!order) {
    return (
      <Screen>
        <LoadingSpinner message="Loading order..." />
      </Screen>
    );
  }

  const totalDisplay = `\u20B9${(order.amount / 100).toLocaleString('en-IN')}`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complete Payment</Text>
        <Text style={styles.subtitle}>Secure checkout powered by Razorpay</Text>

        {/* Order recap */}
        <GlassCard style={styles.recapCard}>
          {cart.map((item) => (
            <View key={item.id} style={styles.recapRow}>
              <Ionicons name="document-text" size={16} color={colors.accent} />
              <Text style={styles.recapName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recapPrice}>{item.price_display || ''}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.recapRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{totalDisplay}</Text>
          </View>
          <Text style={styles.receipt}>Receipt: vedic_order_{Date.now()}</Text>
        </GlassCard>

        {/* Status Messages */}
        {status === 'success' && (
          <GlassCard style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successText}>
              Your reports are being generated. Redirecting to My Reports...
            </Text>
          </GlassCard>
        )}

        {status === 'failed' && (
          <ErrorBanner
            message={error || 'Payment failed. Please try again.'}
            onDismiss={() => { setError(''); setStatus('idle'); }}
          />
        )}

        {/* Action Buttons */}
        {status !== 'success' && (
          <>
            <GradientButton
              title={status === 'processing' ? 'Processing...' : `Pay ${totalDisplay}`}
              onPress={handlePay}
              loading={status === 'processing'}
              disabled={status === 'processing'}
            />

            <GradientButton
              title="Back to Cart"
              variant="secondary"
              onPress={() => router.back()}
              disabled={status === 'processing'}
            />
          </>
        )}

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={16} color={colors.muted} />
          <View>
            <Text style={styles.securityTitle}>Secured by Razorpay</Text>
            <Text style={styles.securityText}>PCI DSS Level 1 Compliant</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 16 },
  title: { ...typography.styles.h2, color: colors.text, paddingTop: 12 },
  subtitle: { ...typography.styles.bodySmall, color: colors.muted },
  recapCard: { gap: 10 },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recapName: { ...typography.styles.body, color: colors.text, flex: 1 },
  recapPrice: { ...typography.styles.bodySmall, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { ...typography.styles.body, color: colors.text, fontWeight: '600', flex: 1 },
  totalPrice: { ...typography.styles.h2, color: colors.accent },
  receipt: { ...typography.styles.caption, color: colors.border, marginTop: 4 },
  successCard: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  successTitle: { ...typography.styles.h3, color: colors.success },
  successText: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center' },
  securityBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16,
  },
  securityTitle: { ...typography.styles.caption, color: colors.muted, fontWeight: '600' },
  securityText: { ...typography.styles.caption, color: colors.border },
});
