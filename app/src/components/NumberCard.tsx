import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '@/theme/tokens';

type Props = {
  label: string;
  number: string;
  /** 完了画面は影を強く、予約詳細はカードの影 */
  elevated?: boolean;
  children?: ReactNode;
};

/** 予約番号の白い箱。利用者・スタッフの画面で同じ見た目にする（design 06） */
export function NumberCard({ label, number, elevated = false, children }: Props) {
  return (
    <View style={[styles.card, elevated ? shadow.done : shadow.card]}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={styles.number}
        testID="booking-number"
        accessibilityLabel={`${label} ${number.split('').join(' ')}`}
      >
        {number}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 4,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.textWeak },
  number: {
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: 8.4,
    lineHeight: 68,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    // 字間の分だけ右にずれるので左にも同じだけ足して中央に見せる
    paddingLeft: 8.4,
  },
});
