import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { COMPATIBILITY } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const getScoreColor = (score: number, max: number): string => {
  if (max === 0) return colors.muted;
  const ratio = score / max;
  if (ratio >= 0.75) return colors.success;
  if (ratio >= 0.5) return colors.warning;
  return colors.error;
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
  const [selectedKoota, setSelectedKoota] = useState<any>(null);

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
      const data = await api.post(COMPATIBILITY.CHECK, {
        groom: makeBody(personA),
        bride: makeBody(personB),
      });
      setResult(data);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to check compatibility');
    } finally {
      setLoading(false);
    }
  };

  const updateA = (f: string, v: any) => setPersonA((p) => ({ ...p, [f]: v }));
  const updateB = (f: string, v: any) => setPersonB((p) => ({ ...p, [f]: v }));

  // Backend response fields
  const kootas: any[] = result?.kootas || [];
  const totalPoints = result?.total_points ?? 0;
  const maxPoints = result?.max_points ?? 36;
  const percentage = result?.percentage ?? 0;
  const pct = Math.round(percentage);
  const verdict = result?.verdict || '';
  const verdictDesc = result?.verdict_description || '';
  const doshas: string[] = result?.doshas || [];
  const manglikGroom = result?.manglik_groom;
  const manglikBride = result?.manglik_bride;
  const hasNadiDosha = doshas.some((d: string) => d.toLowerCase().includes('nadi'));

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
        {step === 'results' && result && !loading && (
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
                      return kootas.map((k: any, i: number) => {
                        const kMax = k.max_points || 1;
                        const kScore = k.obtained_points ?? 0;
                        const arc = (kMax / maxPoints) * C - gap;
                        const start = offset;
                        offset += arc + gap;
                        return (
                          <Circle
                            key={i}
                            cx={90} cy={90} r={72}
                            stroke={getScoreColor(kScore, kMax)}
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
                  <Text style={styles.donutScore}>{Math.round(totalPoints)}</Text>
                  <Text style={styles.donutMax}>/{maxPoints}</Text>
                </View>
              </View>
              <Text style={[styles.matchText, { color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error }]}>
                {pct}% Match — {verdict || (pct >= 80 ? 'Excellent Compatibility' : pct >= 50 ? 'Good Compatibility' : 'Challenging Match')}
              </Text>
              {!!verdictDesc && (
                <Text style={styles.verdictDesc}>{verdictDesc}</Text>
              )}
            </GlassCard>

            {/* Guna Milan — Tappable Grid */}
            <Text style={styles.sectionTitle}>Guna Milan</Text>
            <GlassCard>
              <View style={styles.gunaGrid}>
                <View style={styles.gunaGridRow}>
                  {kootas.slice(0, 4).map((k: any) => (
                    <Pressable key={k.koota_name} style={styles.gunaCell} onPress={() => setSelectedKoota(k)}>
                      <Text style={styles.gunaCellName}>{k.koota_name}</Text>
                      <Text style={[styles.gunaCellScore, { color: getScoreColor(k.obtained_points ?? 0, k.max_points || 1) }]}>
                        {Math.round(k.obtained_points ?? 0)}/{k.max_points}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.gunaGridRow}>
                  {kootas.slice(4, 8).map((k: any) => (
                    <Pressable key={k.koota_name} style={styles.gunaCell} onPress={() => setSelectedKoota(k)}>
                      <Text style={styles.gunaCellName}>{k.koota_name}</Text>
                      <Text style={[styles.gunaCellScore, { color: getScoreColor(k.obtained_points ?? 0, k.max_points || 1) }]}>
                        {Math.round(k.obtained_points ?? 0)}/{k.max_points}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </GlassCard>

            {/* Manglik Dosha */}
            {(manglikGroom?.is_manglik || manglikBride?.is_manglik) && (
              <GlassCard style={styles.doshaCard}>
                <View style={styles.doshaHeader}>
                  <Ionicons name="warning" size={18} color={colors.error} />
                  <Text style={styles.doshaTitle}>Manglik Dosha Detected</Text>
                </View>
                <Text style={styles.doshaDesc}>
                  {manglikGroom?.is_manglik ? `${personA.name || 'Person A'} has Manglik dosha${manglikGroom.mars_house ? ` (Mars in house ${manglikGroom.mars_house})` : ''}. ` : ''}
                  {manglikBride?.is_manglik ? `${personB.name || 'Person B'} has Manglik dosha${manglikBride.mars_house ? ` (Mars in house ${manglikBride.mars_house})` : ''}. ` : ''}
                  Special remedies recommended for marriage compatibility.
                </Text>
              </GlassCard>
            )}

            {/* Nadi Dosha */}
            {hasNadiDosha && (
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

            {/* Other doshas */}
            {doshas.filter((d: string) => !d.toLowerCase().includes('nadi') && !d.toLowerCase().includes('manglik')).length > 0 && (
              <GlassCard style={styles.doshaCardWarning}>
                <View style={styles.doshaHeader}>
                  <Ionicons name="alert-circle" size={18} color={colors.warning} />
                  <Text style={[styles.doshaTitle, { color: colors.warning }]}>Doshas Identified</Text>
                </View>
                <Text style={styles.doshaDesc}>
                  {doshas.filter((d: string) => !d.toLowerCase().includes('nadi') && !d.toLowerCase().includes('manglik')).join(', ')}
                </Text>
              </GlassCard>
            )}

            {/* Paid Report Upsell */}
            <View style={styles.upsellRow}>
              <Ionicons name="lock-closed" size={16} color={colors.accent} />
              <Text style={styles.upsellText}>Full compatibility report with AI analysis, yogas, and remedies available in paid version</Text>
            </View>

            <GradientButton title="Check Another Pair" variant="secondary" onPress={() => { setStep('personA'); setResult(null); setSelectedKoota(null); }} />
          </>
        )}
      </ScrollView>

      {/* Koota Explanation Modal */}
      <Modal visible={!!selectedKoota} transparent animationType="fade" onRequestClose={() => setSelectedKoota(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedKoota(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{selectedKoota?.koota_name}</Text>
            <View style={styles.modalScoreBadge}>
              <Text style={[styles.modalScoreText, { color: selectedKoota ? getScoreColor(selectedKoota.obtained_points ?? 0, selectedKoota.max_points || 1) : colors.text }]}>
                {Math.round(selectedKoota?.obtained_points ?? 0)}/{selectedKoota?.max_points}
              </Text>
            </View>
            {selectedKoota?.groom_value && selectedKoota?.bride_value && (
              <View style={styles.modalValues}>
                <Text style={styles.modalValueLabel}>{personA.name || 'Groom'}: <Text style={styles.modalValueText}>{selectedKoota.groom_value}</Text></Text>
                <Text style={styles.modalValueLabel}>{personB.name || 'Bride'}: <Text style={styles.modalValueText}>{selectedKoota.bride_value}</Text></Text>
              </View>
            )}
            <Text style={styles.modalDesc}>{selectedKoota?.description || ''}</Text>
            {selectedKoota?.has_dosha && selectedKoota?.dosha_name && (
              <View style={styles.modalDoshaRow}>
                <Ionicons name="warning" size={14} color={colors.warning} />
                <Text style={styles.modalDoshaText}>{selectedKoota.dosha_name}</Text>
              </View>
            )}
            <Text style={styles.modalVerdict}>
              {selectedKoota && (() => {
                const ratio = (selectedKoota.obtained_points ?? 0) / (selectedKoota.max_points || 1);
                if (ratio >= 1) return `Perfect ${selectedKoota.koota_name} match between both partners.`;
                if (ratio >= 0.75) return `Strong ${selectedKoota.koota_name} compatibility — minor differences only.`;
                if (ratio >= 0.5) return `Moderate ${selectedKoota.koota_name} compatibility — some adjustment needed.`;
                if (ratio > 0) return `Weak ${selectedKoota.koota_name} match — differences present in this area.`;
                return `No ${selectedKoota.koota_name} compatibility — remedies recommended.`;
              })()}
            </Text>
            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedKoota(null)}>
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
  title: { ...typography.styles.h3, color: colors.text, paddingTop: 4 },
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
  sectionTitle: { ...typography.styles.h3, color: colors.accent, textTransform: 'uppercase' as const, letterSpacing: 2, fontSize: 13, fontWeight: '700' },
  scoreCard: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  donutContainer: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutScore: { ...typography.styles.h1, color: colors.text, fontSize: 32, lineHeight: 38 },
  donutMax: { ...typography.styles.body, color: colors.muted, fontSize: 16, marginTop: -4 },
  matchText: { ...typography.styles.body, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  verdictDesc: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 12 },
  gunaGrid: { gap: 10 },
  gunaGridRow: { flexDirection: 'row', gap: 10 },
  gunaCell: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  gunaCellName: { ...typography.styles.caption, color: colors.muted, fontSize: 11, textAlign: 'center', marginBottom: 4 },
  gunaCellScore: { ...typography.styles.h3, fontSize: 18, fontWeight: '700' },
  doshaCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', borderWidth: 1 },
  doshaCardWarning: { backgroundColor: 'rgba(255,180,84,0.08)', borderColor: 'rgba(255,180,84,0.2)', borderWidth: 1 },
  doshaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  doshaTitle: { ...typography.styles.h3, color: colors.error, fontSize: 15, fontWeight: '700' },
  doshaDesc: { ...typography.styles.bodySmall, color: colors.muted, lineHeight: 20 },
  upsellRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, opacity: 0.7 },
  upsellText: { ...typography.styles.bodySmall, color: colors.muted, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.bg, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  modalTitle: { ...typography.styles.h2, color: colors.text, fontSize: 20, textAlign: 'center' },
  modalScoreBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  modalScoreText: { ...typography.styles.h3, fontSize: 22, fontWeight: '700' },
  modalValues: { gap: 4, alignSelf: 'stretch', paddingHorizontal: 8 },
  modalValueLabel: { ...typography.styles.caption, color: colors.muted, fontSize: 12 },
  modalValueText: { color: colors.text, fontWeight: '600' },
  modalDesc: { ...typography.styles.body, color: colors.muted, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  modalDoshaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,180,84,0.1)' },
  modalDoshaText: { ...typography.styles.caption, color: colors.warning, fontWeight: '600' },
  modalVerdict: { ...typography.styles.body, color: colors.text, textAlign: 'center', fontWeight: '600', fontSize: 14, fontStyle: 'italic' as const },
  modalCloseBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8, backgroundColor: colors.accent },
  modalCloseBtnText: { ...typography.styles.label, color: '#fff', fontWeight: '600' },
});
