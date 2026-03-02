import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { FormInput } from '@components/form/FormInput';
import { DatePicker } from '@components/form/DatePicker';
import { TimePicker } from '@components/form/TimePicker';
import { PlaceAutocomplete } from '@components/form/PlaceAutocomplete';
import { GenderSelector } from '@components/form/GenderSelector';
import type { Gender } from '@components/form/GenderSelector';
import { useBirthData, BIRTH_DATA_ENTERED_KEY } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

/**
 * Dedicated "Create New Chart" screen — always starts with a blank form.
 * Lives inside the tools/ Stack, so router.push() creates a fresh instance
 * every time (no stale state from previous visits).
 */
export default function NewChartScreen() {
  // Only use saveBirthData — no loading (skipAutoLoad keeps form blank)
  const { saveBirthData } = useBirthData({ reportType: 'full', skipAutoLoad: true });

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [dob, setDob] = useState(new Date(1990, 0, 1));
  const [tob, setTob] = useState(new Date(1990, 0, 1, 6, 0));
  const [place, setPlace] = useState<any>(null);
  const [placeText, setPlaceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter the name'); return; }
    if (!gender) { setError('Please select gender'); return; }
    if (!place) { setError('Please select birth place'); return; }
    setError('');
    setSaving(true);
    // Clear any active chart context — this is a brand new chart
    activeChartStore.clear();

    try {
      const dobStr = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      const tobStr = `${String(tob.getHours()).padStart(2, '0')}:${String(tob.getMinutes()).padStart(2, '0')}`;

      saveBirthData({
        name: name.trim(),
        dob: dobStr,
        tob: tobStr,
        gender: gender!,
        place_of_birth: placeText,
        lat: place.lat,
        lon: place.lon,
      });

      // Mark birth data as entered
      await AsyncStorage.setItem(BIRTH_DATA_ENTERED_KEY, 'true');
      // Clear chart cache so fresh chart is generated
      await AsyncStorage.removeItem('cached_chart_response').catch(() => {});
      // Signal birth-chart to clear stale display on next focus
      await AsyncStorage.setItem('chart_needs_refresh', 'true').catch(() => {});

      // Navigate to birth-chart to show the new chart
      router.navigate('/(auth)/(tabs)/tools/birth-chart' as any);
    } catch (err: any) {
      setError(err.message || 'Failed to save chart');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>New Chart</Text>
        </View>
        <Text style={styles.subtitle}>
          Enter birth details for a new chart.
        </Text>

        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        <GlassCard>
          <View style={styles.form}>
            <FormInput
              label="Full Name"
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <GenderSelector value={gender} onChange={setGender} />
            <DatePicker label="Date of Birth" value={dob} onChange={setDob} />
            <TimePicker label="Time of Birth" value={tob} onChange={setTob} />
            <PlaceAutocomplete
              label="Birth Place"
              value={placeText}
              onSelect={(p) => {
                setPlace(p);
                setPlaceText(p.name);
              }}
            />
          </View>
        </GlassCard>

        <GradientButton
          title="Save & View Chart"
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim() || !gender || !place}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    marginBottom: 4,
  },
  title: {
    ...typography.styles.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.muted,
  },
  form: {
    gap: 14,
  },
});
