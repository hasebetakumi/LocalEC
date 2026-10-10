import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { LoadError, Loading } from '@/components/LoadState';
import { ConfirmSheet } from '@/components/admin/ConfirmSheet';
import { StaffStatusPill } from '@/components/admin/Labels';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { AdminBand } from '@/components/admin/WarningBox';
import { paymentMethodsText } from '@/features/listings/master';
import { completeBooking, revertBooking, staffCancelBooking } from '@/features/staff/api';
import {
  amountText,
  bookingItemText,
  customerLabel,
  doneActionLabel,
  revertActionLabel,
  scheduleFullText,
  staffEffectiveStatus,
  staffStatus,
} from '@/features/staff/derive';
import { useStaffBooking, useStaffMutation } from '@/features/staff/hooks';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import type { StaffBookingRow } from '@/features/staff/types';
import { useNow } from '@/hooks/useNow';
import { formatDateTimeJa, formatPhone } from '@/lib/format';
import { adminColors, adminShadow } from '@/theme/adminTokens';

const ITEM_LABEL = { product: '商品', event: 'イベント', job: '求人' } as const;
const CANCEL_TARGET = { product: '予約', event: '申し込み', job: '応募' } as const;

/** A-21 受け取り処理 */
export default function StaffBookingScreen() {
  const { storeId, bookingId } = useLocalSearchParams<{ storeId: string; bookingId: string }>();
  const booking = useStaffBooking(bookingId);

  if (booking.isPending || booking.isError || !booking.data) {
    return (
      <StaffScreen>
        <StaffNavBar title="予約・申し込み" fallback={`/staff/${storeId}/bookings`} />
        {booking.isPending ? (
          <Loading />
        ) : booking.isError ? (
          <LoadError onRetry={() => void booking.refetch()} />
        ) : (
          <EmptyState icon="calendarCheck" title="この予約は見つかりませんでした" />
        )}
      </StaffScreen>
    );
  }
  return <Process row={booking.data} onRefetch={() => void booking.refetch()} />;
}

function goBack(storeId: string) {
  if (router.canGoBack()) router.back();
  else router.replace({ pathname: '/staff/[storeId]/bookings', params: { storeId } });
}

function Process({ row: r, onRefetch }: { row: StaffBookingRow; onRefetch: () => void }) {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const [confirmCancel, setConfirmCancel] = useState(false);
  // PC は番号の見間違いを防ぐため確認を挟む。スマホは戻せるので 1 タップ（design 03・04）
  const { isWide } = useStaffLayout();
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = useStaffMutation(completeBooking);
  const revert = useStaffMutation(revertBooking);
  const cancel = useStaffMutation(staffCancelBooking);
  const effective = staffEffectiveStatus(r, now);
  const status = staffStatus(r, now);
  const deleted = r.customerDeleted || !r.customerName;
  const busy = complete.isPending || revert.isPending || cancel.isPending;

  const run = async (fn: () => Promise<unknown>, after: 'back' | 'stay') => {
    setError(null);
    try {
      await fn();
      if (after === 'back') goBack(r.storeId);
      else onRefetch();
    } catch {
      setError('状態が変わっています。画面を更新してください。');
      onRefetch();
    }
  };

  const payment =
    r.kind === 'job'
      ? { label: '報酬', main: amountText(r), sub: null }
      : {
          label: 'お会計',
          main: amountText(r),
          sub:
            r.amount && r.amount > 0
              ? `${paymentMethodsText(r.storePaymentMethods)}（${r.kind === 'event' ? '当日受付で' : 'その場で'}お支払い）`
              : null,
        };

  return (
    <StaffScreen>
      <StaffNavBar title="予約・申し込み" fallback={`/staff/${r.storeId}/bookings`} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.numberCard}>
          <Text style={styles.number} testID="staff-booking-number">
            {r.number}
          </Text>
          <Text style={[styles.name, deleted && styles.deleted]}>
            {deleted ? customerLabel(r) : `${r.customerName} 様`}
          </Text>
          {!deleted && r.customerPhone ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${formatPhone(r.customerPhone)} に電話する`}
              onPress={() => void Linking.openURL(`tel:${r.customerPhone}`)}
              style={({ pressed }) => [styles.phone, pressed && { opacity: 0.8 }]}
            >
              <Icon name="phone" size={18} color={adminColors.text} strokeWidth={1.8} />
              <Text style={styles.phoneText}>{formatPhone(r.customerPhone)}</Text>
            </Pressable>
          ) : null}
        </View>

        {effective === 'expired' ? (
          <AdminBand text="受け取り期間を過ぎています（期限切れ）。来店があればそのまま受け取り済みにできます。" />
        ) : null}
        {error ? <AdminBand text={error} tone="danger" testID="process-error" /> : null}

        <View style={styles.table}>
          <Row label="状態">
            <StaffStatusPill label={status.label} tone={status.tone} size="md" />
          </Row>
          <Row label={ITEM_LABEL[r.kind]} border>
            <Text style={[styles.value, styles.strong]}>{bookingItemText(r)}</Text>
          </Row>
          <Row label={payment.label} border>
            <Text style={styles.amount}>{payment.main}</Text>
            {payment.sub ? <Text style={styles.sub}>{payment.sub}</Text> : null}
          </Row>
          <Row label={r.kind === 'product' ? '受け取り' : '日時'} border>
            <Text style={styles.value}>{scheduleFullText(r)}</Text>
          </Row>
        </View>

        {effective === 'completed' ? (
          <AdminBand
            text={`${status.label}　${r.completedAt ? formatDateTimeJa(r.completedAt) : ''}`}
            tone="gray"
          />
        ) : null}
        {effective === 'cancelled' ? (
          <AdminBand
            text={`キャンセル（${r.cancelledBy === 'staff' ? '店舗' : '利用者'}）　${r.cancelledAt ? formatDateTimeJa(r.cancelledAt) : ''}`}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        {effective === 'reserved' || effective === 'expired' ? (
          <>
            <PrimaryButton
              testID="complete-booking"
              label={complete.isPending ? '処理しています…' : doneActionLabel(r.kind)}
              onPress={() =>
                isWide
                  ? setConfirmComplete(true)
                  : void run(() => complete.mutateAsync(r.id), 'back')
              }
              disabled={busy}
              height={60}
              labelSize={19}
              style={busy ? undefined : { backgroundColor: adminColors.done }}
            />
            <TextButton
              testID="open-staff-cancel"
              label={`この${CANCEL_TARGET[r.kind]}をキャンセルにする`}
              color={adminColors.danger}
              onPress={() => setConfirmCancel(true)}
              style={{ height: 48 }}
            />
          </>
        ) : effective === 'completed' ? (
          <TextButton
            testID="revert-booking"
            label={revert.isPending ? '処理しています…' : revertActionLabel(r.kind)}
            color={adminColors.textSub}
            onPress={() => void run(() => revert.mutateAsync(r.id), 'stay')}
            style={{ height: 48 }}
          />
        ) : null}
      </View>

      <ConfirmSheet
        visible={confirmComplete}
        title={`${doneActionLabel(r.kind).replace('にする', '')}にしますか？`}
        body={
          <View style={styles.confirmBox}>
            <ConfirmLine label="番号" value={r.number} big />
            <ConfirmLine label="氏名" value={customerLabel(r)} />
            <ConfirmLine label={ITEM_LABEL[r.kind]} value={bookingItemText(r)} />
            <ConfirmLine
              label={payment.label}
              value={`${payment.main}${payment.sub ? `　${payment.sub}` : ''}`}
            />
          </View>
        }
        confirmLabel={doneActionLabel(r.kind)}
        cancelLabel="キャンセル"
        tone="done"
        busy={complete.isPending}
        onConfirm={() =>
          void run(async () => {
            await complete.mutateAsync(r.id);
            setConfirmComplete(false);
          }, 'back')
        }
        onClose={() => setConfirmComplete(false)}
        testID="complete-confirm"
      />
      <ConfirmSheet
        visible={confirmCancel}
        title={`この${CANCEL_TARGET[r.kind]}をキャンセルにしますか？`}
        body={
          <AdminBand
            tone="danger"
            text={`お客さまに通知が届きます。${r.kind === 'job' ? '募集枠は変わりません。' : '数量は残り数に戻ります。'}`}
          />
        }
        confirmLabel="キャンセルにする"
        busy={cancel.isPending}
        onConfirm={() =>
          void run(async () => {
            await cancel.mutateAsync(r.id);
            setConfirmCancel(false);
          }, 'back')
        }
        onClose={() => setConfirmCancel(false)}
        testID="staff-cancel-sheet"
      />
    </StaffScreen>
  );
}

function ConfirmLine({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.confirmLine}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={[styles.confirmValue, big && styles.confirmBig]}>{value}</Text>
    </View>
  );
}

function Row({
  label,
  border,
  children,
}: {
  label: string;
  border?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.row, border && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  numberCard: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 4,
    ...adminShadow.card,
  },
  number: {
    fontSize: 60,
    fontWeight: '800',
    letterSpacing: 7.2,
    lineHeight: 64,
    paddingLeft: 7.2,
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  name: { fontSize: 22, fontWeight: '800', color: adminColors.text, marginTop: 6 },
  deleted: { color: adminColors.textWeak, fontStyle: 'italic' },
  phone: {
    marginTop: 10,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: adminColors.fill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneText: { fontSize: 14.5, fontWeight: '700', color: adminColors.text },
  table: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    ...adminShadow.card,
  },
  row: { flexDirection: 'row', paddingVertical: 10, gap: 10, alignItems: 'center' },
  rowBorder: { borderTopWidth: 1, borderTopColor: adminColors.divider },
  rowLabel: { width: 90, fontSize: 14, fontWeight: '700', color: adminColors.textWeak },
  rowValue: { flex: 1, gap: 2 },
  value: { fontSize: 15, lineHeight: 22, color: adminColors.text },
  strong: { fontSize: 16, fontWeight: '800' },
  amount: { fontSize: 20, fontWeight: '800', color: adminColors.text },
  sub: { fontSize: 13.5, color: adminColors.textSub },
  footer: { paddingTop: 12, paddingHorizontal: 20, gap: 10 },
  confirmBox: {
    backgroundColor: '#F5F1EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
  },
  confirmLine: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  confirmLabel: { width: 80, fontSize: 13, fontWeight: '700', color: adminColors.textWeak },
  confirmValue: { flex: 1, fontSize: 16, fontWeight: '700', color: adminColors.text },
  confirmBig: { fontSize: 30, fontWeight: '800', letterSpacing: 2.4 },
});
