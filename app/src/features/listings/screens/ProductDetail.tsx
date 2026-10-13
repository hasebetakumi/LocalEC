import { StyleSheet, Text, View } from 'react-native';

import { Band, InfoBand } from '@/components/Bands';
import { BottomBar } from '@/components/BottomBar';
import { PrimaryButton } from '@/components/Buttons';
import { HeroScroll } from '@/components/HeroScroll';
import { Badge, Tag } from '@/components/Pills';
import { Price } from '@/components/Price';
import { Screen } from '@/components/Screen';
import { useStartBooking } from '@/features/auth/useBookingGate';
import { useNow } from '@/hooks/useNow';
import { formatDateTimeJa, formatDeadline, formatPickup } from '@/lib/format';
import { colors } from '@/theme/tokens';

import {
  cancelText,
  PaymentItem,
  ScheduleCard,
  TermsCard,
  TermsItem,
  TermsText,
} from '../components/DetailCards';
import { ProductPhoto } from '../components/ProductPhoto';
import { availability, badge, discountLabel, remainLabel, type Availability } from '../derive';
import type { Product } from '../types';

/** 予約できない理由（ボタンの直上に出す。design 05） */
function blockedMessage(state: Availability, p: Product): string | null {
  switch (state) {
    case 'sold_out':
      return '売り切れのため、予約できません。';
    case 'deadline_passed':
    case 'ended':
      return `予約の受付は ${formatDateTimeJa(p.bookingDeadline)} で終了しました。`;
    default:
      return null;
  }
}

/** U-12 商品詳細 */
export function ProductDetail({ product }: { product: Product }) {
  const now = useNow();
  const startBooking = useStartBooking();

  const p = product;
  const state = availability(p, now);
  const isOpen = state === 'open';
  const photoBadge = badge(p, now, { excludeDiscount: true });
  const discount = discountLabel(p);
  const message = blockedMessage(state, p);

  return (
    <Screen padTop={false}>
      <HeroScroll
        title={p.title}
        photoHeight={300}
        photoUri={p.photoUrl}
        photo={
          <ProductPhoto
            uri={p.photoUrl}
            height={300}
            overlayLabel={state === 'sold_out' ? '売り切れ' : null}
            overlaySize="lg"
          >
            {photoBadge ? (
              <View style={styles.photoBadge}>
                <Badge badge={photoBadge} size="md" />
              </View>
            ) : null}
          </ProductPhoto>
        }
        band={
          <InfoBand
            left={remainLabel(p)}
            right={
              // 売り切れは締切をそのまま、締切後・公開終了は「終了しました」（design 05）
              isOpen || state === 'sold_out'
                ? `予約締切 ${formatDeadline(p.bookingDeadline, now)}`
                : '予約受付は終了しました'
            }
            closed={!isOpen}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.main}>
          <View style={{ gap: 6 }}>
            <Text style={styles.store}>{p.store.name}</Text>
            <Text style={styles.title} accessibilityRole="header">
              {p.title}
            </Text>
            <View style={styles.priceRow}>
              <Price
                price={p.price}
                originalPrice={p.originalPrice}
                size={34}
                wasSize={15}
                yenUnit
                muted={!isOpen}
              />
              {discount ? (
                <Tag
                  label={discount}
                  bg={isOpen ? colors.accentLight : colors.grayPill}
                  fg={isOpen ? colors.accent : colors.grayPillText}
                  fontSize={12}
                  style={{ paddingHorizontal: 8, alignSelf: 'center' }}
                />
              ) : null}
            </View>
            {p.body ? <Text style={styles.body}>{p.body}</Text> : null}
          </View>

          <ScheduleCard
            timeIcon="clock"
            timeLabel="受け取り時間"
            time={formatPickup(p.pickupStart, p.pickupEnd)}
            placeLabel="受け取り場所"
            placeName={p.store.name}
            address={p.store.address}
          />
          <TermsCard>
            <PaymentItem label="お支払い（店頭で）" methods={p.store.paymentMethods} />
            <TermsItem label="キャンセル">{cancelText(p.cancelDeadline)}</TermsItem>
            <TermsText
              label="食品表示"
              text={p.foodLabel || 'アレルギー・原材料・消費期限などは店舗にお問い合わせください。'}
            />
          </TermsCard>
          {message ? (
            <Band text={message} tone="danger" align="center" testID="blocked-message" />
          ) : null}
        </View>
      </HeroScroll>

      <BottomBar>
        <Price
          price={p.price}
          originalPrice={p.originalPrice}
          size={26}
          stacked
          yenUnit
          muted={!isOpen}
        />
        <PrimaryButton
          testID="go-book"
          label={isOpen ? '予約へ進む' : '予約できません'}
          disabled={!isOpen}
          onPress={() => void startBooking(p.id)}
          style={{ flex: 1 }}
        />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoBadge: { position: 'absolute', left: 16, bottom: 16 },
  main: { paddingTop: 18, paddingHorizontal: 20, gap: 14 },
  store: { fontSize: 13.5, fontWeight: '700', color: colors.textWeak },
  title: { fontSize: 26, fontWeight: '900', lineHeight: 34, color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { fontSize: 15, lineHeight: 27, color: colors.textSub, marginTop: 4 },
});
