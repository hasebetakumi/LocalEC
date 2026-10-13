import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/Icon';
import { adminColors } from '@/theme/adminTokens';

import { SelectSheet, type SelectOption } from './SelectSheet';

type LabelProps = { label: string; required?: boolean; hint?: string; error?: string | null };

/** ラベル（13/700）＋「必須」＋ 中身 ＋ 補足またはエラー（赤字） */
export function Field({
  label,
  required,
  hint,
  error,
  children,
}: LabelProps & { children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> 必須</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

type TextProps = LabelProps &
  Omit<TextInputProps, 'style'> & {
    /** 単位（円・食・名）を右端に */
    unit?: string;
    multiline?: boolean;
    minHeight?: number;
    /** A-12 の変更できる欄（白地に線） */
    outlined?: boolean;
  };

/** 塗りの入力欄（高さ 52、角丸 12） */
export function AdminTextField({
  label,
  required,
  hint,
  error,
  unit,
  multiline,
  minHeight = 96,
  outlined,
  ...input
}: TextProps) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <View
        style={[
          styles.box,
          multiline && {
            height: undefined,
            minHeight,
            alignItems: 'flex-start',
            paddingVertical: 12,
          },
          outlined && styles.outlined,
          error ? styles.boxError : null,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={adminColors.placeholder2}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline]}
          {...input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </Field>
  );
}

/** 選択欄（押すと選択シート） */
export function SelectField<T extends string>({
  label,
  required,
  hint,
  error,
  options,
  value,
  placeholder = '選んでください',
  onChange,
  testID,
}: LabelProps & {
  options: readonly SelectOption<T>[];
  value: T | null;
  placeholder?: string;
  onChange: (value: T) => void;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[styles.box, error ? styles.boxError : null]}
      >
        <Text
          style={[styles.input, styles.selectText, !current && { color: adminColors.placeholder2 }]}
        >
          {current?.label ?? placeholder}
        </Text>
        <Icon name="chevronDown" size={18} color={adminColors.textWeak} strokeWidth={2.2} />
      </Pressable>
      <SelectSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </Field>
  );
}

/** 2 択の切り替えピル（キャンセル できる／できない） */
export function ToggleChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`toggle-${o.value}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
          >
            <Text style={[styles.chipText, on && { color: adminColors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 複数選択チップ（支払い方法）。選択＝黒塗り＋✓ */
export function MultiSelectChips<T extends string>({
  options,
  values,
  onChange,
}: {
  options: readonly SelectOption<T>[];
  values: readonly T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <Pressable
            key={o.value}
            testID={`multi-${o.value}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() =>
              onChange(
                on
                  ? values.filter((v) => v !== o.value)
                  : options.map((x) => x.value).filter((v) => v === o.value || values.includes(v)),
              )
            }
            style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
          >
            <Text style={[styles.chipText, on && { color: adminColors.white }]}>
              {on ? '✓ ' : ''}
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** フォームの区切り見出し（基本情報・受け取り・予約 など） */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** チェックボックス（公開時に新着通知を送る） */
export function CheckRow({
  label,
  hint,
  checked,
  onChange,
  testID,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.check}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? (
          <Icon name="checkMark" size={16} color={adminColors.white} strokeWidth={2.6} />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.checkLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: adminColors.textSub },
  required: { color: adminColors.danger, fontSize: 12 },
  hint: { fontSize: 12.5, lineHeight: 19, color: adminColors.textWeak },
  error: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: adminColors.danger },
  box: {
    height: 52,
    borderRadius: 12,
    backgroundColor: adminColors.fill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  outlined: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.accent,
  },
  boxError: { borderWidth: 2, borderColor: adminColors.danger },
  // Web のフォーカス枠は欄の枠（塗り・線）で示すので消す
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: adminColors.text,
    minHeight: 24,
    outlineWidth: 0,
  },
  inputMultiline: { lineHeight: 25.6, textAlignVertical: 'top' },
  selectText: { lineHeight: 22 },
  unit: { fontSize: 16, color: adminColors.textWeak },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: adminColors.text },
  chipOff: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.border },
  chipText: { fontSize: 14.5, fontWeight: '700', color: adminColors.text },
  section: { gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: adminColors.text, marginTop: 6 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: adminColors.fill,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: adminColors.accent, borderColor: adminColors.accent },
  checkLabel: { fontSize: 15, fontWeight: '700', color: adminColors.text },
});
