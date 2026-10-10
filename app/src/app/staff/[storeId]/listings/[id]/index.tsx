import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { LoadError, Loading } from '@/components/LoadState';
import { ConfirmSheet } from '@/components/admin/ConfirmSheet';
import { GroupList } from '@/components/admin/GroupList';
import { KindLabel, ListingStatusPill } from '@/components/admin/Labels';
import { NumberSearchField } from '@/components/admin/NumberSearchField';
import { PopMenu, type PopMenuItem } from '@/components/admin/PopMenu';
import { AdminFilterChip, SelectSheet } from '@/components/admin/SelectSheet';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { deleteListing, endListing } from '@/features/staff/api';
import { BookingRow } from '@/features/staff/components/BookingRow';
import {
  amountText,
  listingBookingTotalLine,
  listingMetric,
  listingScheduleHeading,
  matchesStatus,
} from '@/features/staff/derive';
import { useListingBookings, useStaffListing, useStaffMutation } from '@/features/staff/hooks';
import type { StaffListing, StatusFilter } from '@/features/staff/types';
import { useNow } from '@/hooks/useNow';
import { adminColors, adminShadow, adminSpace } from '@/theme/adminTokens';

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: '未完了' },
  { value: 'done', label: '完了' },
  { value: 'closed', label: 'キャンセル・期限切れ' },
] as const;

/** A-11 掲載詳細（この掲載の予約一覧）。右上「⋯」＝編集／複製／終了する／削除 */
export default function StaffListingDetailScreen() {
  const { storeId, id } = useLocalSearchParams<{ storeId: string; id: string }>();
  const listing = useStaffListing(id);
  const bookings = useListingBookings(id);
  const refetchListing = listing.refetch;
  const refetchBookings = bookings.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchListing();
      void refetchBookings();
    }, [refetchListing, refetchBookings]),
  );

  if (listing.isPending || listing.isError || !listing.data) {
    return (
      <StaffScreen>
        <StaffNavBar fallback={`/staff/${storeId}/listings`} />
        {listing.isPending ? (
          <Loading />
        ) : listing.isError ? (
          <LoadError onRetry={() => void refetchListing()} />
        ) : (
          <EmptyState icon="list" title="この掲載は見つかりませんでした" />
        )}
      </StaffScreen>
    );
  }
  return (
    <Detail
      listing={listing.data}
      bookings={bookings}
      onRefresh={() => {
        void refetchListing();
        void refetchBookings();
      }}
    />
  );
}

type Confirm = 'end' | 'delete' | null;

function Detail({
  listing: l,
  bookings,
  onRefresh,
}: {
  listing: StaffListing;
  bookings: ReturnType<typeof useListingBookings>;
  onRefresh: () => void;
}) {
  const now = useNow();
  const moreRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [statusSheet, setStatusSheet] = useState(false);
  const end = useStaffMutation(endListing);
  const remove = useStaffMutation(deleteListing);

  const rows = useMemo(() => {
    const all = bookings.data ?? [];
    // 番号を入れたら状態の絞り込みは外す
    if (number) return all.filter((r) => r.number.startsWith(number));
    return all.filter((r) => matchesStatus(r, status, now));
  }, [bookings.data, number, status, now]);

  const hasBookings = (bookings.data?.length ?? 0) > 0;
  const canEnd = l.status === 'published';
  const metric = listingMetric(l);
  const totalLine = listingBookingTotalLine(bookings.data ?? [], now);

  const menuItems: PopMenuItem[] = [
    {
      key: 'edit',
      label: '編集',
      onPress: () =>
        router.push({
          pathname: '/staff/[storeId]/listings/[id]/edit',
          params: { storeId: l.storeId, id: l.id },
        }),
    },
    {
      key: 'duplicate',
      label: '複製',
      onPress: () =>
        router.push({
          pathname: '/staff/[storeId]/listings/new',
          params: { storeId: l.storeId, kind: l.kind, from: l.id },
        }),
    },
  ];
  if (canEnd)
    menuItems.push({
      key: 'end',
      label: '終了する',
      danger: true,
      onPress: () => setConfirm('end'),
    });
  if (!hasBookings && bookings.isSuccess) {
    menuItems.push({
      key: 'delete',
      label: '削除',
      danger: true,
      onPress: () => setConfirm('delete'),
    });
  }

  const doConfirm = async () => {
    setError(null);
    try {
      if (confirm === 'end') {
        await end.mutateAsync(l.id);
        setConfirm(null);
      } else if (confirm === 'delete') {
        await remove.mutateAsync(l.id);
        setConfirm(null);
        if (router.canGoBack()) router.back();
        else
          router.replace({ pathname: '/staff/[storeId]/listings', params: { storeId: l.storeId } });
      }
    } catch {
      setError(
        confirm === 'delete'
          ? '削除できませんでした。予約が入っている掲載は削除できません。'
          : '終了できませんでした。',
      );
    }
  };

  const more = (
    <View ref={moreRef} collapsable={false}>
      <Pressable
        testID="listing-more"
        accessibilityRole="button"
        accessibilityLabel="その他の操作"
        onPress={() => setMenuOpen(true)}
        style={styles.more}
        hitSlop={6}
      >
        <Icon name="more" size={24} color={adminColors.text} />
      </Pressable>
    </View>
  );

  return (
    <StaffScreen>
      <StaffNavBar fallback={`/staff/${l.storeId}/listings`} right={more} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={bookings.isRefetching}
            onRefresh={onRefresh}
            tintColor={adminColors.accent}
          />
        }
      >
        <View style={styles.heading}>
          <View style={styles.labels}>
            <KindLabel kind={l.kind} size="md" />
            <ListingStatusPill status={l.displayStatus} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {l.title}
          </Text>
          <View style={styles.scheduleRow}>
            <Text style={styles.schedule}>{listingScheduleHeading(l)}</Text>
            {metric ? <Text style={styles.metric}>{metric}</Text> : null}
          </View>
          {totalLine ? (
            <Text style={styles.total} testID="listing-total">
              {totalLine}
            </Text>
          ) : null}
        </View>

        {l.kind === 'notice' ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeBody}>{l.body}</Text>
          </View>
        ) : (
          <>
            <NumberSearchField value={number} onChange={setNumber} testID="listing-number-search" />
            <View style={styles.chips}>
              <AdminFilterChip
                testID="filter-booking-status"
                label={STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label ?? ''}
                active={status !== 'all'}
                onPress={() => setStatusSheet(true)}
              />
            </View>
            {bookings.isPending ? (
              <Loading />
            ) : bookings.isError ? (
              <LoadError onRetry={onRefresh} />
            ) : rows.length === 0 ? (
              <Text style={styles.empty}>
                {hasBookings ? '該当する予約はありません' : 'まだ予約はありません'}
              </Text>
            ) : (
              <GroupList>
                {rows.map((r) => (
                  <BookingRow
                    key={r.id}
                    row={r}
                    now={now}
                    right="quantity"
                    second="amount"
                    amount={amountText(r)}
                    onPress={() =>
                      router.push({
                        pathname: '/staff/[storeId]/bookings/[bookingId]',
                        params: { storeId: r.storeId, bookingId: r.id },
                      })
                    }
                  />
                ))}
              </GroupList>
            )}
          </>
        )}
      </ScrollView>

      <PopMenu
        visible={menuOpen}
        anchorRef={moreRef}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />
      <SelectSheet
        visible={statusSheet}
        title="状態"
        options={STATUS_FILTER_OPTIONS}
        value={status}
        onSelect={setStatus}
        onClose={() => setStatusSheet(false)}
      />
      <ConfirmSheet
        visible={confirm === 'end'}
        title="掲載を終了しますか？"
        body="新しい予約を受け付けなくなります。入っている予約はそのまま残ります。"
        confirmLabel="終了する"
        busy={end.isPending}
        error={error}
        onConfirm={() => void doConfirm()}
        onClose={() => setConfirm(null)}
        testID="end-sheet"
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="掲載を削除しますか？"
        body="元に戻せません。"
        confirmLabel="削除する"
        busy={remove.isPending}
        error={error}
        onConfirm={() => void doConfirm()}
        onClose={() => setConfirm(null)}
        testID="delete-sheet"
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  more: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: adminSpace.screenX, paddingBottom: 32, gap: 12 },
  heading: { gap: 6 },
  labels: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 31, color: adminColors.text },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  schedule: { fontSize: 13.5, color: adminColors.textSub, flexShrink: 1 },
  metric: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  total: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  chips: { flexDirection: 'row', gap: 8 },
  empty: { fontSize: 14, color: adminColors.textWeak, paddingVertical: 12, textAlign: 'center' },
  noticeCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 18,
    ...adminShadow.card,
  },
  noticeBody: { fontSize: 15, lineHeight: 26, color: adminColors.text },
});
