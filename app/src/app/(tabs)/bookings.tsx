import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/KindPills';
import { LoadError, Loading } from '@/components/LoadState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  activeRowText,
  groupActive,
  historyLine,
  historyList,
  statusPill,
  titleWithQuantity,
} from '@/features/bookings/derive';
import { useMyBookings } from '@/features/bookings/hooks';
import type { MyBooking } from '@/features/bookings/types';
import { useNow } from '@/hooks/useNow';
import { formatDateJa } from '@/lib/format';
import { colors, kindColors, shadow, space } from '@/theme/tokens';

type Tab = 'active' | 'history';
const TABS = [
  { value: 'active', label: '予約・申し込み中' },
  { value: 'history', label: '履歴' },
] as const;

function openDetail(b: MyBooking) {
  router.push({ pathname: '/bookings/[id]', params: { id: b.id } });
}

/** U-22 予約・申込（予約・申し込み中／履歴） */
export default function BookingsScreen() {
  const [tab, setTab] = useState<Tab>('active');
  const { session, loading } = useAuth();
  const now = useNow();
  const bookings = useMyBookings(session?.user.id);
  const { refetch } = bookings;

  // 予約した後にタブへ戻ってきたら取り直す
  useFocusEffect(
    useCallback(() => {
      if (session) void refetch();
    }, [session, refetch]),
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        予約・申込
      </Text>
      {session ? <SegmentedControl options={TABS} value={tab} onChange={setTab} /> : null}
    </View>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }
  if (!session) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="ticket"
          title="ログインすると予約・申し込みが表示されます"
          action={{
            label: 'ログイン・新規登録',
            onPress: () => router.push('/auth/login'),
            kind: 'primary',
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      {bookings.isPending ? (
        <Loading />
      ) : bookings.isError ? (
        <LoadError onRetry={() => void refetch()} />
      ) : tab === 'active' ? (
        <ActiveList
          bookings={bookings.data}
          now={now}
          refreshing={bookings.isRefetching}
          onRefresh={refetch}
        />
      ) : (
        <HistoryList
          bookings={bookings.data}
          now={now}
          refreshing={bookings.isRefetching}
          onRefresh={refetch}
        />
      )}
    </Screen>
  );
}

type ListProps = {
  bookings: MyBooking[];
  now: Date;
  refreshing: boolean;
  onRefresh: () => unknown;
};

function ActiveList({ bookings, now, refreshing, onRefresh }: ListProps) {
  const groups = groupActive(bookings, now);
  if (groups.length === 0) {
    return (
      <EmptyState
        icon="ticket"
        title="予約・申し込みはまだありません"
        body={'商品やイベントを予約すると、\nここに表示されます。'}
        action={{ label: '商品を見る', onPress: () => router.navigate('/'), kind: 'primary' }}
      />
    );
  }
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.accent}
        />
      }
    >
      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <View style={styles.groupHead}>
            <Text style={[styles.groupTitle, g.isToday && { color: colors.accent }]}>
              {g.isToday ? '今日' : formatDateJa(g.date)}
            </Text>
            {g.isToday ? <Text style={styles.groupSub}>{formatDateJa(g.date)}</Text> : null}
          </View>
          <View style={styles.groupCard}>
            {g.items.map((b, i) => {
              const { time, where } = activeRowText(b);
              return (
                <Pressable
                  key={b.id}
                  testID={`booking-row-${b.number}`}
                  accessibilityRole="button"
                  onPress={() => openDetail(b)}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowBorder,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: kindColors[b.kind].main }]} />
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{titleWithQuantity(b)}</Text>
                    <Text style={styles.rowTime}>{time}</Text>
                    <Text style={styles.rowWhere}>{where}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowStatus}>{statusPill(b, now).label}</Text>
                    <Text style={styles.rowNumber}>{b.number}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function HistoryList({ bookings, now, refreshing, onRefresh }: ListProps) {
  const items = historyList(bookings, now);
  if (items.length === 0) {
    return <EmptyState icon="ticket" title="履歴はまだありません" />;
  }
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { gap: 10 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.accent}
        />
      }
    >
      {items.map((b) => {
        const pill = statusPill(b, now);
        return (
          <Pressable
            key={b.id}
            testID={`history-${b.number}`}
            accessibilityRole="button"
            onPress={() => openDetail(b)}
            style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.9 }]}
          >
            <StatusPill label={pill.label} tone={pill.tone} />
            <Text style={styles.rowTitle}>{titleWithQuantity(b)}</Text>
            <Text style={styles.historyLine}>{historyLine(b, now)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 14, gap: 14 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3, color: colors.text },
  content: { paddingHorizontal: space.screenX, paddingBottom: 24, gap: 16 },
  group: { gap: 8 },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingLeft: 4 },
  groupTitle: { fontSize: 17, fontWeight: '900', color: colors.text },
  groupSub: { fontSize: 12.5, fontWeight: '700', color: colors.textWeak },
  groupCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...shadow.card },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15.5, fontWeight: '800', lineHeight: 21, color: colors.text },
  rowTime: { fontSize: 12.5, color: colors.textSub },
  rowWhere: { fontSize: 12.5, color: colors.textWeak },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowStatus: { fontSize: 11, fontWeight: '700', color: colors.textWeak },
  rowNumber: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.4,
    lineHeight: 19,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
    ...shadow.card,
  },
  historyLine: { fontSize: 13, color: colors.textSub },
});
