import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { KindPill } from '@/components/KindPills';
import { LoadError, Loading } from '@/components/LoadState';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  eventAvailability,
  isOpen,
  listMeta,
  listStatus,
  scheduleText,
} from '@/features/listings/eventJob';
import { useEventsAndJobs } from '@/features/listings/hooks';
import type { EventOrJob } from '@/features/listings/types';
import { useNow } from '@/hooks/useNow';
import { colors, radius, shadow, space } from '@/theme/tokens';

type Filter = 'all' | 'event' | 'job';
const FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'event', label: 'イベント' },
  { value: 'job', label: '求人' },
] as const;

/** U-11 イベント・求人一覧 */
export default function EventsScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();
  const list = useEventsAndJobs();
  const items = useMemo(
    () => (list.data ?? []).filter((l) => filter === 'all' || l.kind === filter),
    [list.data, filter],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          イベント・求人
        </Text>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <LoadError onRetry={() => void list.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => <EventJobCard listing={item} now={now} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title={
                filter === 'job'
                  ? 'いまは求人がありません'
                  : filter === 'event'
                    ? 'いまはイベントがありません'
                    : 'いまはイベント・求人がありません'
              }
              body="新しい掲載は通知でお知らせします。"
            />
          }
        />
      )}
    </Screen>
  );
}

function EventJobCard({ listing: l, now }: { listing: EventOrJob; now: Date }) {
  const full = l.kind === 'event' && eventAvailability(l, now) === 'full';
  const status = listStatus(l, now);
  const open = isOpen(l, now);
  return (
    <Pressable
      testID={`eventjob-card-${l.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${l.kind === 'event' ? 'イベント' : '求人'} ${l.title}`}
      onPress={() => router.push({ pathname: '/listings/[id]', params: { id: l.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View
        style={[
          styles.thumb,
          { backgroundColor: l.kind === 'event' ? colors.photoFresh : colors.photoJob },
        ]}
      >
        {l.photoUrl ? (
          <Image source={{ uri: l.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        {full ? (
          <>
            <View style={[StyleSheet.absoluteFill, styles.dim]} />
            <View style={styles.fullPill}>
              <Text style={styles.fullText}>満員</Text>
            </View>
          </>
        ) : null}
        <View style={styles.kindPos}>
          <KindPill kind={l.kind} size="sm" />
        </View>
      </View>
      <View style={styles.main}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {l.title}
        </Text>
        <Text style={styles.when}>
          {scheduleText(l)}
          {'\n'}
          {l.placeName}
        </Text>
        <View style={styles.bottom}>
          <Text style={[styles.meta, !open && { color: colors.placeholder }]} numberOfLines={1}>
            {listMeta(l)}
          </Text>
          {status ? (
            <Text style={status.tone === 'few' ? styles.few : styles.weak}>{status.label}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 14, gap: 14 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3, color: colors.text },
  list: { paddingHorizontal: space.screenX, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    ...shadow.card,
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: radius.thumb,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { backgroundColor: 'rgba(217,210,200,0.6)' },
  fullPill: {
    backgroundColor: colors.soldOutPill,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  fullText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  kindPos: { position: 'absolute', top: 6, left: 6 },
  main: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22.4, color: colors.text },
  when: { fontSize: 13, lineHeight: 20, color: colors.textSub },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  meta: { fontSize: 14, fontWeight: '800', color: colors.text, flexShrink: 1 },
  few: { fontSize: 12, fontWeight: '800', color: colors.danger },
  weak: { fontSize: 12, fontWeight: '700', color: colors.textWeak },
});
