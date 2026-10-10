import { useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBand } from '@/components/Bands';
import { TextButton } from '@/components/Buttons';
import { Card, Divider } from '@/components/Card';
import { DangerSheet } from '@/components/DangerSheet';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/KindPills';
import { LoadError, Loading } from '@/components/LoadState';
import { NumberCard } from '@/components/NumberCard';
import { NavBar, Screen } from '@/components/Screen';
import { BookingError } from '@/features/bookings/api';
import {
  cancelState,
  cancelUntilText,
  numberLabel,
  placeAddress,
  placeName,
  scheduleText,
  statusPill,
  titleWithQuantity,
} from '@/features/bookings/derive';
import { useBooking, useCancelBooking } from '@/features/bookings/hooks';
import type { MyBooking } from '@/features/bookings/types';
import { openMap } from '@/features/listings/components/DetailCards';
import { paymentMethodsText } from '@/features/listings/master';
import { useNow } from '@/hooks/useNow';
import { formatDateTimeJa, formatPhone, formatYen } from '@/lib/format';
import { colors } from '@/theme/tokens';

const NAV_TITLE = { product: '予約の詳細', event: '申し込みの詳細', job: '応募の詳細' } as const;
const NUMBER_NOTE = {
  product: '店頭でこの番号とお名前をお伝えください',
  event: '受付でこの番号とお名前をお伝えください',
  job: '店舗からの連絡の際にこの番号をお伝えください',
} as const;
const ITEM_LABEL = { product: '商品', event: 'イベント', job: '求人' } as const;
const CANCEL_COPY = {
  product: {
    button: '予約をキャンセルする',
    title: '予約をキャンセルしますか？',
    confirm: 'キャンセルする',
    keep: 'やめる（予約を残す）',
  },
  event: {
    button: '申し込みをキャンセルする',
    title: '申し込みをキャンセルしますか？',
    confirm: 'キャンセルする',
    keep: 'やめる（申し込みを残す）',
  },
  job: {
    button: '応募を取り消す',
    title: '応募を取り消しますか？',
    confirm: '取り消す',
    keep: 'やめる（応募を残す）',
  },
} as const;

/** U-22 予約詳細（＋U-21 キャンセルの確認シート） */
export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useBooking(id);

  if (isPending || isError || !data) {
    return (
      <Screen>
        <NavBar title="予約の詳細" />
        {isPending ? (
          <Loading />
        ) : isError ? (
          <LoadError onRetry={() => void refetch()} />
        ) : (
          <EmptyState icon="ticket" title="この予約は見つかりませんでした" />
        )}
      </Screen>
    );
  }
  return <Detail booking={data} />;
}

function Detail({ booking: b }: { booking: MyBooking }) {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancel = useCancelBooking(b.id);
  const state = cancelState(b, now);
  const pill = statusPill(b, now);
  const copy = CANCEL_COPY[b.kind];

  const confirmCancel = async () => {
    setError(null);
    try {
      await cancel.mutateAsync();
      setSheetOpen(false);
    } catch (e) {
      const code = e instanceof BookingError ? e.code : 'unknown';
      if (code === 'cancel_deadline_passed' || code === 'not_cancellable') {
        // 期限を過ぎた・すでに状態が変わった。再取得すれば表示が切り替わる
        setSheetOpen(false);
        return;
      }
      setError('キャンセルできませんでした。時間をおいてもう一度お試しください。');
    }
  };

  const payment =
    b.kind === 'job'
      ? { label: '報酬', value: <Text style={styles.value}>{b.listing.payText ?? ''}</Text> }
      : {
          label: 'お支払い',
          value: (
            <View style={{ gap: 2 }}>
              <Text style={styles.amount}>{b.amount ? `${formatYen(b.amount)}円` : '無料'}</Text>
              {b.amount ? (
                <Text style={styles.value}>
                  {b.kind === 'event' ? '当日受付で' : '店頭で'}（
                  {paymentMethodsText(b.store.paymentMethods)}）
                </Text>
              ) : null}
            </View>
          ),
        };

  return (
    <Screen>
      <NavBar title={NAV_TITLE[b.kind]} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <NumberCard label={numberLabel(b.kind)} number={b.number}>
          <Text style={styles.numberNote}>{NUMBER_NOTE[b.kind]}</Text>
        </NumberCard>

        <Card style={styles.table}>
          <Row label="状態">
            <StatusPill label={pill.label} tone={pill.tone} />
          </Row>
          <Divider />
          <Row label={ITEM_LABEL[b.kind]}>
            <Text style={[styles.value, styles.strong]}>{titleWithQuantity(b)}</Text>
          </Row>
          <Divider />
          <Row label={payment.label}>{payment.value}</Row>
          <Divider />
          <Row label={b.kind === 'product' ? '受け取り' : '日時'}>
            <Text style={[styles.value, styles.strong]}>{scheduleText(b)}</Text>
          </Row>
          <Divider />
          <Row label="場所">
            <View style={{ gap: 2 }}>
              <Text style={styles.value}>{placeName(b)}</Text>
              <Text style={styles.value}>{placeAddress(b)}</Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => openMap(placeAddress(b))}
                hitSlop={8}
              >
                <Text style={styles.mapLink}>地図アプリで開く ↗</Text>
              </Pressable>
            </View>
          </Row>
        </Card>

        {error ? <MessageBand message={error} /> : null}

        {state === 'can' ? (
          <View style={styles.cancelArea}>
            <Text style={styles.cancelUntil}>{cancelUntilText(b)}</Text>
            <TextButton
              testID="open-cancel"
              label={copy.button}
              color={colors.danger}
              onPress={() => setSheetOpen(true)}
              style={{ height: 48 }}
            />
          </View>
        ) : state === 'deadline_passed' ? (
          <NoCancelBox
            title={
              b.kind === 'job' ? 'アプリからは取り消せません' : 'アプリからはキャンセルできません'
            }
            body={`キャンセル期限（${formatDateTimeJa(b.listing.cancelDeadline ?? now)}）を過ぎました。ご都合が悪くなった場合はお店へ直接ご連絡ください。`}
            booking={b}
          />
        ) : state === 'not_allowed' ? (
          <NoCancelBox
            title={`この${b.kind === 'job' ? '応募は取り消せません' : b.kind === 'event' ? '申し込みはキャンセルできません' : '予約はキャンセルできません'}`}
            body={`この${ITEM_LABEL[b.kind]}はキャンセルできない設定です。`}
          />
        ) : null}
      </ScrollView>

      <DangerSheet
        visible={sheetOpen}
        title={copy.title}
        body={b.kind === 'job' ? '取り消すと元に戻せません' : 'キャンセルすると元に戻せません'}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={cancel.isPending}
        onConfirm={() => void confirmCancel()}
        onClose={() => setSheetOpen(false)}
        testID="cancel-sheet"
      />
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

/** キャンセルできないときの灰色の箱（design 05）。期限後は店舗の電話番号を出す */
function NoCancelBox({
  title,
  body,
  booking,
}: {
  title: string;
  body: string;
  booking?: MyBooking;
}) {
  return (
    <View style={styles.noCancel} testID="no-cancel">
      <Text style={styles.noCancelTitle}>{title}</Text>
      <Text style={styles.noCancelBody}>{body}</Text>
      {booking ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${booking.store.name}に電話する`}
          onPress={() => void Linking.openURL(`tel:${booking.store.phone}`)}
        >
          <Text style={styles.noCancelBody}>
            {booking.store.name}　
            <Text style={styles.phone}>{formatPhone(booking.store.phone)}</Text>
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingHorizontal: 20, gap: 12 },
  numberNote: { fontSize: 13, color: colors.textSub },
  table: { paddingVertical: 4, paddingHorizontal: 16 },
  row: { flexDirection: 'row', paddingVertical: 11, gap: 10, alignItems: 'flex-start' },
  rowLabel: { width: 86, fontSize: 13, fontWeight: '700', color: colors.textWeak, paddingTop: 2 },
  rowValue: { flex: 1 },
  value: { fontSize: 14.5, lineHeight: 22, color: colors.text },
  strong: { fontWeight: '800' },
  amount: { fontSize: 16, fontWeight: '800', color: colors.accent },
  mapLink: { fontSize: 14.5, fontWeight: '700', color: colors.accent, lineHeight: 22 },
  cancelArea: { gap: 8, marginTop: 8 },
  cancelUntil: { fontSize: 13, color: colors.textSub, textAlign: 'center' },
  noCancel: {
    backgroundColor: colors.fill,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  noCancelTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  noCancelBody: { fontSize: 14, lineHeight: 23, color: colors.textSub },
  phone: { fontWeight: '800', color: colors.accent, textDecorationLine: 'underline' },
});
