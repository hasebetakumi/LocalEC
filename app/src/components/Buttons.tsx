import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** 主ボタン：塗り・ピル・高さ 58。無効は灰色で文言も「〜できません」に変える（呼び出し側） */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  testID,
  height = 58,
  labelSize = 18,
  inverted = false,
  labelColor,
}: ButtonProps & {
  height?: number;
  labelSize?: number;
  /** アクセント色の地の上で使う白いピル（予約完了画面） */
  inverted?: boolean;
  /** inverted のときの文字色（既定はアクセント。完了画面は種類の色） */
  labelColor?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { height },
        disabled ? styles.primaryDisabled : inverted ? styles.inverted : styles.primary,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.primaryLabel,
          { fontSize: labelSize },
          inverted && styles.invertedLabel,
          inverted && labelColor ? { color: labelColor } : null,
          disabled && styles.primaryLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** 副ボタン：薄い塗り・枠なし */
export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
  testID,
  height = 56,
}: ButtonProps & { height?: number }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { height },
        styles.secondary,
        pressed && styles.pressed,
        disabled && styles.dim,
        style,
      ]}
    >
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** 外部リンク（地図アプリで開く など）：淡いテラコッタ */
export function LinkButton({ label, onPress, style, testID }: ButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles.link, pressed && styles.pressed, style]}
    >
      <Text style={styles.linkLabel}>{label}</Text>
    </Pressable>
  );
}

/** 文字だけのボタン（ログインせずに見る など） */
export function TextButton({
  label,
  onPress,
  color = colors.textWeak,
  style,
  testID,
}: ButtonProps & { color?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.text, pressed && styles.pressed, style]}
    >
      <Text style={[styles.textLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressed: { opacity: 0.9 },
  dim: { opacity: 0.5 },
  primary: { backgroundColor: colors.accent },
  primaryDisabled: { backgroundColor: colors.disabledBg },
  inverted: { backgroundColor: colors.white },
  invertedLabel: { color: colors.accent },
  primaryLabel: { color: colors.white, fontSize: 18, fontWeight: '800' },
  primaryLabelDisabled: { color: colors.disabledText, fontSize: 17, fontWeight: '700' },
  secondary: { backgroundColor: colors.fill },
  secondaryLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  link: { height: 46, backgroundColor: colors.accentLight },
  linkLabel: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  text: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textLabel: { fontSize: 14, fontWeight: '700' },
});
