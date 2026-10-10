import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string;
  error?: string | null;
  height?: number;
};

/** 入力欄：塗り・枠なし。ラベルは上に常に表示、エラーは下に赤字 */
export function TextField({ label, hint, error, height = 52, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, { height }]}
        {...input}
      />
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

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textWeak, paddingLeft: 4 },
  input: {
    borderRadius: radius.input,
    backgroundColor: colors.fill,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  hint: { fontSize: 12.5, lineHeight: 19, color: colors.textWeak, paddingLeft: 4 },
  error: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.danger,
    paddingLeft: 4,
    fontWeight: '700',
  },
});
