import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  useWindowDimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { EventCard } from '@components/muhurta/EventCard';
import { useBirthData } from '@hooks/useBirthData';
import { api } from '@api/client';
import { MUHURTA, LOCATION } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface MuhurtaEvent {
  event_key: string;
  label: string;
  icon?: string;
  price?: number;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MuhurtaScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 10) / 2;
  const { loaded, savedData } = useBirthData({});

  const [events, setEvents] = useState<MuhurtaEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MuhurtaEvent | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [locationText, setLocationText] = useState(savedData?.place_of_birth || '');
  const [location, setLocation] = useState<{ lat: number; lon: number; tz_id: string } | null>(
    savedData?.lat && savedData?.lon
      ? { lat: savedData.lat, lon: savedData.lon, tz_id: 'Asia/Kolkata' }
      : null
  );
  const [personalize, setPersonalize] = useState(false);
  const [finding, setFinding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date picker visibility (Android needs explicit show/hide)
  const [showStartPicker, setShowStartPicker] = useState(Platform.OS === 'ios');
  const [showEndPicker, setShowEndPicker] = useState(Platform.OS === 'ios');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get(MUHURTA.EVENTS, { noAuth: true });
          setEvents(res?.events || res || []);
        } catch (err: any) {
          setError(err.message || 'Failed to load events');
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  // Auto-set location from birth data
  useFocusEffect(
    useCallback(() => {
      if (loaded && savedData?.lat && savedData?.lon && !location) {
        setLocation({ lat: savedData.lat, lon: savedData.lon, tz_id: 'Asia/Kolkata' });
        setLocationText(savedData.place_of_birth || '');
      }
    }, [loaded, savedData?.lat])
  );

  const handleFind = async () => {
    if (!selectedEvent) { setError('Please select an event type'); return; }
    if (!location) { setError('Please select a location'); return; }

    setFinding(true);
    setError('');
    try {
      const body: any = {
        event_type: selectedEvent.event_key,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        lat: location.lat,
        lon: location.lon,
        tz_id: location.tz_id,
      };

      if (personalize && savedData?.dob && savedData?.tob) {
        body.birth_data = {
          name: savedData.name || 'User',
          dob: savedData.dob,
          tob: savedData.tob,
          place_of_birth: savedData.place_of_birth,
          lat: savedData.lat,
          lon: savedData.lon,
        };
      }

      const result = await api.post(MUHURTA.FIND, body, { noAuth: true });

      router.push({
        pathname: '/(auth)/(tabs)/tools/muhurta-results',
        params: {
          resultJson: JSON.stringify(result),
          eventLabel: selectedEvent.label,
          eventType: selectedEvent.event_key,
        },
      } as any);
    } catch (err: any) {
      setError(err.message || 'Failed to find auspicious windows');
    } finally {
      setFinding(false);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Find Auspicious Time</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading events..." />}

        {!loading && (
          <>
            <Text style={styles.sectionLabel}>Select Event Type</Text>
            <View style={styles.grid}>
              {events.map((evt) => (
                <View key={evt.event_key} style={{ width: cardWidth }}>
                  <EventCard
                    name={evt.label}
                    icon={evt.icon || evt.event_key}
                    price={evt.price}
                    selected={selectedEvent?.event_key === evt.event_key}
                    onPress={() => setSelectedEvent(evt)}
                  />
                </View>
              ))}
            </View>

            {selectedEvent && (
              <GlassCard style={styles.formCard}>
                <Text style={styles.formTitle}>Search Parameters</Text>

                {/* Date pickers */}
                <View style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Start Date</Text>
                    {Platform.OS === 'android' && (
                      <Pressable style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                        <Text style={styles.dateBtnText}>{formatDate(startDate)}</Text>
                      </Pressable>
                    )}
                    {showStartPicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'compact' : 'default'}
                        minimumDate={new Date()}
                        onChange={(_, d) => {
                          if (Platform.OS === 'android') setShowStartPicker(false);
                          if (d) setStartDate(d);
                        }}
                        themeVariant="dark"
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>End Date</Text>
                    {Platform.OS === 'android' && (
                      <Pressable style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                        <Text style={styles.dateBtnText}>{formatDate(endDate)}</Text>
                      </Pressable>
                    )}
                    {showEndPicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'compact' : 'default'}
                        minimumDate={startDate}
                        onChange={(_, d) => {
                          if (Platform.OS === 'android') setShowEndPicker(false);
                          if (d) setEndDate(d);
                        }}
                        themeVariant="dark"
                      />
                    )}
                  </View>
                </View>

                {/* Location */}
                <Text style={styles.fieldLabel}>Location</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={18} color={colors.muted} />
                  <Text style={styles.locationText}>
                    {locationText || 'Using birth location'}
                  </Text>
                </View>

                {/* Personalize toggle */}
                {savedData?.dob && (
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Personalize with birth data</Text>
                      <Text style={styles.toggleHint}>
                        Uses your Tara Bala & Chandra Bala for scoring
                      </Text>
                    </View>
                    <Switch
                      value={personalize}
                      onValueChange={setPersonalize}
                      trackColor={{ true: colors.accent, false: colors.border }}
                      thumbColor={colors.text}
                    />
                  </View>
                )}

                <GradientButton
                  title="Find Windows"
                  onPress={handleFind}
                  loading={finding}
                  disabled={finding}
                  style={{ marginTop: 12 }}
                />
              </GlassCard>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  sectionLabel: { ...typography.styles.label, color: colors.muted, fontWeight: '600', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  formCard: { gap: 12, marginTop: 8 },
  formTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  fieldLabel: { ...typography.styles.caption, color: colors.muted, fontWeight: '600', marginBottom: 4 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateBtn: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateBtnText: { ...typography.styles.bodySmall, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  locationText: { ...typography.styles.bodySmall, color: colors.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  toggleHint: { ...typography.styles.caption, color: colors.muted, fontSize: 11 },
});
