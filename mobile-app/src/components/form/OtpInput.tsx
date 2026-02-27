import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Clipboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Handle paste of full code
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, length).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < length) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + pasted.length, length - 1);
      refs.current[nextFocus]?.focus();
      if (newDigits.every((d) => d !== '')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(newDigits.join(''));
      }
      return;
    }

    const digit = text.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(newDigits.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[
            styles.box,
            focusedIndex === i && styles.boxFocused,
            !!digit && styles.boxFilled,
          ]}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => setFocusedIndex(i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? length : 1}
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          selectionColor={colors.accent}
          caretHidden
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    textAlign: 'center',
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text,
  },
  boxFocused: {
    borderColor: colors.accent,
  },
  boxFilled: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(123,91,255,0.08)',
  },
});
