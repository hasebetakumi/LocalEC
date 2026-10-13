import { StyleSheet, Text, View } from 'react-native';

import { formatYen } from '@/lib/format';
import { colors } from '@/theme/tokens';

type Props = {
  price: number;
  originalPrice?: number | null;
  /** 価格の文字サイズ（24〜34） */
  size?: number;
  /** 売り切れ・締切後は灰色 */
  muted?: boolean;
  /** 元値と価格を縦に積む（下部固定バー） */
  stacked?: boolean;
  /** 「円」を小さく付ける */
  yenUnit?: boolean;
  wasSize?: number;
};

/** 元値（取り消し線）＋割引後価格 */
export function Price({
  price,
  originalPrice,
  size = 24,
  muted = false,
  stacked = false,
  yenUnit = false,
  wasSize = 13,
}: Props) {
  const was =
    originalPrice != null ? (
      <Text
        style={[styles.was, { fontSize: wasSize }]}
        accessibilityLabel={`元値 ${formatYen(originalPrice)}円`}
      >
        {formatYen(originalPrice)}円
      </Text>
    ) : null;
  const main = (
    <Text
      style={[styles.price, { fontSize: size, color: muted ? colors.placeholder : colors.accent }]}
    >
      {formatYen(price)}
      {yenUnit ? <Text style={{ fontSize: Math.round(size * 0.55) }}>円</Text> : '円'}
    </Text>
  );
  return (
    <View style={stacked ? styles.stacked : styles.row}>
      {was}
      {main}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stacked: { flexDirection: 'column' },
  was: { color: colors.placeholder, textDecorationLine: 'line-through' },
  price: { fontWeight: '900', letterSpacing: -0.2 },
});
