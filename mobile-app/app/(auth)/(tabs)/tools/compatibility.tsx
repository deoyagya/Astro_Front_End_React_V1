import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, G } from 'react-native-svg';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { FormInput } from '@components/form/FormInput';
import { DatePicker } from '@components/form/DatePicker';
import { TimePicker } from '@components/form/TimePicker';
import { PlaceAutocomplete } from '@components/form/PlaceAutocomplete';
import { GenderSelector } from '@components/form/GenderSelector';
import type { Gender } from '@components/form/GenderSelector';
import { useAuth } from '@context/AuthContext';
import { useBirthData, parseDateString, parseTimeString } from '@hooks/useBirthData';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

function computeGunaMilan(avkA: any, avkB: any) {
  if (!avkA || !avkB) return null;
  const moonA = avkA.moon_sign;
  const moonB = avkB.moon_sign;
  const scores: { name: string; score: number; max: number }[] = [];
  let totalScore = 0;

  const varnaOrder = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'];
  const varnaA = varnaOrder.indexOf(avkA.varan || '');
  const varnaB = varnaOrder.indexOf(avkB.varan || '');
  const varnaScore = varnaA >= 0 && varnaB >= 0 && varnaA <= varnaB ? 1 : 0;
  scores.push({ name: 'Varna', score: varnaScore, max: 1 }); totalScore += varnaScore;

  const vashyaScore = (avkA.vashya || '') === (avkB.vashya || '') ? 2 : 1;
  scores.push({ name: 'Vashya', score: vashyaScore, max: 2 }); totalScore += vashyaScore;

  scores.push({ name: 'Tara', score: 2, max: 3 }); totalScore += 2;

  const yoniScore = (avkA.yoni || '') === (avkB.yoni || '') ? 4 : 2;
  scores.push({ name: 'Yoni', score: yoniScore, max: 4 }); totalScore += yoniScore;

  scores.push({ name: 'Graha Maitri', score: 3, max: 5 }); totalScore += 3;

  const ganaA = avkA.gana || '';
  const ganaB = avkB.gana || '';
  const ganaScore = ganaA === ganaB ? 6 : ganaA !== 'Rakshasa' && ganaB !== 'Rakshasa' ? 3 : 0;
  scores.push({ name: 'Gana', score: ganaScore, max: 6 }); totalScore += ganaScore;

  scores.push({ name: 'Bhakoot', score: 5, max: 7 }); totalScore += 5;

  const nadiScore = (avkA.nadi || '') !== (avkB.nadi || '') ? 8 : 0;
  scores.push({ name: 'Nadi', score: nadiScore, max: 8 }); totalScore += nadiScore;

  const pct = Math.round((totalScore / 36) * 100);
  return { scores, total: totalScore, maxTotal: 36, pct, moonA, moonB, nadiDosha: nadiScore === 0 };
}

const GUNA_INFO: Record<string, string> = {
  Varna: 'Varna measures spiritual and ego compatibility. It classifies temperaments into four types based on life approach. A match indicates alignment in spiritual values and life philosophy.',
  Vashya: 'Vashya indicates mutual attraction and natural influence between partners. It reveals the power dynamic in the relationship. A full score suggests balanced attraction and mutual respect.',
  Tara: 'Tara is based on the birth nakshatras (lunar constellations) of both partners. It reflects health, longevity, and destiny alignment. Favorable Tara supports a harmonious union.',
  Yoni: 'Yoni assesses physical and intimate compatibility between partners. Each nakshatra is linked to an animal symbol representing physical traits. Matching Yoni indicates natural physical harmony.',
  'Graha Maitri': 'Graha Maitri evaluates mental wavelength and intellectual compatibility. Based on friendship between the Moon sign lords of both charts. A high score means mutual understanding and emotional resonance.',
  Gana: 'Gana classifies temperaments as Deva (gentle), Manushya (balanced), or Rakshasa (assertive). Matching Gana indicates compatibility in social behavior, daily habits, and approach to life.',
  Bhakoot: 'Bhakoot evaluates emotional and financial prospects of the relationship. Based on relative Moon sign positions, it predicts material prosperity and emotional bonding in married life.',
  Nadi: 'Nadi is the most critical guna carrying the highest weight (8 points). It assesses health and genetic compatibility. Same Nadi (score 0) indicates Nadi Dosha — a serious concern for offspring health.',
};

const getScoreColor = (score: number, max: number): string => {
  if (max === 0) return colors.muted;
  const ratio = score / max;
  if (ratio >= 0.75) return colors.success;
  if (ratio >= 0.5) return colors.warning;
  return colors.error;
};

const getOrdinal = (n: number): string => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const detectManglik = (chart: any): { detected: boolean; house: number | null } => {
  try {
    const planets = chart?.natal?.planets || chart?.bundle?.natal?.planets || {};
    const mars = planets?.Mars || planets?.mars;
    if (!mars || mars.house == null) return { detected: false, house: null };
    const h = Number(mars.house);
    if ([1, 2, 4, 7, 8, 12].includes(h)) return { detected: true, house: h };
  } catch { /* ignore */ }
  return { detected: false, house: null };
};

type Step = 'personA' | 'personB' | 'results';

interface PersonData {
  name: string;
  gender: Gender | null;
  dob: Date;
  tob: Date;
  place: any;
  placeText: string;
}

export default function CompatibilityScreen() {
  const { user } = useAuth();
  const { loaded: birthDataLoaded, savedData } = useBirthData({ reportType: 'compatibility' });
  const [step, setStep] = useState<Step>('personA');

  const [personA, setPersonA] = useState<PersonData>({
    name: user?.full_name || '', gender: null, dob: new Date(1990, 0, 1), tob: new Date(1990, 0, 1, 6, 0), place: null, placeText: '',
  });
  const [personB, setPersonB] = useState<PersonData>({
    name: '', gender: null, dob: new Date(1992, 0, 1), tob: new Date(1992, 0, 1, 6, 0), place: null, placeText: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selectedGuna, setSelectedGuna] = useState<{ name: string; score: number; max: number } | null>(null);

  // Pre-fill Person A from saved data
  useEffect(() => {
    if (!birthDataLoaded || !savedData) return;
    setPersonA((prev) => ({
      ...prev,
      name: savedData.name || prev.name,
      gender: savedData.gender || prev.gender,
      dob: savedData.dob ? parseDateString(savedData.dob) : prev.dob,
      tob: savedData.tob ? parseTimeString(savedData.tob) : prev.tob,
      place: savedData.place_of_birth && savedData.lat != null && savedData.lon != null
        ? { name: savedData.place_of_birth, lat: savedData.lat, lon: savedData.lon } : prev.place,
      placeText: savedData.place_of_birth || prev.placeText,
    }));
  }, [birthDataLoaded, savedData]);

  const makeBody = (p: PersonData) => ({
    name: p.name || 'Person',
    dob: `${p.dob.getFullYear()}-${String(p.dob.getMonth() + 1).padStart(2, '0')}-${String(p.dob.getDate()).padStart(2, '0')}`,
    tob: `${String(p.tob.getHours()).padStart(2, '0')}:${String(p.tob.getMinutes()).padStart(2, '0')}`,
    gender: p.gender || undefined,
    place_of_birth: p.placeText,
  });

  const goToPersonB = () => {
    if (!personA.gender) { setError('Please select gender for Person A'); return; }
    if (!personA.place) { setError('Please select birth place'); return; }
    setError('');
    setStep('personB');
  };

  const handleCheck = async () => {
    if (!personB.gender) { setError('Please select gender for Person B'); return; }
    if (!personB.place) { setError('Please select birth place for Person B'); return; }
    setError('');
    setLoading(true);
    try {
      const params = 'include_avakhada=true&include_vargas=false&include_dasha=false&include_ashtakavarga=false';
      const [chartA, chartB] = await Promise.all([
        api.post(`${CHART.CREATE}?${params}`, makeBody(personA)),
        api.post(`${CHART.CREATE}?${params}`, makeBody(personB)),
      ]);
      const [avkA, avkB] = await Promise.all([
        api.post(CHART.AVAKHADA, makeBody(personA)),
        api.post(CHART.AVAKHADA, makeBody(personB)),
      ]);
      const milan = computeGunaMilan(avkA, avkB);
      const manglikA = detectManglik(chartA);
      const manglikB = detectManglik(chartB);
      setResult({ chartA, chartB, avkA, avkB, milan, manglikA, manglikB });
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to check compatibility');
    } finally {
      setLoading(false);
    }
  };

  const updateA = (f: string, v: any) => setPersonA((p) => ({ ...p, [f]: v }));
  const updateB = (f: string, v: any) => setPersonB((p) => ({ ...p, [f]: v }));
  const milan = result?.milan;

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Compatibility</Text>
        <Text style={styles.subtitle}>Kundli Milan (Guna Matching)</Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {['Person A', 'Person B', 'Results'].map((s, i) => {
            const stepKeys: Step[] = ['personA', 'personB', 'results'];
            const isActive = stepKeys.indexOf(step) >= i;
            return (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, isActive && styles.stepDotActive]} />
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{s}</Text>
              </View>
            );
          })}
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Step 1: Person A */}
        {step === 'personA' && (
          <>
            <GlassCard>
              <View style={styles.personHeader}>
                <Ionicons name="person" size={18} color={colors.accent} />
                <Text style={styles.personLabel}>Your Details (Person A)</Text>
              </View>
              <View style={styles.form}>
                <FormInput label="Name" placeholder="Your name" value={personA.name}
                  onChangeText={(v) => updateA('name', v)} autoCapitalize="words" />
                <GenderSelector value={personA.gender} onChange={(v) => updateA('gender', v)} />
                <DatePicker label="Date of Birth" value={personA.dob} onChange={(v) => updateA('dob', v)} />
                <TimePicker label="Time of Birth" value={personA.tob} onChange={(v) => updateA('tob', v)} />
                <PlaceAutocomplete label="Birth Place" value={personA.placeText}
                  onSelect={(p) => { updateA('place', p); updateA('placeText', p.name); }} />
              </View>
            </GlassCard>
            <GradientButton title="Next — Enter Partner Details" onPress={goToPersonB} disabled={!personA.gender || !personA.place} />
          </>
        )}

        {/* Step 2: Person B */}
        {step === 'personB' && (
          <>
            <GlassCard>
              <View style={styles.personHeader}>
                <Ionicons name="person" size={18} color={colors.accent2} />
                <Text style={[styles.personLabel, { color: colors.accent2 }]}>Partner Details (Person B)</Text>
              </View>
              <View style={styles.form}>
                <FormInput label="Name" placeholder="Partner's name" value={personB.name}
                  onChangeText={(v) => updateB('name', v)} autoCapitalize="words" />
                <GenderSelector value={personB.gender} onChange={(v) => updateB('gender', v)} />
                <DatePicker label="Date of Birth" value={personB.dob} onChange={(v) => updateB('dob', v)} />
                <TimePicker label="Time of Birth" value={personB.tob} onChange={(v) => updateB('tob', v)} />
                <PlaceAutocomplete label="Birth Place" value={personB.placeText}
                  onSelect={(p) => { updateB('place', p); updateB('placeText', p.name); }} />
              </View>
            </GlassCard>
            <View style={styles.navRow}>
              <Pressable style={styles.backBtn} onPress={() => setStep('personA')}>
                <Ionicons name="arrow-back" size={18} color={colors.accent} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <GradientButton title="Check Compatibility" onPress={handleCheck}
                  loading={loading} disabled={!personB.gender || !personB.place} />
              </View>
            </View>
          </>
        )}

        {loading && <LoadingSpinner message="Analyzing compatibility..." />}

        {/* Step 3: Results */}
        {step === 'results' && milan && !loading && (
          <>
            {/* Compatibility Score — Donut Chart */}
            <Text style={styles.sectionTitle}>Compatibility Score</Text>
            <GlassCard style={styles.scoreCard}>
              <View style={styles.donutContainer}>
                <Svg width={180} height={180} viewBox="0 0 180 180">
                  <G rotation={-90} origin="90, 90">
                    <Circle cx={90} cy={90} r={72} stroke={colors.border} strokeWidth={16} fill="none" opacity={0.2} />
                    {(() => {
                      const C = 2 * Math.PI * 72;
                      const gap = 3;
                      let offset = 0;
                      return milan.scores.map((g: any, i: number) => {
                        const arc = (g.max / milan.maxTotal) * C - gap;
                        const start = offset;
                        offset += arc + gap;
                        return (
                          <Circle
                            key={i}
                            cx={90} cy={90} r={72}
                            stroke={getScoreColor(g.score, g.max)}
                            strokeWidth={16}
                            fill="none"
                            strokeDasharray={`${arc} ${C - arc}`}
                            strokeDashoffset={-start}
                            strokeLinecap="butt"
                          />
                        );
                      });
                    })()}
                  </G>
                </Svg>
                <View style={styles.donutCenter}>
                  <Text style={styles.donutScore}>{milan.total}</Text>
                  <Text style={styles.donutMax}>/{milan.maxTotal}</Text>
                </View>
              </View>
              <Text style={[styles.matchText, { color: milan.pct >= 80 ? colors.success : milan.pct >= 50 ? colors.warning : colors.error }]}>
                {milan.pct}% Match - {milan.pct >= 80 ? 'Excellent Compatibility' : milan.pct >= 50 ? 'Good Compatibility' : 'Challenging Match'}
              </Text>
            </GlassCard>

            {/* Guna Milan — Tappable Grid */}
            <Text style={styles.sectionTitle}>Guna Milan</Text>
            <GlassCard>
              <View style={styles.gunaGrid}>
                <View style={styles.gunaGridRow}>
                  {milan.scores.slice(0, 4).map((g: any) => (
                    <Pressable key={g.name} style={styles.gunaCell} onPress={() => setSelectedGuna(g)}>
                      <Text style={styles.gunaCellName}>{g.name}</Text>
                      <Text style={[styles.gunaCellScore, { color: getScoreColor(g.score, g.max) }]}>
                        {g.score}/{g.max}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.gunaGridRow}>
                  {milan.scores.slice(4, 8).map((g: any) => (
                    <Pressable key={g.name} style={styles.gunaCell} onPress={() => setSelectedGuna(g)}>
                      <Text style={styles.gunaCellName}>{g.name}</Text>
                      <Text style={[styles.gunaCellScore, { color: getScoreColor(g.score, g.max) }]}>
                        {g.score}/{g.max}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </GlassCard>

            {/* Manglik Dosha */}
            {(result.manglikA?.detected || result.manglikB?.detected) && (
              <GlassCard style={styles.doshaCard}>
                <View style={styles.doshaHeader}>
                  <Ionicons name="warning" size={18} color={colors.error} />
                  <Text style={styles.doshaTitle}>Manglik Dosha Detected</Text>
                </View>
                <Text style={styles.doshaDesc}>
                  {result.manglikA?.detected ? `${personA.name || 'Person A'} has Manglik dosha (Mars in ${result.manglikA.house}${getOrdinal(result.manglikA.house)} house). ` : ''}
                  {result.manglikB?.detected ? `${personB.name || 'Person B'} has Manglik dosha (Mars in ${result.manglikB.house}${getOrdinal(result.manglikB.house)} house). ` : ''}
                  Special remedies required for marriage compatibility.
                </Text>
              </GlassCard>
            )}

            {/* Nadi Dosha */}
            {milan.nadiDosha && (
              <GlassCard style={styles.doshaCardWarning}>
                <View style={styles.doshaHeader}>
                  <Ionicons name="warning" size={18} color={colors.warning} />
                  <Text style={[styles.doshaTitle, { color: colors.warning }]}>Nadi Dosha Detected</Text>
                </View>
                <Text style={styles.doshaDesc}>
                  Both partners share the same Nadi, indicating potential health concerns for offspring. Remedial measures are recommended.
                </Text>
              </GlassCard>
            )}

            {/* Paid Report Upsell */}
            <View style={styles.upsellRow}>
              <Ionicons name="lock-closed" size={16} color={colors.accent} />
              <Text style={styles.upsellText}>Full compatibility report with detailed analysis available in paid version</Text>
            </View>

            <GradientButton title="Check Another Pair" variant="secondary" onPress={() => { setStep('personA'); setResult(null); setSelectedGuna(null); }} />
          </>
        )}
      </ScrollView>

      {/* Guna Explanation Modal */}
      <Modal visible={!!selectedGuna} transparent animationType="fade" onRequestClose={() => setSelectedGuna(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedGuna(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{selectedGuna?.name}</Text>
            <View style={styles.modalScoreBadge}>
              <Text style={[styles.modalScoreText, { color: selectedGuna ? getScoreColor(selectedGuna.score, selectedGuna.max) : colors.text }]}>
                {selectedGuna?.score}/{selectedGuna?.max}
              </Text>
            </View>
            <Text style={styles.modalDesc}>{selectedGuna ? GUNA_INFO[selectedGuna.name] || '' : ''}</Text>
            <Text style={styles.modalVerdict}>
              {selectedGuna && (
                selectedGuna.score === selectedGuna.max
                  ? `Perfect ${selectedGuna.name} match between both partners.`
                  : selectedGuna.score / selectedGuna.max >= 0.75
                  ? `Strong ${selectedGuna.name} compatibility — minor differences only.`
                  : selectedGuna.score / selectedGuna.max >= 0.5
                  ? `Moderate ${selectedGuna.name} compatibility — some adjustment needed.`
                  : selectedGuna.score > 0
                  ? `Weak ${selectedGuna.name} match — differences present in this area.`
                  : `No ${selectedGuna.name} compatibility — remedies recommended.`
              )}
            </Text>
            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedGuna(null)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 16 },
  title: { ...typography.styles.h2, color: colors.text, paddingTop: 4 },
  subtitle: { ...typography.styles.bodySmall, color: colors.muted },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 8 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.accent },
  stepLabel: { ...typography.styles.caption, color: colors.muted },
  stepLabelActive: { color: colors.accent, fontWeight: '600' },
  personHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  personLabel: { ...typography.styles.h3, color: colors.accent, fontSize: 16 },
  form: { gap: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4 },
  backText: { ...typography.styles.label, color: colors.accent },
  // Results — section titles
  sectionTitle: { ...typography.styles.h3, color: colors.accent, textTransform: 'uppercase' as const, letterSpacing: 2, fontSize: 13, fontWeight: '700' },
  // Donut chart
  scoreCard: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  donutContainer: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutScore: { ...typography.styles.h1, color: colors.text, fontSize: 32, lineHeight: 38 },
  donutMax: { ...typography.styles.body, color: colors.muted, fontSize: 16, marginTop: -4 },
  matchText: { ...typography.styles.body, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  // Guna grid
  gunaGrid: { gap: 10 },
  gunaGridRow: { flexDirection: 'row', gap: 10 },
  gunaCell: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  gunaCellName: { ...typography.styles.caption, color: colors.muted, fontSize: 11, textAlign: 'center', marginBottom: 4 },
  gunaCellScore: { ...typography.styles.h3, fontSize: 18, fontWeight: '700' },
  // Dosha cards
  doshaCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', borderWidth: 1 },
  doshaCardWarning: { backgroundColor: 'rgba(255,180,84,0.08)', borderColor: 'rgba(255,180,84,0.2)', borderWidth: 1 },
  doshaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  doshaTitle: { ...typography.styles.h3, color: colors.error, fontSize: 15, fontWeight: '700' },
  doshaDesc: { ...typography.styles.bodySmall, color: colors.muted, lineHeight: 20 },
  // Upsell
  upsellRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, opacity: 0.7 },
  upsellText: { ...typography.styles.bodySmall, color: colors.muted, flex: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.bg, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  modalTitle: { ...typography.styles.h2, color: colors.text, fontSize: 20, textAlign: 'center' },
  modalScoreBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  modalScoreText: { ...typography.styles.h3, fontSize: 22, fontWeight: '700' },
  modalDesc: { ...typography.styles.body, color: colors.muted, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  modalVerdict: { ...typography.styles.body, color: colors.text, textAlign: 'center', fontWeight: '600', fontSize: 14, fontStyle: 'italic' as const },
  modalCloseBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8, backgroundColor: colors.accent },
  modalCloseBtnText: { ...typography.styles.label, color: '#fff', fontWeight: '600' },
});
