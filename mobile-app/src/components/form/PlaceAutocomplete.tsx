import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@hooks/useDebounce';
import { api } from '@api/client';
import { LOCATION } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface Place {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

interface PlaceAutocompleteProps {
  label: string;
  value: string;
  onSelect: (place: Place) => void;
  error?: string;
}

export function PlaceAutocomplete({
  label,
  value,
  onSelect,
  error,
}: PlaceAutocompleteProps) {
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    api
      .get(`${LOCATION.SEARCH}?query=${encodeURIComponent(debouncedQuery)}`)
      .then((data: any) => {
        // Handle both array response and { results: [...] } response
        const places = Array.isArray(data) ? data : data?.results || [];
        setResults(
          places.map((p: any) => ({
            name: p.display_name || p.name,
            lat: parseFloat(p.lat),
            lon: parseFloat(p.lon),
            country: p.country,
            state: p.state,
          }))
        );
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const openModal = () => {
    setQuery('');
    setResults([]);
    setShowModal(true);
    // Focus the input after modal opens
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSelect = (place: Place) => {
    Keyboard.dismiss();
    setShowModal(false);
    onSelect(place);
  };

  const closeModal = () => {
    Keyboard.dismiss();
    setShowModal(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openModal}
        style={[styles.trigger, !!error && styles.triggerError]}
      >
        <Ionicons name="location-outline" size={18} color={colors.muted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || 'Search city...'}
        </Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={closeModal} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search for a city..."
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {/* Results */}
          <FlatList
            data={results}
            keyExtractor={(item, i) => `${item.name}-${item.lat}-${i}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !loading && query.length >= 3 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={40} color={colors.border} />
                  <Text style={styles.emptyText}>No places found</Text>
                  <Text style={styles.emptyHint}>Try a different spelling</Text>
                </View>
              ) : !loading && query.length < 3 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="globe-outline" size={40} color={colors.border} />
                  <Text style={styles.emptyText}>Type to search</Text>
                  <Text style={styles.emptyHint}>Enter at least 3 characters</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && styles.resultItemPressed,
                ]}
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="location" size={18} color={colors.accent} />
                </View>
                <View style={styles.resultText}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {(item.state || item.country) && (
                    <Text style={styles.resultDetail} numberOfLines={1}>
                      {[item.state, item.country].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.styles.label, color: colors.muted, marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerError: { borderColor: colors.error },
  triggerText: { ...typography.styles.body, color: colors.text, flex: 1 },
  placeholder: { color: colors.muted },
  error: { ...typography.styles.caption, color: colors.error, marginTop: 4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text,
    paddingVertical: 0,
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  loadingText: { ...typography.styles.bodySmall, color: colors.muted },

  // Results
  listContent: { paddingBottom: 40 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42,56,86,0.2)',
  },
  resultItemPressed: { backgroundColor: 'rgba(123,91,255,0.06)' },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(123,91,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { flex: 1 },
  resultName: { ...typography.styles.body, color: colors.text },
  resultDetail: { ...typography.styles.caption, color: colors.muted, marginTop: 2 },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: { ...typography.styles.body, color: colors.muted },
  emptyHint: { ...typography.styles.caption, color: colors.border },
});
