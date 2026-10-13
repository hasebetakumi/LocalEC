import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { DisplayStatus } from '@/features/listings/types';
import { LISTING_STATUS_LABEL, type StaffStatusTone } from '@/features/staff/derive';
import type { ListingKind } from '@/features/staff/types';
import { kindLabelColors, listingStatusColors, staffStatusColors } from '@/theme/adminTokens';

/** 種類ラベル（角丸 6） */
export function KindLabel({
  kind,
  size = 'sm',
  style,
}: {
  kind: ListingKind;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const c = kindLabelColors[kind];
  return (
    <View style={[styles.kind, size === 'md' && styles.kindMd, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.kindText, size === 'md' && styles.kindTextMd, { color: c.fg }]}>
        {c.label}
      </Text>
    </View>
  );
}

/** 掲載の状態ピル（公開・公開予定・下書き・終了） */
export function ListingStatusPill({ status }: { status: DisplayStatus }) {
  const c = listingStatusColors[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{LISTING_STATUS_LABEL[status]}</Text>
    </View>
  );
}

/** 予約の状態ピル（未完了＝橙、完了＝緑、キャンセル・期限切れ＝灰） */
export function StaffStatusPill({
  label,
  tone,
  size = 'sm',
}: {
  label: string;
  tone: StaffStatusTone;
  size?: 'sm' | 'md';
}) {
  const c = staffStatusColors[tone];
  return (
    <View style={[styles.pill, size === 'md' && styles.pillMd, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, size === 'md' && styles.pillTextMd, { color: c.fg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kind: { alignSelf: 'flex-start', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 },
  kindMd: { paddingVertical: 3, paddingHorizontal: 8 },
  kindText: { fontSize: 11.5, fontWeight: '700' },
  kindTextMd: { fontSize: 12 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  pillMd: { paddingHorizontal: 10 },
  pillText: { fontSize: 12, fontWeight: '700' },
  pillTextMd: { fontSize: 13 },
});
