import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KindLabel, StaffStatusPill } from '@/components/admin/Labels';
import { adminColors } from '@/theme/adminTokens';

import { bookingItemText, customerLabel, rowTimeText, staffStatus } from '../derive';
import type { StaffBookingRow } from '../types';

type Props = {
  row: StaffBookingRow;
  now: Date;
  /** 右端：時間（A-20）か数量（A-11 詳細） */
  right: 'time' | 'quantity';
  /** 2 行目：種類＋内容（A-20・A-01）か金額（A-11 詳細） */
  second: 'item' | 'amount';
  /** A-01 の全店舗検索では店舗名も出す */
  showStore?: boolean;
  amount?: string;
  onPress: () => void;
};

/**
 * 予約の行：番号（24/800）／氏名＋右端／2 行目＋状態ピル。
 * 未完了のピルは出さない（初期値なので全行に付いてしまう）。完了・キャンセル・期限切れだけ
 */
export function BookingRow({ row, now, right, second, showStore, amount, onPress }: Props) {
  const status = staffStatus(row, now);
  const deleted = row.customerDeleted || !row.customerName;
  const expired = status.label === '期限切れ';
  return (
    <Pressable
      testID={`staff-booking-${row.number}`}
      accessibilityRole="button"
      accessibilityLabel={`番号 ${row.number} ${customerLabel(row)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, expired && styles.expired, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.number}>{row.number}</Text>
      <View style={styles.main}>
        <View style={styles.top}>
          <Text style={[styles.name, deleted && styles.deleted]} numberOfLines={1}>
            {customerLabel(row)}
          </Text>
          <Text style={styles.right}>
            {right === 'time'
              ? rowTimeText(row)
              : `${row.quantity}${row.kind === 'product' ? row.listingUnit : '名'}`}
          </Text>
        </View>
        <View style={styles.second}>
          {second === 'item' ? (
            <>
              <KindLabel kind={row.kind} />
              <Text style={styles.secondText} numberOfLines={1}>
                {showStore ? `${row.storeName}・` : ''}
                {bookingItemText(row)}
              </Text>
            </>
          ) : (
            <Text style={styles.secondText}>{amount}</Text>
          )}
          {status.tone !== 'open' ? (
            <StaffStatusPill label={status.label} tone={status.tone} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  expired: { backgroundColor: adminColors.expiredRow },
  number: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.4,
    minWidth: 66,
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  main: { flex: 1, gap: 5, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { fontSize: 16, fontWeight: '700', color: adminColors.text, flexShrink: 1 },
  deleted: { color: adminColors.textWeak, fontStyle: 'italic' },
  right: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  second: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondText: { fontSize: 13, lineHeight: 18, color: adminColors.textSub, flexShrink: 1 },
});
