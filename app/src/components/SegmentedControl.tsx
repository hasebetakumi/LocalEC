import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** 切り替えピル（U-22 の中／履歴、U-11 のすべて／イベント／求人） */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.item, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    padding: 4,
  },
  item: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.text },
  label: { fontSize: 14.5, fontWeight: '700', color: colors.textSub },
  labelSelected: { color: colors.white },
});
