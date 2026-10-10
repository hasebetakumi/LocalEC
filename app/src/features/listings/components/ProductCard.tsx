import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, RemainPill } from '@/components/Pills';
import { Price } from '@/components/Price';
import { formatPickup } from '@/lib/format';
import { colors, radius, shadow } from '@/theme/tokens';

import { availability, badge, remainLabel } from '../derive';
import type { Product } from '../types';

import { ProductPhoto } from './ProductPhoto';

type Props = {
  product: Product;
  now: Date;
  /**
   * wide：ホームの横スクロール（幅 292・写真 150）
   * fresh：ホームの新着（受け取り・価格なし）
   * list：一覧（全幅・写真 140）
   */
  variant: 'wide' | 'fresh' | 'list';
};

/** 商品カード。写真（左上バッジ・右上残数）→ 店舗 → 商品名 → 受け取り・価格 */
export function ProductCard({ product: p, now, variant }: Props) {
  const state = availability(p, now);
  const b = badge(p, now, variant === 'fresh' ? { prefer: 'new' } : {});
  const closed = state === 'deadline_passed' || state === 'ended';
  const soldOut = state === 'sold_out';
  const pickup = formatPickup(p.pickupStart, p.pickupEnd, {
    withDate: false,
  });

  return (
    <Pressable
      testID={`product-card-${p.id}`}
      onPress={() => router.push({ pathname: '/listings/[id]', params: { id: p.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${p.store.name} ${p.title}`}
      style={({ pressed }) => [
        styles.card,
        variant !== 'list' && styles.wide,
        pressed && { opacity: 0.92 },
      ]}
    >
      <ProductPhoto
        uri={p.photoUrl}
        height={variant === 'list' ? 140 : 150}
        tone={variant === 'fresh' ? 'fresh' : 'default'}
        overlayLabel={soldOut ? '売り切れ' : null}
      >
        {b ? (
          <View style={styles.badgePos}>
            <Badge badge={b} />
          </View>
        ) : null}
        <View style={styles.remainPos}>
          <RemainPill label={closed ? '受付終了' : remainLabel(p)} closed={closed} />
        </View>
      </ProductPhoto>
      <View style={[styles.body, variant === 'list' && styles.bodyList]}>
        <Text style={styles.store} numberOfLines={1}>
          {p.store.name}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {p.title}
        </Text>
        {variant === 'fresh' ? null : (
          <View style={[styles.bottom, variant === 'list' && { marginTop: 2 }]}>
            {variant === 'wide' ? (
              <Text style={styles.pickup}>
                受け取り{'\n'}
                <Text style={styles.pickupWideTime}>{pickup}</Text>
              </Text>
            ) : (
              <Text style={styles.pickupList}>
                受け取り <Text style={styles.bold}>{pickup}</Text>
              </Text>
            )}
            <Price
              price={p.price}
              originalPrice={p.originalPrice}
              size={24}
              muted={state !== 'open'}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  wide: { width: 292 },
  badgePos: { position: 'absolute', top: 10, left: 10 },
  remainPos: { position: 'absolute', top: 10, right: 10 },
  body: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  bodyList: { gap: 3 },
  store: { fontSize: 12, fontWeight: '700', color: colors.textWeak },
  title: { fontSize: 16.5, fontWeight: '700', lineHeight: 22, color: colors.text },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  pickup: { fontSize: 12.5, lineHeight: 18, color: colors.textSub, flexShrink: 1 },
  pickupWideTime: { fontSize: 13.5, fontWeight: '700' },
  pickupList: { fontSize: 13, color: colors.textSub, flexShrink: 1 },
  bold: { fontWeight: '700' },
});
