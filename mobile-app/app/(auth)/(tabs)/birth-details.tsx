import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Screen } from '@components/layout/Screen';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { FormInput } from '@components/form/FormInput';
import { DatePicker } from '@components/form/DatePicker';
import { TimePicker } from '@components/form/TimePicker';
import { PlaceAutocomplete } from '@components/form/PlaceAutocomplete';
import { GenderSelector } from '@components/form/GenderSelector';
import type { Gender } from '@components/form/GenderSelector';
import { useAuth } from '@context/AuthContext';
import {
  useBirthData,
  parseDateString,
  parseTimeString,
  BIRTH_DATA_ENTERED_KEY,
} from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function BirthDetailsScreen() {
  const { user } = useAuth();
  const { loaded, savedData, saveBirthData } = useBirthData({
    reportType: 'full',
  });

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [dob, setDob] = useState(new Date(1990, 0, 1));
  const [tob, setTob] = useState(new Date(1990, 0, 1, 6, 0));
  const [place, setPlace] = useState<any>(null);
  const [placeText, setPlaceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingChartId, setEditingChartId] = useState<string | null>(null);

  // Pre-fill from active chart store (editing saved chart) or saved data (editing own)
  useEffect(() => {
    if (!loaded) return;

    // Check if we're editing a specific saved chart
    const activeData = activeChartStore.getBirthData();
    const activeId = activeChartStore.getChartId();

    if (activeData && activeId) {
      // Editing a saved chart — pre-fill from active chart store
      setEditingChartId(activeId);
      if (activeData.name) setName(activeData.name);
      if (activeData.gender) setGender(activeData.gender as Gender);
      if (activeData.dob) setDob(parseDateString(activeData.dob));
      if (activeData.tob) setTob(parseTimeString(activeData.tob));
      if (activeData.place_of_birth && activeData.lat != null && activeData.lon != null) {
        setPlace({ name: activeData.place_of_birth, lat: activeData.lat, lon: activeData.lon });
        setPlaceText(activeData.place_of_birth);
      }
    } else if (savedData) {
      // Editing user's own birth data
      setEditingChartId(null);
      if (savedData.name) setName(savedData.name);
      if (savedData.gender) setGender(savedData.gender);
      if (savedData.dob) setDob(parseDateString(savedData.dob));
      if (savedData.tob) setTob(parseTimeString(savedData.tob));
      if (savedData.place_of_birth && savedData.lat != null && savedData.lon != null) {
        setPlace({ name: savedData.place_of_birth, lat: savedData.lat, lon: savedData.lon });
        setPlaceText(savedData.place_of_birth);
      }
    } else if (user?.full_name) {
      setName(user.full_name);
    }
  }, [loaded, savedData, user?.full_name]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!gender) { setError('Please select your gender'); return; }
    if (!place) { setError('Please select your birth place'); return; }
    if (place.lat == null || place.lon == null) { setError('Birth place must have valid coordinates. Please select from the suggestions.'); return; }

    // DOB validation
    const now = new Date();
    if (dob > now) { setError('Date of birth cannot be in the future'); return; }
    if (dob.getFullYear() < 1900) { setError('Please enter a valid date of birth (after 1900)'); return; }

    setError('');
    setSaving(true);

    try {
      const dobStr = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      const tobStr = `${String(tob.getHours()).padStart(2, '0')}:${String(tob.getMinutes()).padStart(2, '0')}`;

      const birthData = {
        name: name.trim(),
        dob: dobStr,
        tob: tobStr,
        gender: gender!,
        place_of_birth: placeText,
        lat: place.lat,
        lon: place.lon,
      };

      if (editingChartId) {
        // UPDATE existing saved chart via PUT
        await api.put(CHART.UPDATE(editingChartId), {
          report_type: 'full',
          input_data: birthData,
        });
        // Update the activeChartStore so birth-chart shows correct data
        activeChartStore.set(editingChartId, birthData);
      } else {
        // Save user's own birth data (original flow)
        saveBirthData(birthData);
        await AsyncStorage.setItem(BIRTH_DATA_ENTERED_KEY, 'true');
      }

      // Clear chart cache so fresh charts are generated with new data
      await AsyncStorage.removeItem('cached_chart_response').catch(() => {});
      // Signal birth-chart to clear stale chart display on next focus
      await AsyncStorage.setItem('chart_needs_refresh', 'true').catch(() => {});

      // Navigate after save — go back to wherever we came from
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save birth details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Your Birth Details</Text>
        <Text style={styles.subtitle}>
          Enter your birth details to generate charts, dashas, and predictions.
        </Text>

        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        <GlassCard>
          <View style={styles.form}>
            <FormInput
              label="Full Name"
              placeholder="Enter your name"
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
          title="Save & Continue"
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
  title: {
    ...typography.styles.h3,
    color: colors.text,
    paddingTop: 8,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.muted,
  },
  form: {
    gap: 14,
  },
});
