import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { GroupList } from '@/components/admin/GroupList';
import { NumberSearchField } from '@/components/admin/NumberSearchField';
import { AdminFilterChip, SelectSheet } from '@/components/admin/SelectSheet';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { StoreHeader } from '@/components/admin/StoreHeader';
import { BookingRow } from '@/features/staff/components/BookingRow';
import {
  bookingSummaryLine,
  matchesKind,
  matchesStatus,
  sortBookings,
} from '@/features/staff/derive';
import { useBookingSearch, useStoreBookings } from '@/features/staff/hooks';
import { useStaffStore } from '@/features/staff/StaffStoreContext';
import type { KindFilter, Period, StaffBookingRow, StatusFilter } from '@/features/staff/types';
import { useNow } from '@/hooks/useNow';
import { adminColors, adminSpace } from '@/theme/adminTokens';

const PERIOD_OPTIONS = [
  { value: 'today', label: '本日' },
  { value: 'future', label: '今後' },
  { value: 'past', label: '過去' },
  { value: 'all', label: 'すべて' },
] as const;
const KIND_OPTIONS = [
  { value: 'all', label: 'すべての種類' },
  { value: 'product', label: '商品' },
  { value: 'event', label: 'イベント' },
  { value: 'job', label: '求人' },
] as const;
const STATUS_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未完了' },
  { value: 'done', label: '完了' },
  { value: 'closed', label: 'キャンセル・期限切れ' },
] as const;

const labelOf = <T extends string>(options: readonly { value: T; label: string }[], value: T) =>
  options.find((o) => o.value === value)?.label ?? '';

/**
 * A-20 予約・申し込み（この店舗）。初期値は「本日 × 未完了」＝本日の予定。
 * 番号を入れると期間・状態の絞り込みは外れ、店舗内で前方一致した行だけ残る
 */
export default function StaffBookingsScreen() {
  const store = useStaffStore();
  const now = useNow();
  const [period, setPeriod] = useState<Period>('today');
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [sheet, setSheet] = useState<'period' | 'kind' | 'status' | null>(null);
  const [number, setNumber] = useState('');
  const bookings = useStoreBookings(store.id, period, now);
  const search = useBookingSearch(number, { storeId: store.id });
  const { refetch } = bookings;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const searching = number.length > 0;
  const source = searching ? search : bookings;
  const rows = useMemo(() => {
    const all = source.data ?? [];
    const filtered = searching
      ? all.filter((r) => matchesKind(r, kind))
      : all.filter((r) => matchesKind(r, kind) && matchesStatus(r, status, now));
    return sortBookings(filtered, searching ? 'all' : period);
  }, [source.data, searching, kind, status, period, now]);

  const isDefault = period === 'today' && status === 'open' && kind === 'all';

  return (
    <StaffScreen>
      <StoreHeader pcTitle="予約・申し込み" storeName={store.name} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={bookings.isRefetching}
            onRefresh={() => void refetch()}
            tintColor={adminColors.accent}
          />
        }
      >
        <NumberSearchField value={number} onChange={setNumber} testID="store-number-search" />
        <View style={styles.chips}>
          {/* 本日・未完了は初期値だが、絞っていることが分かるよう黒塗りにする（design 04） */}
          <AdminFilterChip
            testID="filter-period"
            label={labelOf(PERIOD_OPTIONS, period)}
            active={!searching && period !== 'all'}
            onPress={() => setSheet('period')}
          />
          <AdminFilterChip
            testID="filter-kind"
            label={labelOf(KIND_OPTIONS, kind)}
            active={kind !== 'all'}
            onPress={() => setSheet('kind')}
          />
          <AdminFilterChip
            testID="filter-status"
            label={labelOf(STATUS_OPTIONS, status)}
            active={!searching && status !== 'all'}
            onPress={() => setSheet('status')}
          />
        </View>

        {source.isPending ? (
          <Loading />
        ) : source.isError ? (
          <LoadError onRetry={() => void source.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="calendarCheck"
            title={!searching && isDefault ? '本日の予定はありません' : '該当する予約はありません'}
          />
        ) : (
          <>
            <View style={styles.count}>
              <Text style={styles.countNum}>{rows.length}件</Text>
              <Text style={styles.countSub}>
                {bookingSummaryLine(rows, searching ? 'all' : period, now)}
              </Text>
            </View>
            <GroupList>
              {rows.map((r: StaffBookingRow) => (
                <BookingRow
                  key={r.id}
                  row={r}
                  now={now}
                  right="time"
                  second="item"
                  onPress={() =>
                    router.push({
                      pathname: '/staff/[storeId]/bookings/[bookingId]',
                      params: { storeId: store.id, bookingId: r.id },
                    })
                  }
                />
              ))}
            </GroupList>
          </>
        )}
      </ScrollView>

      <SelectSheet
        visible={sheet === 'period'}
        title="期間"
        options={PERIOD_OPTIONS}
        value={period}
        onSelect={setPeriod}
        onClose={() => setSheet(null)}
      />
      <SelectSheet
        visible={sheet === 'kind'}
        title="種類"
        options={KIND_OPTIONS}
        value={kind}
        onSelect={setKind}
        onClose={() => setSheet(null)}
      />
      <SelectSheet
        visible={sheet === 'status'}
        title="状態"
        options={STATUS_OPTIONS}
        value={status}
        onSelect={setStatus}
        onClose={() => setSheet(null)}
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: adminSpace.screenX, paddingTop: 14, paddingBottom: 24, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  countNum: { fontSize: 14, fontWeight: '800', color: adminColors.text },
  countSub: { fontSize: 12.5, fontWeight: '700', color: adminColors.textWeak, flexShrink: 1 },
});
