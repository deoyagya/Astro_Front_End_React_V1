import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { QuotaBadge, parseQuotaResponse } from '@components/chat/QuotaBadge';
import { TemplateChip } from '@components/chat/TemplateChip';
import { usePremiumGate } from '@hooks/usePremiumGate';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHAT, CHART } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

/* ─── Interfaces ──────────────────────────────────────── */

interface LifeArea {
  key: string;
  name: string;
  domain?: string;
  icon?: string;
}

interface SavedChart {
  id: string;
  birth_data: {
    name: string;
    dob: string;
    tob: string;
    place_of_birth?: string;
    lat?: number;
    lon?: number;
    gender?: string;
  };
}

interface Template {
  id: string;
  question_text: string;
  credit_cost?: number;
}

interface QuotaData {
  used: number;
  total: number;
}

interface ChatSession {
  id: string;
  life_area_key: string;
  life_area_name?: string;
  question_count: number;
  status: string;
  created_at: string;
}

/* ─── Icon/Color maps ─────────────────────────────────── */

const AREA_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  health: 'heart-outline',
  education: 'school-outline',
  finance: 'cash-outline',
  spiritual: 'leaf-outline',
  family: 'people-outline',
  children: 'happy-outline',
  legal: 'shield-outline',
  property: 'home-outline',
  travel: 'airplane-outline',
  prashna: 'help-circle-outline',
  varshaphal: 'calendar-outline',
  compatibility: 'heart-half-outline',
  general: 'grid-outline',
};

const AREA_COLORS: Record<string, string> = {
  health: colors.malefic,
  education: colors.accent2,
  finance: colors.success,
  spiritual: colors.accent,
  family: colors.warning,
  children: colors.combust,
  legal: colors.error,
  property: colors.benefic,
  travel: colors.accent2,
  prashna: colors.accent,
  varshaphal: colors.warning,
  compatibility: colors.malefic,
  general: colors.muted,
};

/* ─── Main Screen ─────────────────────────────────────── */

export default function ChatAreasScreen() {
  const { isBasicPlus } = usePremiumGate();
  const { loaded: birthLoaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();

  // Core data
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // Selections
  const [selectedChart, setSelectedChart] = useState<SavedChart | null>(null);
  const [selectedArea, setSelectedArea] = useState<LifeArea | null>(null);

  // Modals
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);

  // Custom question
  const [customText, setCustomText] = useState('');

  // States
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  /* ─── Fetch core data on focus ─── */
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        setError('');
        try {
          const [areaRes, quotaRes, sessRes, chartsRes] = await Promise.all([
            api.get(CHAT.LIFE_AREAS),
            api.get(CHAT.QUOTA).catch(() => null),
            api.get(`${CHAT.SESSIONS}?limit=5`).catch(() => ({ sessions: [] })),
            api.get(`${CHART.SAVED}?limit=20`).catch(() => ({ charts: [] })),
          ]);

          const areaList = areaRes?.life_areas || areaRes?.areas || areaRes || [];
          setAreas(areaList);
          setQuota(parseQuotaResponse(quotaRes));
          setSessions(sessRes?.sessions || []);

          // Build saved chart list
          const charts: SavedChart[] = (chartsRes?.charts || []).filter(
            (c: any) => c?.birth_data?.dob,
          );
          setSavedCharts(charts);

          // Pre-select first chart if available, else use user's own birth data
          if (charts.length > 0 && !selectedChart) {
            setSelectedChart(charts[0]);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load chat data');
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  /* ─── Fetch templates when life area changes ─── */
  useEffect(() => {
    if (!selectedArea) {
      setTemplates([]);
      return;
    }
    (async () => {
      setTemplatesLoading(true);
      try {
        const res = await api.get(CHAT.TEMPLATES(selectedArea.key));
        setTemplates(res?.templates || res || []);
      } catch {
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    })();
  }, [selectedArea?.key]);

  /* ─── Get effective birth data ─── */
  const getEffectiveBirthData = () => {
    if (selectedChart) return selectedChart.birth_data;
    if (activeData) return activeData;
    return savedData;
  };

  /* ─── Start session with a template ─── */
  const handleStartWithTemplate = async (template: Template) => {
    const bd = getEffectiveBirthData();
    if (!bd?.dob || !bd?.tob) {
      Alert.alert('Birth Data Required', 'Please select a birth chart or enter your birth details first.');
      return;
    }
    if (!selectedArea) return;

    setStarting(true);
    setError('');
    try {
      const birthPayload: any = {
        dob: bd.dob,
        tob: bd.tob,
        place_of_birth: bd.place_of_birth,
        lat: bd.lat,
        lon: bd.lon,
      };
      if (bd.tob?.includes(':')) {
        const [h, m] = bd.tob.split(':').map(Number);
        birthPayload.tob_h = h;
        birthPayload.tob_m = m;
      }

      const res = await api.post(CHAT.START, {
        life_area_key: selectedArea.key,
        birth_data: birthPayload,
        mode: 'text',
      });

      const sessionId = res?.session_id || res?.id;
      if (!sessionId) throw new Error('No session ID returned');

      router.push({
        pathname: '/(auth)/(tabs)/consult/chat-thread',
        params: { session_id: sessionId, template_id: template.id },
      } as any);
    } catch (err: any) {
      setError(err.message || 'Failed to start chat session');
    } finally {
      setStarting(false);
    }
  };

  /* ─── Start session with custom question ─── */
  const handleStartCustom = async () => {
    const text = customText.trim();
    if (!text || text.length < 5) {
      Alert.alert('Too Short', 'Please enter at least 5 characters.');
      return;
    }
    const bd = getEffectiveBirthData();
    if (!bd?.dob || !bd?.tob) {
      Alert.alert('Birth Data Required', 'Please select a birth chart or enter your birth details first.');
      return;
    }
    if (!selectedArea) {
      Alert.alert('Life Area Required', 'Please select a life area first.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      const birthPayload: any = {
        dob: bd.dob,
        tob: bd.tob,
        place_of_birth: bd.place_of_birth,
        lat: bd.lat,
        lon: bd.lon,
      };
      if (bd.tob?.includes(':')) {
        const [h, m] = bd.tob.split(':').map(Number);
        birthPayload.tob_h = h;
        birthPayload.tob_m = m;
      }

      const res = await api.post(CHAT.START, {
        life_area_key: selectedArea.key,
        birth_data: birthPayload,
        mode: 'text',
      });

      const sessionId = res?.session_id || res?.id;
      if (!sessionId) throw new Error('No session ID returned');

      // Navigate to thread, follow-up the custom text on mount
      router.push({
        pathname: '/(auth)/(tabs)/consult/chat-thread',
        params: { session_id: sessionId, custom_question: text },
      } as any);

      setCustomText('');
    } catch (err: any) {
      setError(err.message || 'Failed to start chat session');
    } finally {
      setStarting(false);
    }
  };

  /* ─── Premium gate ─── */
  if (!isBasicPlus) {
    return (
      <Screen>
        <AppHeader />
        <View style={styles.gateCentered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.warning} />
          <Text style={styles.gateTitle}>Premium Feature</Text>
          <Text style={styles.gateSubtitle}>AI Chat requires a paid subscription.</Text>
          <Pressable
            style={styles.gateBtn}
            onPress={() => router.push('/(auth)/(tabs)/my-data/subscription' as any)}
          >
            <Text style={styles.gateBtnText}>View Plans</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  /* ─── Chart display label ─── */
  const chartLabel = selectedChart
    ? `${selectedChart.birth_data.name || 'Chart'} · ${selectedChart.birth_data.dob}`
    : savedData?.dob
      ? `${savedData.name || 'My Chart'} · ${savedData.dob}`
      : 'Select birth chart…';

  /* ─── Area display label ─── */
  const areaLabel = selectedArea ? selectedArea.name : 'Select life area…';
  const areaIcon: keyof typeof Ionicons.glyphMap = selectedArea
    ? (AREA_ICONS[selectedArea.key] || 'grid-outline')
    : 'grid-outline';
  const areaColor = selectedArea ? (AREA_COLORS[selectedArea.key] || colors.accent) : colors.muted;

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>AI Vedic Chat</Text>
        </View>

        {/* Quota */}
        {quota && <QuotaBadge used={quota.used} total={quota.total} />}

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading..." />}

        {!loading && (
          <>
            {/* ─── Step 1: Select Birth Chart ─── */}
            <Text style={styles.stepLabel}>1. Birth Chart</Text>
            <Pressable style={styles.dropdown} onPress={() => setChartModalOpen(true)}>
              <Ionicons name="person-outline" size={18} color={colors.accent} />
              <Text style={[styles.dropdownText, !selectedChart && !savedData?.dob && styles.placeholder]} numberOfLines={1}>
                {chartLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>

            {/* ─── Step 2: Select Life Area ─── */}
            <Text style={styles.stepLabel}>2. Life Area</Text>
            <Pressable style={styles.dropdown} onPress={() => setAreaModalOpen(true)}>
              <Ionicons name={areaIcon} size={18} color={areaColor} />
              <Text style={[styles.dropdownText, !selectedArea && styles.placeholder]} numberOfLines={1}>
                {areaLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>

            {/* ─── Step 3: Predefined Questions ─── */}
            {selectedArea && (
              <>
                <Text style={styles.stepLabel}>3. Choose a question</Text>
                {templatesLoading && <LoadingSpinner message="Loading questions..." />}
                {!templatesLoading && templates.length === 0 && (
                  <Text style={styles.emptyHint}>No predefined questions for this area.</Text>
                )}
                {!templatesLoading && templates.length > 0 && (
                  <View style={styles.templateList}>
                    {templates.map((t) => (
                      <TemplateChip
                        key={t.id}
                        text={t.question_text}
                        creditCost={t.credit_cost}
                        onPress={() => handleStartWithTemplate(t)}
                        disabled={starting}
                      />
                    ))}
                  </View>
                )}

                {/* ─── Step 4: Custom Question ─── */}
                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                <Text style={styles.stepLabel}>Ask your own question</Text>
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Type your question here…"
                    placeholderTextColor={colors.muted}
                    value={customText}
                    onChangeText={setCustomText}
                    multiline
                    maxLength={200}
                    editable={!starting}
                  />
                  <Pressable
                    style={[styles.askBtn, (!customText.trim() || starting) && styles.askBtnDisabled]}
                    onPress={handleStartCustom}
                    disabled={!customText.trim() || starting}
                  >
                    <Ionicons
                      name="send"
                      size={18}
                      color={customText.trim() && !starting ? colors.text : colors.muted}
                    />
                  </Pressable>
                </View>
              </>
            )}

            {/* ─── Recent Sessions ─── */}
            {sessions.length > 0 && (
              <>
                <Text style={[styles.stepLabel, { marginTop: 20 }]}>Recent Sessions</Text>
                <FlatList
                  data={sessions}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(s) => s.id}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <GlassCard
                      onPress={() =>
                        router.push({
                          pathname: '/(auth)/(tabs)/consult/chat-thread',
                          params: { session_id: item.id },
                        } as any)
                      }
                      style={styles.sessionCard}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {item.life_area_name || item.life_area_key}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {item.question_count} Q · {item.status}
                      </Text>
                    </GlassCard>
                  )}
                />
              </>
            )}

            {starting && <LoadingSpinner message="Starting session..." />}
          </>
        )}
      </ScrollView>

      {/* ─── Chart Picker Modal ─── */}
      <Modal visible={chartModalOpen} transparent animationType="slide" onRequestClose={() => setChartModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setChartModalOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Birth Chart</Text>
              <Pressable onPress={() => setChartModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            {/* User's own birth data */}
            {savedData?.dob && (
              <Pressable
                style={[
                  styles.modalOption,
                  !selectedChart && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedChart(null); // null = use user's own data
                  setChartModalOpen(false);
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionLabel}>
                    {savedData.name || 'My Birth Chart'}
                  </Text>
                  <Text style={styles.modalOptionSub}>{savedData.dob}</Text>
                </View>
                {!selectedChart && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                )}
              </Pressable>
            )}

            {/* Saved charts */}
            <FlatList
              data={savedCharts}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = selectedChart?.id === item.id;
                return (
                  <Pressable
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      setSelectedChart(item);
                      setChartModalOpen(false);
                    }}
                  >
                    <View style={styles.modalOptionIcon}>
                      <Ionicons name="person-outline" size={16} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalOptionLabel}>
                        {item.birth_data.name || 'Unnamed'}
                      </Text>
                      <Text style={styles.modalOptionSub}>
                        {item.birth_data.dob} · {item.birth_data.place_of_birth || ''}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !savedData?.dob ? (
                  <Text style={styles.modalEmpty}>
                    No saved charts. Please enter your birth details first.
                  </Text>
                ) : null
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Life Area Picker Modal ─── */}
      <Modal visible={areaModalOpen} transparent animationType="slide" onRequestClose={() => setAreaModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAreaModalOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Life Area</Text>
              <Pressable onPress={() => setAreaModalOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <FlatList
              data={areas}
              keyExtractor={(a) => a.key}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const isSelected = selectedArea?.key === item.key;
                const iconName = AREA_ICONS[item.key] || 'grid-outline';
                const iconColor = AREA_COLORS[item.key] || colors.accent;
                return (
                  <Pressable
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      setSelectedArea(item);
                      setAreaModalOpen(false);
                    }}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: `${iconColor}15` }]}>
                      <Ionicons name={iconName} size={16} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalOptionLabel}>{item.name}</Text>
                      {item.domain && <Text style={styles.modalOptionSub}>{item.domain}</Text>}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/* ─── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },

  stepLabel: {
    ...typography.styles.label,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },

  /* Dropdown Selector */
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    ...typography.styles.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: { color: colors.muted },

  /* Templates */
  templateList: { gap: 10 },
  emptyHint: { ...typography.styles.caption, color: colors.muted, paddingVertical: 8 },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.styles.caption, color: colors.muted, fontWeight: '600' },

  /* Custom question */
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    ...typography.styles.bodySmall,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBtnDisabled: { backgroundColor: colors.panelSoft },

  /* Recent sessions */
  sessionCard: { width: 150, gap: 6 },
  sessionName: { ...typography.styles.caption, color: colors.text, fontWeight: '500' },
  sessionMeta: { ...typography.styles.caption, color: colors.muted, fontSize: 10 },

  /* Premium gate */
  gateCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { ...typography.styles.h3, color: colors.text },
  gateSubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center' },
  gateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  gateBtnText: { ...typography.styles.button, color: colors.text },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.styles.h3, color: colors.text },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}40`,
  },
  modalOptionSelected: {
    backgroundColor: `${colors.accent}10`,
  },
  modalOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}15`,
  },
  modalOptionLabel: { ...typography.styles.body, color: colors.text, fontWeight: '500' },
  modalOptionSub: { ...typography.styles.caption, color: colors.muted, marginTop: 1 },
  modalEmpty: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
