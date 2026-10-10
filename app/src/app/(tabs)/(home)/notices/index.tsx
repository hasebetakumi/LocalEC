import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { BackButton, Screen } from '@/components/Screen';
import { useNotices } from '@/features/listings/hooks';
import { useReadNoticeIds } from '@/features/notices/hooks';
import { isUnread } from '@/features/notices/readState';
import { useNow } from '@/hooks/useNow';
import { formatDateJa } from '@/lib/format';
import { colors, radius, shadow, space } from '@/theme/tokens';

/** U-11 お知らせ一覧（ホームのベルから） */
export default function NoticesScreen() {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const notices = useNotices();
  const readIds = useReadNoticeIds();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ marginLeft: -10 }}>
          <BackButton />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          お知らせ
        </Text>
      </View>
      {notices.isPending ? (
        <Loading />
      ) : notices.isError ? (
        <LoadError onRetry={() => void notices.refetch()} />
      ) : (
        <FlatList
          data={notices.data}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            notices.data.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={notices.isRefetching}
              onRefresh={() => void notices.refetch()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => {
            const unread = isUnread(item, readIds.data ?? [], now);
            return (
              <Pressable
                testID={`notice-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${unread ? '未読 ' : ''}${item.title}`}
                onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{formatDateJa(item.publishStart)}</Text>
                  <Text style={[styles.metaText, styles.store]} numberOfLines={1}>
                    {item.store.name}
                  </Text>
                  {unread ? (
                    <View style={styles.new}>
                      <Text style={styles.newText}>NEW</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="お知らせはまだありません"
              body={'地域のニュースやお店からの\nお知らせがここに届きます。'}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.screenX,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3, color: colors.text },
  list: { paddingHorizontal: space.screenX, gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 5,
    ...shadow.card,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12.5, fontWeight: '700', color: colors.textWeak },
  store: { flexShrink: 1 },
  new: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  newText: { color: colors.white, fontSize: 10.5, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 23, color: colors.text },
  body: { fontSize: 13.5, lineHeight: 21.5, color: colors.textSub },
});
