import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { GroupList } from '@/components/admin/GroupList';
import { KindLabel, ListingStatusPill } from '@/components/admin/Labels';
import { PopMenu } from '@/components/admin/PopMenu';
import { AdminFilterChip, SelectSheet } from '@/components/admin/SelectSheet';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { StoreHeader } from '@/components/admin/StoreHeader';
import type { DisplayStatus } from '@/features/listings/types';
import { LISTING_STATUS_LABEL, listingMetric, listingScheduleLine } from '@/features/staff/derive';
import { useStoreListings } from '@/features/staff/hooks';
import { useStaffStore } from '@/features/staff/StaffStoreContext';
import type { ListingKind, StaffListing } from '@/features/staff/types';
import { adminColors, adminSpace } from '@/theme/adminTokens';

type KindValue = 'all' | ListingKind;
type StatusValue = 'all' | DisplayStatus;

const KIND_OPTIONS = [
  { value: 'all', label: 'すべての種類' },
  { value: 'product', label: '商品' },
  { value: 'event', label: 'イベント' },
  { value: 'job', label: '求人' },
  { value: 'notice', label: 'お知らせ' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'すべての状態' },
  { value: 'published', label: '公開' },
  { value: 'scheduled', label: '公開予定' },
  { value: 'ended', label: '終了' },
  { value: 'draft', label: '下書き' },
] as const;

/** ＋掲載メニューの種類 */
export const ADD_MENU = [
  { kind: 'product', label: '商品', icon: 'menuProduct' },
  { kind: 'event', label: 'イベント', icon: 'menuEvent' },
  { kind: 'job', label: '求人', icon: 'menuJob' },
  { kind: 'notice', label: 'お知らせ', icon: 'menuNotice' },
] as const;

/** A-11 掲載一覧（この店舗）。公開期間の新しい順 */
export default function ListingsScreen() {
  const store = useStaffStore();
  const listings = useStoreListings(store.id);
  const { refetch } = listings;
  const [kind, setKind] = useState<KindValue>('all');
  const [status, setStatus] = useState<StatusValue>('all');
  const [sheet, setSheet] = useState<'kind' | 'status' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const addRef = useRef<View>(null);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const items = useMemo(
    () =>
      (listings.data ?? []).filter(
        (l) =>
          (kind === 'all' || l.kind === kind) && (status === 'all' || l.displayStatus === status),
      ),
    [listings.data, kind, status],
  );
  const filtered = kind !== 'all' || status !== 'all';

  const addButton = (
    <View ref={addRef} collapsable={false}>
      <Pressable
        testID="add-listing"
        accessibilityRole="button"
        onPress={() => setMenuOpen(true)}
        style={({ pressed }) => [styles.add, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.addText}>＋ 掲載</Text>
      </Pressable>
    </View>
  );

  return (
    <StaffScreen>
      <StoreHeader pcTitle="商品・イベント・求人" storeName={store.name} action={addButton} />
      <View style={styles.chips}>
        <AdminFilterChip
          testID="filter-kind"
          label={KIND_OPTIONS.find((o) => o.value === kind)?.label ?? ''}
          active={kind !== 'all'}
          onPress={() => setSheet('kind')}
        />
        <AdminFilterChip
          testID="filter-status"
          label={status === 'all' ? 'すべての状態' : LISTING_STATUS_LABEL[status]}
          active={status !== 'all'}
          onPress={() => setSheet('status')}
        />
      </View>

      {listings.isPending ? (
        <Loading />
      ) : listings.isError ? (
        <LoadError onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={listings.isRefetching}
              onRefresh={() => void refetch()}
              tintColor={adminColors.accent}
            />
          }
        >
          {items.length > 0 ? (
            <>
              <View style={styles.count}>
                <Text style={styles.countNum}>{items.length}件</Text>
                <Text style={styles.countSub}>公開期間の新しい順</Text>
              </View>
              <GroupList>
                {items.map((l) => (
                  <ListingRow key={l.id} listing={l} />
                ))}
              </GroupList>
            </>
          ) : filtered ? (
            <EmptyState
              icon="list"
              title="条件に合う掲載はありません"
              action={{
                label: '絞り込みをクリア',
                kind: 'secondary',
                onPress: () => {
                  setKind('all');
                  setStatus('all');
                },
              }}
            />
          ) : (
            <EmptyState
              icon="list"
              title="掲載はまだありません"
              body="右上の「＋ 掲載」から最初の掲載を作りましょう。"
            />
          )}
        </ScrollView>
      )}

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
      <PopMenu
        visible={menuOpen}
        anchorRef={addRef}
        onClose={() => setMenuOpen(false)}
        testID="add-menu"
        items={ADD_MENU.map((m) => ({
          key: m.kind,
          label: m.label,
          icon: m.icon,
          onPress: () =>
            router.push({
              pathname: '/staff/[storeId]/listings/new',
              params: { storeId: store.id, kind: m.kind },
            }),
        }))}
      />
    </StaffScreen>
  );
}

/** 行：タイトル＋予約数／種類ラベル＋予定＋状態ピル（公開以外のときだけ） */
function ListingRow({ listing: l }: { listing: StaffListing }) {
  const metric = listingMetric(l);
  return (
    <Pressable
      testID={`staff-listing-${l.id}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/staff/[storeId]/listings/[id]',
          params: { storeId: l.storeId, id: l.id },
        })
      }
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle}>{l.title}</Text>
        {metric ? <Text style={styles.metric}>{metric}</Text> : null}
      </View>
      <View style={styles.rowSecond}>
        <KindLabel kind={l.kind} />
        <Text style={styles.rowSchedule} numberOfLines={1}>
          {listingScheduleLine(l)}
        </Text>
        {l.displayStatus !== 'published' ? <ListingStatusPill status={l.displayStatus} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  add: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: adminColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: adminColors.white, fontSize: 13.5, fontWeight: '700' },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: adminSpace.screenX,
    paddingTop: 14,
    paddingBottom: 12,
  },
  content: { paddingHorizontal: adminSpace.screenX, paddingBottom: 24 },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  countNum: { fontSize: 14, fontWeight: '800', color: adminColors.text },
  countSub: { fontSize: 12.5, fontWeight: '700', color: adminColors.textWeak },
  row: { paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 21.6, color: adminColors.text },
  metric: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.text,
    fontVariant: ['tabular-nums'],
  },
  rowSecond: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowSchedule: { fontSize: 13, color: adminColors.textSub, flexShrink: 1 },
});
