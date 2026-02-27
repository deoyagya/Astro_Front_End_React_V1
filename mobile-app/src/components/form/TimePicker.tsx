import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface TimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0-59
const AMPM_OPTIONS = ['AM', 'PM'];
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function WheelColumn({
  data,
  selected,
  onSelect,
  formatItem,
}: {
  data: (number | string)[];
  selected: number | string;
  onSelect: (val: number | string) => void;
  formatItem?: (val: number | string) => string;
}) {
  const listRef = useRef<FlatList>(null);
  const currentIndex = data.indexOf(selected);

  // Pad with empty items so the selected item is centered
  const padding = Math.floor(VISIBLE_ITEMS / 2);
  const paddedData: (number | string | null)[] = [
    ...Array(padding).fill(null),
    ...data,
    ...Array(padding).fill(null),
  ];

  useEffect(() => {
    if (listRef.current && currentIndex >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: currentIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const offset = e.nativeEvent.contentOffset.y;
      const index = Math.round(offset / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      onSelect(data[clamped]);
    },
    [data, onSelect]
  );

  return (
    <View style={wStyles.column}>
      <FlatList
        ref={listRef}
        data={paddedData}
        keyExtractor={(_, i) => `w-${i}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item }) => {
          if (item === null) {
            return <View style={wStyles.item} />;
          }
          const isSelected = item === selected;
          const display = formatItem ? formatItem(item) : String(item);
          return (
            <View style={wStyles.item}>
              <Text style={[wStyles.itemText, isSelected && wStyles.itemTextSelected]}>
                {display}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const wStyles = StyleSheet.create({
  column: {
    height: PICKER_HEIGHT,
    flex: 1,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '400',
  },
  itemTextSelected: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 22,
  },
});

export function TimePicker({ label, value, onChange, error }: TimePickerProps) {
  const [show, setShow] = useState(false);

  // Extract from value
  const h24 = value.getHours();
  const displayHour = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const displayMin = value.getMinutes();
  const displayAmPm = h24 >= 12 ? 'PM' : 'AM';

  const [selHour, setSelHour] = useState(displayHour);
  const [selMin, setSelMin] = useState(displayMin);
  const [selAmPm, setSelAmPm] = useState(displayAmPm);

  const openPicker = () => {
    const h = value.getHours();
    setSelHour(h === 0 ? 12 : h > 12 ? h - 12 : h);
    setSelMin(value.getMinutes());
    setSelAmPm(h >= 12 ? 'PM' : 'AM');
    setShow(true);
  };

  const handleDone = () => {
    let h24val = selHour;
    if (selAmPm === 'AM' && h24val === 12) h24val = 0;
    else if (selAmPm === 'PM' && h24val !== 12) h24val += 12;

    const newDate = new Date(value);
    newDate.setHours(h24val);
    newDate.setMinutes(selMin);
    onChange(newDate);
    setShow(false);
  };

  const handleCancel = () => setShow(false);

  const formatted = value.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={[styles.trigger, !!error && styles.triggerError]}
      >
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <Text style={styles.value}>{formatted}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={show} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={handleCancel} hitSlop={12}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={handleDone} hitSlop={12}>
                <Text style={styles.doneBtn}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.pickerContainer}>
              {/* Selection highlight bar */}
              <View style={styles.selectionBar} />
              <View style={styles.wheelRow}>
                <WheelColumn
                  data={HOURS}
                  selected={selHour}
                  onSelect={(v) => setSelHour(v as number)}
                  formatItem={(v) => String(v)}
                />
                <Text style={styles.colon}>:</Text>
                <WheelColumn
                  data={MINUTES}
                  selected={selMin}
                  onSelect={(v) => setSelMin(v as number)}
                  formatItem={(v) => String(v).padStart(2, '0')}
                />
                <WheelColumn
                  data={AMPM_OPTIONS}
                  selected={selAmPm}
                  onSelect={(v) => setSelAmPm(v as string)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { ...typography.styles.label, color: colors.muted },
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
  value: { ...typography.styles.body, color: colors.text },
  error: { ...typography.styles.caption, color: colors.error },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  cancelBtn: { ...typography.styles.body, color: colors.muted },
  doneBtn: { ...typography.styles.body, color: colors.accent, fontWeight: '600' },
  pickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 10 + ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(123,91,255,0.12)',
    borderRadius: 10,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colon: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
});
