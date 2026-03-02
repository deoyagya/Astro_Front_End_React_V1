import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

const AnimatedView = Animated.View;

export function LoadingSpinner({
  message,
  size = 'large',
}: LoadingSpinnerProps) {
  const { width, height } = useWindowDimensions();
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Container = 1/3 of the smaller dimension
  const containerSize = Math.min(width, height) / 3;
  const ringRadius = containerSize / 2 - 4;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * ringRadius;
  // OM symbol font size proportional to container
  const omFontSize = containerSize * 0.38;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinAnim]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.omContainer, { width: containerSize, height: containerSize }]}>
        {/* OM Symbol — steady in center */}
        <Text style={[styles.omSymbol, { fontSize: omFontSize, lineHeight: containerSize }]}>
          ॐ
        </Text>

        {/* Rotating ring around it */}
        <AnimatedView
          style={[
            styles.ringWrapper,
            {
              width: containerSize,
              height: containerSize,
              transform: [{ rotate: spinInterpolation }],
            },
          ]}
        >
          <Svg width={containerSize} height={containerSize}>
            {/* Background ring — faint */}
            <Circle
              cx={containerSize / 2}
              cy={containerSize / 2}
              r={ringRadius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated arc — partial white ring */}
            <Circle
              cx={containerSize / 2}
              cy={containerSize / 2}
              r={ringRadius}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
              strokeLinecap="round"
            />
          </Svg>
        </AnimatedView>
      </View>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  omContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  omSymbol: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '300',
    textAlign: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  ringWrapper: {
    position: 'absolute',
  },
  message: {
    ...typography.styles.bodySmall,
    color: colors.muted,
  },
});
