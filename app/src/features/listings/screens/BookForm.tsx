import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoNote, MessageBand } from '@/components/Bands';
import { BottomBar } from '@/components/BottomBar';
import { PrimaryButton } from '@/components/Buttons';
import { Card, Divider } from '@/components/Card';
import { Tag } from '@/components/Pills';
import { NavBar, Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { saveNextPath } from '@/features/auth/api';
import { BookingError } from '@/features/bookings/api';
import { useCreateBooking } from '@/features/bookings/hooks';
import { useNow } from '@/hooks/useNow';
import { formatDateTimeJa } from '@/lib/format';
import { colors, radius } from '@/theme/tokens';

import type { Listing } from '../types';

import { bookSpec, limitMessage } from './bookSpec';

type Props = {
  listing: Listing;
  onRefetch: () => Promise<{ data: Listing | null | undefined }>;
};

const remainingOf = (l: Listing | null | undefined) =>
  l && (l.kind === 'product' || l.kind === 'event') ? l.remaining : 0;

/** U-20 予約・申し込み・応募（種類ごとの違いは bookSpec） */
export function BookForm({ listing, onRefetch }: Props) {
  const now = useNow();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const booking = useCreateBooking(listing.id);
  const spec = bookSpec(listing, now);
  if (!spec) return null;

  const q = spec.quantity;
  const max = q ? Math.max(q.max, 1) : 1;
  // 残りが減ったら（再取得後）選択数を上限までに収める
  const value = Math.min(quantity, max);
  const atRemainingLimit = !!q && spec.open && value >= q.remaining;
  const message = error ?? spec.closedMessage;
  const total = spec.total?.(value);

  const submit = async () => {
    setError(null);
    const here = `/listings/${listing.id}/book`;
    try {
      const created = await booking.mutateAsync(value);
      router.replace({ pathname: '/bookings/[id]/done', params: { id: created.id } });
    } catch (e) {
      const code = e instanceof BookingError ? e.code : 'unknown';
      switch (code) {
        case 'not_authenticated':
          await saveNextPath(here);
          router.replace('/auth/login');
          return;
        case 'profile_incomplete':
          await saveNextPath(here);
          router.replace({ pathname: '/auth/register', params: { complete: '1' } });
          return;
        case 'sold_out': {
          // 確定の瞬間に他の人が先に予約した。最新の残りで案内する（design 05）
          const latest = (await onRefetch()).data;
          setError(limitMessage(spec, remainingOf(latest)));
          return;
        }
        case 'over_max_per_booking':
          setError(q?.note ?? `${spec.verb}できませんでした。`);
          return;
        case 'deadline_passed':
          setError(`${spec.verb}の受付は ${formatDateTimeJa(spec.deadline)} で終了しました。`);
          return;
        case 'not_published':
        case 'not_found':
          setError(`この${spec.noun}は現在${spec.verb}できません。`);
          return;
        default:
          setError(`${spec.verb}できませんでした。時間をおいてもう一度お試しください。`);
      }
    }
  };

  return (
    <Screen>
      <NavBar title={spec.navTitle} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summary}>
          <View
            style={[
              styles.thumb,
              {
                backgroundColor:
                  spec.thumbTone === 'fresh'
                    ? colors.photoFresh
                    : spec.thumbTone === 'job'
                      ? colors.photoJob
                      : colors.photo,
              },
            ]}
          >
            {listing.photoUrl ? (
              <Image
                source={{ uri: listing.photoUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : null}
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.store} numberOfLines={1}>
              {listing.store.name}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {listing.title}
            </Text>
            <View style={styles.unitPrice}>
              {spec.summary.was ? <Text style={styles.was}>{spec.summary.was}</Text> : null}
              <Text style={styles.price}>{spec.summary.price}</Text>
              {spec.summary.per ? <Text style={styles.per}>{spec.summary.per}</Text> : null}
            </View>
          </View>
        </Card>

        {q ? (
          <Card style={styles.qtyCard}>
            <View style={styles.qtyHead}>
              <Text style={styles.qtyLabel}>{q.label}</Text>
              <Tag
                label={q.remainLabel}
                bg={spec.open ? colors.noticeBand : colors.grayPill}
                fg={spec.open ? colors.noticeBandText : colors.grayPillText}
                style={{ paddingHorizontal: 10 }}
              />
            </View>
            <Stepper
              value={value}
              max={spec.open ? max : value}
              unit={q.unit}
              onChange={(v) => {
                setError(null);
                setQuantity(v);
              }}
            />
            {atRemainingLimit && !error ? (
              <Text style={styles.limit} testID="limit-message">
                {limitMessage(spec, q.remaining)}
              </Text>
            ) : q.note ? (
              <Text style={styles.qtyNote}>{q.note}</Text>
            ) : null}
          </Card>
        ) : null}

        {message ? <MessageBand message={message} testID="book-error" /> : null}

        <Card style={styles.table}>
          {spec.rows.map((r, i) => (
            <View key={r.label}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={[styles.rowValue, r.strong && { fontWeight: '800' }]}>{r.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {spec.infoNote ? <InfoNote text={spec.infoNote} fontSize={14.5} /> : null}
      </ScrollView>

      <BottomBar>
        {total ? (
          <View>
            <Text style={styles.totalLabel}>{total.label}</Text>
            <Text style={styles.total} testID="book-total">
              {total.text.endsWith('円') ? (
                <>
                  {total.text.slice(0, -1)}
                  <Text style={styles.totalYen}>円</Text>
                </>
              ) : (
                total.text
              )}
            </Text>
          </View>
        ) : null}
        <PrimaryButton
          testID="confirm-booking"
          label={
            booking.isPending ? '送信しています…' : spec.open ? spec.confirmLabel : spec.closedLabel
          }
          labelSize={17}
          disabled={!spec.open || booking.isPending}
          onPress={() => void submit()}
          style={{ flex: 1 }}
        />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 4, paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.thumb, overflow: 'hidden' },
  summaryText: { flex: 1, gap: 2 },
  store: { fontSize: 12.5, fontWeight: '700', color: colors.textWeak },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  unitPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  was: { fontSize: 12.5, color: colors.placeholder, textDecorationLine: 'line-through' },
  price: { fontSize: 17, fontWeight: '900', color: colors.accent },
  per: { fontSize: 12, color: colors.textWeak },
  qtyCard: { padding: 16, gap: 14 },
  qtyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  limit: { fontSize: 13, fontWeight: '700', color: colors.danger, textAlign: 'center' },
  qtyNote: { fontSize: 12.5, color: colors.textWeak, textAlign: 'center' },
  table: { paddingVertical: 4, paddingHorizontal: 16 },
  row: { flexDirection: 'row', paddingVertical: 11, gap: 10 },
  rowLabel: { width: 90, fontSize: 13, fontWeight: '700', color: colors.textWeak, paddingTop: 1 },
  rowValue: { flex: 1, fontSize: 14.5, color: colors.text, lineHeight: 21 },
  totalLabel: { fontSize: 12, color: colors.textWeak },
  total: { fontSize: 26, fontWeight: '900', color: colors.accent, lineHeight: 30 },
  totalYen: { fontSize: 15 },
});
