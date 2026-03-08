import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { TemplateChip } from '@components/chat/TemplateChip';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHAT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface Template {
  id: string;
  question_text: string;
  credit_cost?: number;
}

export default function ChatTemplatesScreen() {
  const { life_area_key, area_name } = useLocalSearchParams<{
    life_area_key: string;
    area_name: string;
  }>();

  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!life_area_key) return;
      (async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get(CHAT.TEMPLATES(life_area_key));
          setTemplates(res?.templates || res || []);
        } catch (err: any) {
          setError(err.message || 'Failed to load templates');
        } finally {
          setLoading(false);
        }
      })();
    }, [life_area_key])
  );

  const handleStartSession = async (template: Template) => {
    if (!effectiveData?.dob || !effectiveData?.tob) {
      Alert.alert('Birth Data Required', 'Please enter your birth details first.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      // Build birth_data payload
      const birthPayload: any = {
        dob: effectiveData.dob,
        tob: effectiveData.tob,
        place_of_birth: effectiveData.place_of_birth,
        lat: effectiveData.lat,
        lon: effectiveData.lon,
      };

      // Parse tob into hours/minutes if in "HH:MM" format
      if (effectiveData.tob && effectiveData.tob.includes(':')) {
        const [h, m] = effectiveData.tob.split(':').map(Number);
        birthPayload.tob_h = h;
        birthPayload.tob_m = m;
      }

      const res = await api.post(CHAT.START, {
        life_area_key,
        birth_data: birthPayload,
        mode: 'text',
      });

      const sessionId = res?.session_id || res?.id;
      if (!sessionId) throw new Error('No session ID returned');

      router.replace({
        pathname: '/(auth)/(tabs)/consult/chat-thread',
        params: { session_id: sessionId, template_id: template.id },
      } as any);
    } catch (err: any) {
      setError(err.message || 'Failed to start chat session');
    } finally {
      setStarting(false);
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{area_name || 'Chat'}</Text>
            <Text style={styles.subtitle}>Choose a question to start</Text>
          </View>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading questions..." />}

        {!loading && templates.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No questions available for this area.</Text>
          </View>
        )}

        {!loading && templates.length > 0 && (
          <View style={styles.templateList}>
            {templates.map((t) => (
              <TemplateChip
                key={t.id}
                text={t.question_text}
                creditCost={t.credit_cost}
                onPress={() => handleStartSession(t)}
                disabled={starting}
              />
            ))}
          </View>
        )}

        {starting && <LoadingSpinner message="Starting session..." />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  subtitle: { ...typography.styles.caption, color: colors.muted },
  templateList: { gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center' },
});
