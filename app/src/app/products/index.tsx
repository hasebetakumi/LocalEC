import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChip } from '@/components/Chips';
import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { FilterSheet, type FilterValue } from '@/features/listings/components/FilterSheet';
import { ProductCard } from '@/features/listings/components/ProductCard';
import { filterProducts, type ListSection } from '@/features/listings/derive';
import { useProducts, useStores } from '@/features/listings/hooks';
import { categoryLabel, isProductCategory } from '@/features/listings/master';
import { useNow } from '@/hooks/useNow';
import { colors, space } from '@/theme/tokens';

type Params = { section?: string; category?: string; store?: string };

function parseSection(value: string | undefined): ListSection | undefined {
  return value === 'soon' || value === 'new' ? value : undefined;
}

/** U-10 一覧（すべて見る）＋ U-13 絞り込み。条件は URL に持つので戻っても残る */
export default function ProductListScreen() {
  const params = useLocalSearchParams<Params>();
  const section = parseSection(params.section);
  const category = isProductCategory(params.category) ? params.category : undefined;
  const storeId = params.store || undefined;

  const now = useNow();
  const insets = useSafeAreaInsets();
  const products = useProducts();
  const stores = useStores();
  const [sheetOpen, setSheetOpen] = useState(false);

  const items = useMemo(
    () => filterProducts(products.data ?? [], { section, category, storeId }, now),
    [products.data, section, category, storeId, now],
  );

  // タイトルは来た帯で決める。カテゴリの帯から来たときはカテゴリ名
  const title =
    section === 'soon'
      ? 'もうすぐ終了！'
      : section === 'new'
        ? '新着'
        : category
          ? categoryLabel(category)
          : '商品';
  const storeName = stores.data?.find((s) => s.id === storeId)?.name;
  const hasFilter = !!category || !!storeId;

  const apply = (v: FilterValue) => {
    router.setParams({ category: v.category ?? '', store: v.storeId ?? '' });
  };

  return (
    <Screen>
      <NavBar title={title} />
      <View style={styles.chips}>
        <FilterChip
          testID="filter-category"
          label={`カテゴリ：${category ? categoryLabel(category) : 'すべて'}`}
          active={!!category}
          onPress={() => setSheetOpen(true)}
        />
        <FilterChip
          testID="filter-store"
          label={`店舗：${storeName ?? 'すべて'}`}
          active={!!storeId}
          onPress={() => setSheetOpen(true)}
        />
      </View>

      {products.isPending ? (
        <Loading />
      ) : products.isError ? (
        <LoadError onRetry={() => void products.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProductCard product={item} now={now} variant="list" />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            items.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={products.isRefetching}
              onRefresh={() => void products.refetch()}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            hasFilter ? (
              <EmptyState
                icon="bag"
                title="条件に合う商品はありません"
                body={'別のカテゴリや店舗をお試しください。\n新しい商品は通知でお知らせします。'}
                action={{ label: '絞り込みをクリア', onPress: () => apply({}), kind: 'secondary' }}
              />
            ) : (
              <EmptyState
                icon="bag"
                title="いまは商品がありません"
                body="新しい商品は通知でお知らせします。"
              />
            )
          }
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        value={{ category, storeId }}
        stores={stores.data ?? []}
        onApply={apply}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: space.screenX,
    paddingTop: 4,
    paddingBottom: 12,
  },
  list: { paddingHorizontal: space.screenX, gap: 12, paddingTop: 2 },
});
