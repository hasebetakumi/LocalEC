import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { adminColors } from '@/theme/adminTokens';

export type SelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: readonly SelectOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
  testID?: string;
};

/** 単一選択のシート（絞り込み・カテゴリ・単位など）。選んだ行に ✓ */
export function SelectSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  testID,
}: Props<T>) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} testID={testID}>
      {(close) => (
        <View accessibilityRole="radiogroup">
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                testID={`option-${o.value}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => close(() => onSelect(o.value))}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.border,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.label, selected && styles.selected]}>{o.label}</Text>
                {selected ? (
                  <Icon name="checkMark" size={20} color={adminColors.accent} strokeWidth={2.4} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

/** 絞り込みのドロップダウンチップ（高さ 36）。初期値以外は黒塗り */
export function AdminFilterChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipOn : styles.chipOff,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.chipText, active && { color: adminColors.white }]}>{label}</Text>
      <Icon
        name="chevronDown"
        size={14}
        color={active ? adminColors.white : adminColors.text}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  border: { borderTopWidth: 1, borderTopColor: adminColors.divider },
  label: { fontSize: 16, color: adminColors.text },
  selected: { fontWeight: '800' },
  chip: {
    height: 36,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipOn: { backgroundColor: adminColors.text },
  chipOff: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.border },
  chipText: { fontSize: 13.5, fontWeight: '700', color: adminColors.text },
});
