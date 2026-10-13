import { StyleSheet, View } from 'react-native';

import { fromJstInputValue, toJstInputValue } from '@/lib/format';
import { adminColors } from '@/theme/adminTokens';

import type { DateTimeFieldProps } from './DateTimeField';
import { Field } from './Fields';

/**
 * 日時の入力（Web）。公式ピッカーは Web 非対応なので、ブラウザの datetime-local を使う。
 * 値は日本時間として読み書きする
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
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <View style={[styles.box, outlined && styles.outlined, error ? styles.boxError : null]}>
        <input
          type="datetime-local"
          aria-label={label}
          data-testid={testID}
          value={value ? toJstInputValue(value) : ''}
          onChange={(e) => {
            const next = fromJstInputValue(e.currentTarget.value);
            if (next) onChange(next);
          }}
          style={{
            flex: 1,
            height: 50,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 16,
            color: adminColors.text,
            fontFamily: 'inherit',
          }}
        />
      </View>
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
    paddingHorizontal: 14,
  },
  outlined: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.accent,
  },
  boxError: { borderWidth: 2, borderColor: adminColors.danger },
});
