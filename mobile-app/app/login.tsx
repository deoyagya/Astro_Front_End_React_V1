import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { KeyboardAvoidingWrapper } from '@components/layout/KeyboardAvoidingWrapper';
import { FormInput } from '@components/form/FormInput';
import { OtpInput } from '@components/form/OtpInput';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { useAuth } from '@context/AuthContext';
import { api } from '@api/client';
import { AUTH } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing, radius } from '@theme/spacing';

type Step = 'input' | 'otp';

export default function LoginScreen() {
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('input');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [dialCode, setDialCode] = useState('+91');
  const verifyingRef = useRef(false);

  // Detect geo for dial code
  useEffect(() => {
    api
      .get(AUTH.GEO_DETECT, { noAuth: true })
      .then((data: any) => {
        if (data?.dial_code) setDialCode(data.dial_code);
      })
      .catch(() => {});
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/(auth)/(tabs)');
  }, [isAuthenticated]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const isEmail = identifier.includes('@');
  const isPhone = /^\d{7,15}$/.test(identifier.replace(/\s/g, ''));

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const idValue = isEmail
        ? identifier.trim()
        : `${dialCode}${identifier.replace(/\s/g, '')}`;
      const result = await api.post(AUTH.OTP_SEND, { identifier: idValue }, { noAuth: true });
      if (result.full_name) setFullName(result.full_name);
      setStep('otp');
      setTimer(120);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || otp;
    if (otpCode.length < 6) return;
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    // Prevent double-submit: OTP verify is destructive (deletes the OTP on success).
    // Without this guard, auto-verify (onComplete) + button tap can race.
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const idValue = isEmail
        ? identifier.trim()
        : `${dialCode}${identifier.replace(/\s/g, '')}`;
      const body = {
        identifier: idValue,
        otp_code: otpCode,
        full_name: fullName.trim(),
        marketing_consent: marketingConsent,
      };
      const data = await api.post(AUTH.OTP_VERIFY, body, { noAuth: true, retries: 0 });
      await login(data.access_token);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      verifyingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError('');
    verifyingRef.current = false;
    setLoading(true);
    try {
      const idValue = isEmail
        ? identifier.trim()
        : `${dialCode}${identifier.replace(/\s/g, '')}`;
      const result = await api.post(AUTH.OTP_RESEND, { identifier: idValue }, { noAuth: true });
      if (result.full_name) setFullName(result.full_name);
      setTimer(120);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Screen>
      <KeyboardAvoidingWrapper>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('@assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>
              {step === 'input'
                ? 'Sign in to explore your cosmic blueprint'
                : 'Enter the verification code'}
            </Text>
          </View>

          {error ? (
            <ErrorBanner message={error} onDismiss={() => setError('')} />
          ) : null}

          {step === 'input' ? (
            <View style={styles.form}>
              <FormInput
                label="Email or Phone"
                placeholder=""
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon={
                  <Ionicons
                    name={isEmail ? 'mail-outline' : 'call-outline'}
                    size={18}
                    color={colors.muted}
                  />
                }
              />
              {!isEmail && identifier.length > 0 && (
                <View style={styles.dialCodeRow}>
                  <View style={styles.dialCodeBadge}>
                    <Text style={styles.dialCodeText}>{dialCode}</Text>
                  </View>
                  <Text style={styles.dialCodeHint}>
                    Country code auto-detected
                  </Text>
                </View>
              )}
              <GradientButton
                title="Send Verification Code"
                onPress={handleSendOtp}
                loading={loading}
                disabled={!identifier.trim()}
              />
            </View>
          ) : (
            <View style={styles.form}>
              {/* Back button */}
              <Pressable
                onPress={() => {
                  setStep('input');
                  setError('');
                }}
                style={styles.backBtn}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={colors.accent}
                />
                <Text style={styles.backText}>Change {isEmail ? 'email' : 'phone'}</Text>
              </Pressable>

              <Text style={styles.sentTo}>
                Code sent to{' '}
                <Text style={styles.sentToValue}>
                  {isEmail ? identifier : `${dialCode} ${identifier}`}
                </Text>
              </Text>

              <OtpInput
                onComplete={(code) => {
                  setOtp(code);
                  handleVerifyOtp(code);
                }}
              />

              <FormInput
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                icon={
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.muted}
                  />
                }
              />

              <Pressable
                style={styles.consentRow}
                onPress={() => setMarketingConsent(!marketingConsent)}
              >
                <Switch
                  value={marketingConsent}
                  onValueChange={setMarketingConsent}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.text}
                />
                <Text style={styles.consentText}>
                  Receive updates on Jyotish insights and offers
                </Text>
              </Pressable>

              <GradientButton
                title="Verify & Sign In"
                onPress={() => handleVerifyOtp()}
                loading={loading}
                disabled={otp.length < 6 || !fullName.trim()}
              />

              {/* Timer + Resend */}
              <View style={styles.timerRow}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend in {formatTime(timer)}
                  </Text>
                ) : (
                  <Pressable onPress={handleResend}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingWrapper>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 300,
    height: 200,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.muted,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  dialCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCodeBadge: {
    backgroundColor: 'rgba(123,91,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  dialCodeText: {
    ...typography.styles.label,
    color: colors.accent,
  },
  dialCodeHint: {
    ...typography.styles.caption,
    color: colors.muted,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    ...typography.styles.label,
    color: colors.accent,
  },
  sentTo: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  sentToValue: {
    color: colors.text,
    fontWeight: '600',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  consentText: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    flex: 1,
  },
  timerRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  timerText: {
    ...typography.styles.bodySmall,
    color: colors.muted,
  },
  resendText: {
    ...typography.styles.label,
    color: colors.accent,
  },
});
