import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { AvatarMenu } from '@/components/admin/AvatarMenu';
import { GroupList } from '@/components/admin/GroupList';
import { NumberSearchField } from '@/components/admin/NumberSearchField';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { BookingRow } from '@/features/staff/components/BookingRow';
import { useBookingSearch, useStoreSummaries } from '@/features/staff/hooks';
import type { StoreSummary } from '@/features/staff/types';
import { useNow } from '@/hooks/useNow';
import { adminColors, adminShadow, adminSpace } from '@/theme/adminTokens';

function goBackToMyPage() {
  if (router.canGoBack()) router.back();
  else router.replace('/mypage');
}

/** A-01 店舗を選ぶ（スタッフメニューの入口）＋全店舗の番号検索 */
export default function StoreSelectScreen() {
  const summaries = useStoreSummaries();
  const { refetch } = summaries;
  const [number, setNumber] = useState('');
  const search = useBookingSearch(number);
  const now = useNow();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <StaffScreen>
      <StaffNavBar title="マイページ" onBack={goBackToMyPage} right={<AvatarMenu />} />
      {summaries.isPending ? (
        <Loading />
      ) : summaries.isError ? (
        <LoadError onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={summaries.isRefetching}
              onRefresh={() => void refetch()}
              tintColor={adminColors.accent}
            />
          }
        >
          <Text style={styles.title} accessibilityRole="header">
            店舗を選ぶ
          </Text>
          {summaries.data.length === 0 ? (
            <EmptyState
              icon="store"
              title="担当する店舗がありません"
              body="店舗を追加するか、MeiN にお問い合わせください。"
              action={{
                label: '＋ 店舗を追加',
                onPress: () => router.push('/staff/new-store'),
                kind: 'primary',
              }}
            />
          ) : (
            summaries.data.map((s) => <StoreCard key={s.id} store={s} />)
          )}
          {summaries.data.length > 0 ? (
            <Pressable
              testID="add-store"
              accessibilityRole="button"
              onPress={() => router.push('/staff/new-store')}
              style={styles.addStore}
              hitSlop={8}
            >
              <Text style={styles.addStoreText}>＋ 店舗を追加</Text>
            </Pressable>
          ) : null}

          <View style={styles.search}>
            <Text style={styles.searchTitle}>番号で探す</Text>
            <NumberSearchField value={number} onChange={setNumber} testID="global-number-search" />
            <Text style={styles.searchHint}>
              店舗が分からない予約はここから。該当する店舗の予約・申し込みが開きます
            </Text>
            {number ? (
              search.isPending ? (
                <Loading />
              ) : search.data && search.data.length > 0 ? (
                <GroupList>
                  {search.data.map((r) => (
                    <BookingRow
                      key={r.id}
                      row={r}
                      now={now}
                      right="time"
                      second="item"
                      showStore
                      onPress={() =>
                        router.push({
                          pathname: '/staff/[storeId]/bookings/[bookingId]',
                          params: { storeId: r.storeId, bookingId: r.id },
                        })
                      }
                    />
                  ))}
                </GroupList>
              ) : (
                <Text style={styles.noResult}>該当する予約はありません</Text>
              )
            ) : null}
          </View>
        </ScrollView>
      )}
    </StaffScreen>
  );
}

/** 店舗カード：公開中の掲載（なければ公開予定・下書き）と本日の予定 */
function StoreCard({ store: s }: { store: StoreSummary }) {
  const posts =
    s.publishedCount > 0
      ? `公開中の掲載 ${s.publishedCount}件`
      : s.scheduledCount > 0
        ? `公開予定の掲載 ${s.scheduledCount}件`
        : s.draftCount > 0
          ? `下書きの掲載 ${s.draftCount}件`
          : '公開中の掲載 0件';
  return (
    <Pressable
      testID={`store-card-${s.id}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/staff/[storeId]/listings', params: { storeId: s.id } })
      }
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cardMain}>
        <Text style={styles.cardName}>{s.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPosts}>{posts}</Text>
          <Text style={s.todayCount > 0 ? styles.todayOn : styles.todayOff}>
            {s.todayCount > 0 ? `本日の予定 ${s.todayCount}件` : '本日の予定 なし'}
          </Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: adminSpace.screenX, paddingBottom: 32, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: adminColors.text },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...adminShadow.card,
  },
  cardMain: { flex: 1, gap: 4 },
  cardName: { fontSize: 17, fontWeight: '800', color: adminColors.text },
  cardMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  cardPosts: { fontSize: 13, color: adminColors.textSub },
  todayOn: { fontSize: 13, fontWeight: '800', color: adminColors.done },
  todayOff: { fontSize: 13, color: adminColors.placeholder2 },
  arrow: { fontSize: 22, color: adminColors.placeholder2 },
  addStore: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 2 },
  addStoreText: { fontSize: 14, fontWeight: '700', color: adminColors.accent },
  search: { gap: 8, marginTop: 8 },
  searchTitle: { fontSize: 17, fontWeight: '800', color: adminColors.text },
  searchHint: { fontSize: 12.5, lineHeight: 19, color: adminColors.textWeak },
  noResult: { fontSize: 14, color: adminColors.textWeak, paddingVertical: 8 },
});
