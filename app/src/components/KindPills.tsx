import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { StatusTone } from '@/features/bookings/derive';
import { colors, kindColors, radius } from '@/theme/tokens';

type Kind = 'product' | 'event' | 'job';
const KIND_LABEL: Record<Kind, string> = { product: '商品', event: 'イベント', job: '求人' };

/** 種類ラベル（写真の上に置く塗りのピル） */
export function KindPill({
  kind,
  size = 'md',
  style,
}: {
  kind: Kind;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.kind,
        size === 'sm' && styles.kindSm,
        { backgroundColor: kindColors[kind].main },
        style,
      ]}
    >
      <Text style={[styles.kindText, size === 'sm' && styles.kindTextSm]}>{KIND_LABEL[kind]}</Text>
    </View>
  );
}

/** 予約の状態ピル（色＝種類、キャンセル・期限切れは灰） */
export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const c =
    tone === 'gray'
      ? { bg: colors.grayPill, fg: colors.grayPillText }
      : { bg: kindColors[tone].light, fg: kindColors[tone].text };
  return (
    <View style={[styles.status, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kind: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  kindSm: { paddingVertical: 3, paddingHorizontal: 7 },
  kindText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  kindTextSm: { fontSize: 10.5 },
  status: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
});
