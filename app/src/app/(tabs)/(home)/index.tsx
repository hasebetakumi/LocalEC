import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { LoadError, Loading } from '@/components/LoadState';
import { Tag } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { ProductCard } from '@/features/listings/components/ProductCard';
import { SectionHeader } from '@/features/listings/components/SectionHeader';
import { groupHome, type ListSection } from '@/features/listings/derive';
import { useNotices, useProducts } from '@/features/listings/hooks';
import { CATEGORIES, type ProductCategory } from '@/features/listings/master';
import type { Product } from '@/features/listings/types';
import { useReadNoticeIds } from '@/features/notices/hooks';
import { unreadCount } from '@/features/notices/readState';
import { useNow } from '@/hooks/useNow';
import { colors, space } from '@/theme/tokens';

function openList(params: { section?: ListSection; category?: ProductCategory }) {
  router.push({ pathname: '/products', params });
}

/** U-10 商品（ホーム） */
export default function HomeScreen() {
  const now = useNow();
  const { data, isPending, isError, refetch, isRefetching } = useProducts();
  const groups = useMemo(() => groupHome(data ?? [], now), [data, now]);
  const notices = useNotices();
  const readIds = useReadNoticeIds();
  const unread = unreadCount(notices.data ?? [], readIds.data ?? [], now);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          商品
        </Text>
        {data ? (
          <Tag
            label={`${data.length}件`}
            bg={colors.accentLight}
            fg={colors.accent}
            style={{ alignSelf: 'center' }}
          />
        ) : null}
        <View style={styles.spacer} />
        <Pressable
          testID="bell"
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `お知らせ 未読${unread}件` : 'お知らせ'}
          onPress={() => router.push('/notices')}
          style={({ pressed }) => [styles.bell, pressed && { opacity: 0.8 }]}
        >
          <Icon name="bell" size={24} color={colors.text} strokeWidth={2} />
          {unread > 0 ? (
            <View style={styles.unread}>
              <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {isPending ? (
        <Loading />
      ) : isError ? (
        <LoadError onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon="bag"
          title="いまは商品がありません"
          body="新しい商品は通知でお知らせします。"
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.accent}
            />
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                accessibilityLabel={c.label}
                onPress={() => openList({ category: c.key })}
                style={({ pressed }) => [styles.category, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.categoryPhoto}>
                  <Text style={styles.categoryPhotoText}>{c.label}</Text>
                </View>
                <Text style={styles.categoryLabel}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {groups.soon.length > 0 ? (
            <Band
              title="もうすぐ終了！"
              items={groups.soon}
              now={now}
              variant="wide"
              onSeeAll={() => openList({ section: 'soon' })}
            />
          ) : null}
          {groups.fresh.length > 0 ? (
            <Band
              title="新着"
              items={groups.fresh}
              now={now}
              variant="fresh"
              onSeeAll={() => openList({ section: 'new' })}
            />
          ) : null}
          {groups.byCategory.map((g) => (
            <Band
              key={g.category}
              title={g.label}
              items={g.items}
              now={now}
              variant="wide"
              onSeeAll={() => openList({ category: g.category })}
            />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function Band({
  title,
  items,
  now,
  variant,
  onSeeAll,
}: {
  title: string;
  items: Product[];
  now: Date;
  variant: 'wide' | 'fresh';
  onSeeAll: () => void;
}) {
  return (
    <View style={styles.band}>
      <SectionHeader title={title} onSeeAll={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bandRow}
        decelerationRate="fast"
        snapToInterval={292 + 12}
        snapToAlignment="start"
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} now={now} variant={variant} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.screenX,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3, color: colors.text },
  spacer: { flex: 1 },
  unread: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: colors.white, fontSize: 11, fontWeight: '800', lineHeight: 13 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingTop: 8, paddingBottom: 24, gap: space.section },
  categoryRow: { paddingHorizontal: space.screenX, gap: 14 },
  category: { width: 78, alignItems: 'center', gap: 8 },
  categoryPhoto: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: colors.photo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPhotoText: { fontSize: 11, fontWeight: '700', color: colors.photoText },
  categoryLabel: { fontSize: 12, fontWeight: '700', letterSpacing: -0.25, color: colors.text },
  band: { gap: 12 },
  // 影が切れないよう上下に少し余白を取る
  bandRow: { paddingHorizontal: space.screenX, gap: 12, paddingVertical: 2 },
});
