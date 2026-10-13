import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';

import { Icon } from './Icon';

type Props = {
  value: number;
  min?: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
};

/** 数量の＋−（直径 56 の丸）。上限・下限でボタンを無効にする */
export function Stepper({ value, min = 1, max, unit, onChange }: Props) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <View style={styles.wrap}>
      <Pressable
        testID="stepper-dec"
        accessibilityRole="button"
        accessibilityLabel="減らす"
        accessibilityState={{ disabled: !canDec }}
        disabled={!canDec}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [
          styles.btn,
          styles.dec,
          !canDec && styles.decDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Icon
          name="minus"
          size={26}
          color={canDec ? colors.text : colors.placeholder}
          strokeWidth={2.2}
        />
      </Pressable>
      <View style={styles.valueBox} accessibilityLiveRegion="polite">
        <Text style={styles.value} testID="stepper-value">
          {value}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
      <Pressable
        testID="stepper-inc"
        accessibilityRole="button"
        accessibilityLabel="増やす"
        accessibilityState={{ disabled: !canInc }}
        disabled={!canInc}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [
          styles.btn,
          canInc ? styles.inc : styles.incDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Icon
          name="plus"
          size={26}
          color={canInc ? colors.white : colors.disabledText}
          strokeWidth={2.2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 6,
  },
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  dec: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  decDisabled: { shadowOpacity: 0, elevation: 0, backgroundColor: colors.disabledBg },
  inc: { backgroundColor: colors.accent },
  incDisabled: { backgroundColor: colors.disabledBg },
  pressed: { opacity: 0.9 },
  valueBox: { minWidth: 72, alignItems: 'center' },
  value: { fontSize: 32, fontWeight: '900', color: colors.text },
  unit: { fontSize: 15, fontWeight: '700' },
});
