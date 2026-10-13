import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '@/theme/tokens';

import { Icon } from './Icon';

/** 単一選択のチップ（U-13 のカテゴリ）。選択中は黒塗り */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

/** 一覧上部の絞り込みチップ「カテゴリ：すべて ▾」。既定以外なら黒塗り */
export function FilterChip({
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
        styles.filter,
        active ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.label, styles.filterLabel, active && styles.labelSelected]}>
        {label}
      </Text>
      <Icon
        name="chevronDown"
        size={14}
        color={active ? colors.white : colors.text}
        strokeWidth={2.4}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filter: { flexDirection: 'row', gap: 4, paddingHorizontal: 14 },
  selected: { backgroundColor: colors.text },
  unselected: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.lineStrong },
  label: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  filterLabel: { fontSize: 14 },
  labelSelected: { color: colors.white },
});
