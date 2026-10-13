import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { LoadError, Loading } from '@/components/LoadState';
import { NumberCard } from '@/components/NumberCard';
import { numberLabel, placeName, titleWithQuantity } from '@/features/bookings/derive';
import { useBooking } from '@/features/bookings/hooks';
import type { MyBooking } from '@/features/bookings/types';
import { formatDateTimeJa, formatPickup, formatYen } from '@/lib/format';
import { colors, kindColors } from '@/theme/tokens';

/** 完了画面からタブへ戻る（予約の画面をスタックから外す） */
function backToTabs(path: '/' | '/bookings' | '/events') {
  if (router.canDismiss()) {
    router.dismissAll();
    router.navigate(path);
  } else {
    // Web で完了画面を直接開いたときなど、下に画面がない
    router.replace(path);
  }
}

const HEADLINE = {
  product: '予約が完了しました',
  event: '申し込みが完了しました',
  job: '応募を受け付けました',
} as const;

/** U-20 完了（予約番号）。地の色＝種類 */
export default function BookingDoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useBooking(id);
  const insets = useSafeAreaInsets();
  const color = kindColors[data?.kind ?? 'product'].main;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: color }]}>
      <StatusBar style="light" />
      {isPending ? (
        <Loading />
      ) : isError || !data ? (
        <View style={styles.errorBox}>
          <LoadError onRetry={() => void refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.head}>
            <Icon name="check" size={60} color={colors.white} strokeWidth={1.8} />
            <Text style={styles.headText} accessibilityRole="header">
              {HEADLINE[data.kind]}
            </Text>
          </View>
          <NumberCard label={numberLabel(data.kind)} number={data.number} elevated>
            <Text style={styles.item}>{titleWithQuantity(data)}</Text>
            <View style={styles.rule} />
            <Steps booking={data} color={color} />
            {data.kind === 'job' ? (
              <Text style={styles.jobNote}>アプリには採用の結果は表示されません</Text>
            ) : null}
          </NumberCard>
        </ScrollView>
      )}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton
          label="予約・申込を見る"
          onPress={() => backToTabs('/bookings')}
          height={56}
          labelSize={17}
          inverted
          labelColor={color}
          testID="go-bookings"
        />
        <TextButton
          label={data && data.kind !== 'product' ? 'イベント・求人へ戻る' : '商品一覧へ戻る'}
          color={colors.white}
          onPress={() => backToTabs(data && data.kind !== 'product' ? '/events' : '/')}
          style={{ height: 48 }}
        />
      </View>
    </View>
  );
}

function Steps({ booking: b, color }: { booking: MyBooking; color: string }) {
  const label = numberLabel(b.kind);
  const tellNumber = (
    <>
      {label}（<Text style={styles.bold}>{b.number}</Text>）とお名前を伝える
    </>
  );
  const steps: ReactNode[] =
    b.kind === 'product'
      ? [
          <>
            <Text style={styles.bold}>{formatPickup(b.listing.start, b.listing.end)}</Text> に{'\n'}
            <Text style={styles.bold}>{b.store.name}</Text>へ
          </>,
          tellNumber,
          b.amount != null ? (
            <>
              その場で <Text style={styles.bold}>{formatYen(b.amount)}円</Text> お支払い
            </>
          ) : null,
        ]
      : b.kind === 'event'
        ? [
            <>
              <Text style={styles.bold}>{formatDateTimeJa(b.listing.start)}</Text> までに{'\n'}
              <Text style={styles.bold}>{placeName(b)}</Text>へ
            </>,
            tellNumber,
            // 無料イベントは支払いの手順を出さない
            b.amount ? (
              <>
                受付で <Text style={styles.bold}>{formatYen(b.amount)}円</Text> お支払い
              </>
            ) : null,
          ]
        : [
            <>
              店舗からご登録の<Text style={styles.bold}>電話またはメール</Text>に連絡が届く
            </>,
            tellNumber,
          ];
  return (
    <View style={styles.steps}>
      {steps
        .filter((s) => s != null)
        .map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepNo, { backgroundColor: color }]}>
              <Text style={styles.stepNoText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  errorBox: { flex: 1, backgroundColor: colors.bg, margin: 20, borderRadius: 24 },
  content: { paddingTop: 28, paddingHorizontal: 20, gap: 16 },
  head: { alignItems: 'center', gap: 10 },
  headText: { fontSize: 24, fontWeight: '900', color: colors.white },
  item: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4, textAlign: 'center' },
  rule: { alignSelf: 'stretch', height: 1, backgroundColor: colors.line, marginVertical: 12 },
  steps: { alignSelf: 'stretch', gap: 14 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNoText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22.5, color: colors.text },
  bold: { fontWeight: '700' },
  jobNote: { fontSize: 12.5, color: colors.textWeak, marginTop: 12, textAlign: 'center' },
  actions: { paddingTop: 12, paddingHorizontal: 20, gap: 10 },
});
