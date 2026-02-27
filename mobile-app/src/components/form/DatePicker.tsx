import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Platform, Modal, StyleSheet } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const latestRef = useRef(value);

  const handleChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selectedDate) onChange(selectedDate);
    } else {
      if (selectedDate) {
        latestRef.current = selectedDate;
        setTempDate(selectedDate);
      }
    }
  };

  const handleDone = () => {
    onChange(latestRef.current);
    setShow(false);
  };

  const handleCancel = () => {
    latestRef.current = value;
    setTempDate(value);
    setShow(false);
  };

  const openPicker = () => {
    latestRef.current = value;
    setTempDate(value);
    setShow(true);
  };

  const formatted = value.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={[styles.trigger, !!error && styles.triggerError]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
        <Text style={styles.value}>{formatted}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {Platform.OS === 'ios' ? (
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
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={new Date()}
                themeVariant="dark"
                textColor={colors.text}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            onChange={handleChange}
            maximumDate={new Date()}
            themeVariant="dark"
          />
        )
      )}
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
  picker: { height: 216 },
});
