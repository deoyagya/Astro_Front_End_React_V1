import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { api } from '@api/client';
import { REPORTS } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

const REPORT_ICONS: Record<string, string> = {
  kundli: 'planet',
  life_reading: 'book',
  career: 'briefcase',
  love: 'heart',
  education: 'school',
  health: 'leaf',
  spiritual: 'sparkles',
  family: 'home',
};

interface ReportFile {
  id: string;
  report_type: string;
  display_name: string;
  generated_at: string;
  file_size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(REPORTS.MY);
      setReports(Array.isArray(data) ? data : data?.reports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ReportFile) => {
    setDownloading(report.id);
    try {
      const token = await api.getToken();
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const url = `${baseUrl}${REPORTS.DOWNLOAD(report.id)}`;
      const filename = report.display_name.replace(/\s+/g, '_') + '.pdf';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Share/open the downloaded file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: report.display_name,
        });
      } else {
        Alert.alert('Downloaded', `Report saved to ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download the report');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingSpinner message="Loading your reports..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>Download your purchased Vedic analysis reports</Text>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Empty state */}
        {reports.length === 0 && !error && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyText}>
              Order your first Vedic analysis report to see it here
            </Text>
            <GradientButton
              title="Browse Reports"
              onPress={() => router.push('/(auth)/(tabs)/reports' as any)}
            />
          </GlassCard>
        )}

        {/* Report list */}
        {reports.map((report) => {
          const iconName = REPORT_ICONS[report.report_type] || 'document-text';
          const isDownloading = downloading === report.id;

          return (
            <GlassCard key={report.id} style={styles.reportCard}>
              <View style={styles.reportRow}>
                <View style={styles.iconBox}>
                  <Ionicons name={iconName as any} size={22} color={colors.accent} />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName} numberOfLines={2}>
                    {report.display_name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                    <Text style={styles.metaText}>{formatDate(report.generated_at)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="document-outline" size={12} color={colors.muted} />
                    <Text style={styles.metaText}>{formatFileSize(report.file_size)}</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.downloadBtn, isDownloading && styles.downloadBtnDisabled]}
                  onPress={() => handleDownload(report)}
                  disabled={isDownloading}
                >
                  <Ionicons
                    name={isDownloading ? 'hourglass' : 'download-outline'}
                    size={18}
                    color={isDownloading ? colors.muted : colors.accent}
                  />
                </Pressable>
              </View>
            </GlassCard>
          );
        })}

        {/* Order more */}
        {reports.length > 0 && (
          <GradientButton
            title="Order More Reports"
            variant="secondary"
            onPress={() => router.push('/(auth)/(tabs)/reports' as any)}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  title: { ...typography.styles.h3, color: colors.text, paddingTop: 8 },
  subtitle: { ...typography.styles.caption, color: colors.muted, marginBottom: 4 },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptyText: { ...typography.styles.body, color: colors.muted, textAlign: 'center' },
  reportCard: {},
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(123,91,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  reportInfo: { flex: 1, gap: 3 },
  reportName: { ...typography.styles.label, color: colors.text, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.styles.caption, color: colors.muted },
  downloadBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(123,91,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  downloadBtnDisabled: { opacity: 0.5 },
});
