import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { formatDateTimeSlash } from '@/lib/format';
import { adminColors } from '@/theme/adminTokens';

import { Field } from './Fields';

export type DateTimeFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  required?: boolean;
  hint?: string;
  error?: string | null;
  outlined?: boolean;
  testID?: string;
};

/**
 * 日時の入力（ネイティブ）。iOS はシートにスピナー、Android は日付→時刻の 2 段階のダイアログ
 * 端末の時刻と関係なく日本時間で選ぶ（timeZoneName）
 */
export function DateTimeField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  outlined,
  testID,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const openPicker = () => {
    const initial = value ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        timeZoneName: 'Asia/Tokyo',
        onValueChange: (_e, date) => {
          DateTimePickerAndroid.open({
            value: date,
            mode: 'time',
            is24Hour: true,
            timeZoneName: 'Asia/Tokyo',
            onValueChange: (_e2, dateTime) => onChange(dateTime),
          });
        },
      });
      return;
    }
    setDraft(initial);
    setOpen(true);
  };

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openPicker}
        style={[styles.box, outlined && styles.outlined, error ? styles.boxError : null]}
      >
        <Text style={[styles.text, !value && { color: adminColors.placeholder2 }]}>
          {value ? formatDateTimeSlash(value) : '日時を選ぶ'}
        </Text>
        <Icon name="calendar" size={20} color={adminColors.textWeak} strokeWidth={1.8} />
      </Pressable>
      {Platform.OS === 'ios' ? (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          {(close) => (
            <View style={styles.sheet}>
              <DateTimePicker
                value={draft}
                mode="datetime"
                display="spinner"
                locale="ja-JP"
                timeZoneName="Asia/Tokyo"
                onValueChange={(_e, date) => setDraft(date)}
              />
              <PrimaryButton
                label="決定"
                onPress={() => close(() => onChange(draft))}
                height={54}
                labelSize={17}
              />
            </View>
          )}
        </BottomSheet>
      ) : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 52,
    borderRadius: 12,
    backgroundColor: adminColors.fill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  outlined: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.accent,
  },
  boxError: { borderWidth: 2, borderColor: adminColors.danger },
  text: { fontSize: 16, color: adminColors.text },
  sheet: { gap: 12 },
});
