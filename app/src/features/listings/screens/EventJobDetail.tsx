import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfoNote, MessageBand } from '@/components/Bands';
import { BottomBar } from '@/components/BottomBar';
import { PrimaryButton } from '@/components/Buttons';
import { KindPill } from '@/components/KindPills';
import { BackButton, Screen } from '@/components/Screen';
import { useStartBooking } from '@/features/auth/useBookingGate';
import { useNow } from '@/hooks/useNow';
import { formatDateJa, formatDateTimeJa } from '@/lib/format';
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
import {
  eventAvailability,
  isFree,
  isHeadcountReached,
  jobAvailability,
  payLabel,
  priceLabel,
  scheduleText,
} from '../eventJob';
import type { EventListing, EventOrJob, JobListing } from '../types';

export const APPLY_NOTE =
  '応募後、店舗からご登録の電話番号またはメールアドレスにご連絡いたします。';

/** U-12 イベント詳細・求人詳細 */
export function EventJobDetail({ listing }: { listing: EventOrJob }) {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const startBooking = useStartBooking();
  const l = listing;

  const view = l.kind === 'event' ? eventView(l, now) : jobView(l, now);

  return (
    <Screen padTop={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <ProductPhoto
          uri={l.photoUrl}
          height={250}
          tone={l.kind === 'event' ? 'fresh' : 'job'}
          overlayLabel={view.overlay}
          overlaySize="lg"
        >
          <View style={[styles.back, { top: Math.max(insets.top, 12) + 8 }]}>
            <BackButton onPhoto />
          </View>
          <View style={styles.kind}>
            <KindPill kind={l.kind} />
          </View>
        </ProductPhoto>

        <View style={[styles.band, { backgroundColor: view.band.bg }]}>
          <Text style={[styles.bandLeft, { color: view.band.fg }]}>{view.band.left}</Text>
          <Text style={[styles.bandRight, { color: view.band.fg }]}>{view.band.right}</Text>
        </View>

        <View style={styles.main}>
          <View style={{ gap: 6 }}>
            <Text style={styles.store}>{l.store.name}</Text>
            <Text style={styles.title} accessibilityRole="header">
              {l.title}
            </Text>
            <View style={styles.priceRow}>
              {view.priceUnit ? <Text style={styles.priceUnit}>{view.priceUnit}</Text> : null}
              <Text style={[styles.price, !view.open && styles.muted]}>{view.price}</Text>
            </View>
            {l.body ? <Text style={styles.body}>{l.body}</Text> : null}
          </View>

          <ScheduleCard
            timeIcon="calendar"
            timeLabel="日時"
            time={scheduleText(l)}
            placeLabel="場所"
            placeName={l.placeName}
            address={l.placeAddress}
          />
          {l.kind === 'event' ? (
            <TermsCard>
              <PaymentItem label="お支払い（当日受付で）" methods={l.store.paymentMethods} />
              <TermsItem label="キャンセル">{cancelText(l.cancelDeadline)}</TermsItem>
              {l.conditions ? <TermsText label="参加条件・持ち物" text={l.conditions} /> : null}
            </TermsCard>
          ) : (
            <TermsCard>
              <TermsItem label="応募の取り消し">{cancelText(l.cancelDeadline)}</TermsItem>
              {l.conditions ? <TermsText label="条件・仕事内容" text={l.conditions} /> : null}
            </TermsCard>
          )}
          {l.kind === 'job' ? <InfoNote text={APPLY_NOTE} /> : null}
          {view.message ? (
            <MessageBand
              message={view.message.text}
              tone={view.message.tone}
              testID="blocked-message"
            />
          ) : null}
        </View>
      </ScrollView>

      <BottomBar>
        {l.kind === 'event' ? (
          <View>
            <Text style={styles.barUnit}>1名</Text>
            <Text style={[styles.barPrice, !view.open && styles.muted]}>
              {isFree(l) ? (
                '無料'
              ) : (
                <>
                  {priceLabel(l).replace('円', '')}
                  <Text style={styles.barYen}>円</Text>
                </>
              )}
            </Text>
          </View>
        ) : null}
        <PrimaryButton
          testID="go-book"
          label={view.button}
          disabled={!view.open}
          onPress={() => void startBooking(l.id)}
          style={{ flex: 1 }}
        />
      </BottomBar>
    </Screen>
  );
}

type View_ = {
  open: boolean;
  overlay: string | null;
  band: { bg: string; fg: string; left: string; right: string };
  priceUnit: string | null;
  price: string;
  button: string;
  message: { text: string; tone: 'danger' | 'info' } | null;
};

function eventView(e: EventListing, now: Date): View_ {
  const state = eventAvailability(e, now);
  const open = state === 'open';
  const closedBand = state === 'deadline_passed' || state === 'ended';
  return {
    open,
    overlay: state === 'full' ? '満員' : null,
    band: {
      bg: open ? colors.noticeBand : colors.grayPill,
      fg: open ? colors.noticeBandText : colors.grayPillText,
      left: `残り定員 ${Math.max(e.remaining, 0)}名 / ${e.capacity}名`,
      right: closedBand
        ? '申し込み受付は終了しました'
        : `申し込み締切 ${formatDateJa(e.applicationDeadline)}`,
    },
    priceUnit: isFree(e) ? null : '1名',
    price: priceLabel(e),
    button: open ? '参加を申し込む' : '申し込みできません',
    message:
      state === 'full'
        ? {
            text: '定員に達したため、申し込みできません。キャンセルが出ると再び申し込めます。',
            tone: 'danger',
          }
        : closedBand
          ? {
              text: `申し込みの受付は ${formatDateTimeJa(e.applicationDeadline)} で終了しました。`,
              tone: 'danger',
            }
          : null,
  };
}

function jobView(j: JobListing, now: Date): View_ {
  const open = jobAvailability(j, now) === 'open';
  const pay = payLabel(j);
  return {
    open,
    overlay: null,
    band: {
      bg: open ? colors.jobLight : colors.grayPill,
      fg: open ? colors.jobText : colors.grayPillText,
      left: `募集 ${j.headcount}名・${open ? '応募受付中' : '受付終了'}`,
      right: open ? `応募締切 ${formatDateJa(j.applicationDeadline)}` : '応募受付は終了しました',
    },
    priceUnit: pay.unit,
    price: pay.amount,
    button: open ? 'この求人に応募する' : '応募できません',
    message: !open
      ? {
          text: `応募の受付は ${formatDateTimeJa(j.applicationDeadline)} で終了しました。`,
          tone: 'danger',
        }
      : isHeadcountReached(j)
        ? { text: '募集人数に達していますが、引き続き応募できます。', tone: 'info' }
        : null,
  };
}

const styles = StyleSheet.create({
  back: { position: 'absolute', left: 16 },
  kind: { position: 'absolute', left: 16, bottom: 16 },
  band: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  bandLeft: { fontSize: 14, fontWeight: '800' },
  bandRight: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  main: { paddingTop: 18, paddingHorizontal: 20, gap: 14 },
  store: { fontSize: 13.5, fontWeight: '700', color: colors.textWeak },
  title: { fontSize: 26, fontWeight: '900', lineHeight: 34, color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  priceUnit: { fontSize: 14, fontWeight: '700', color: colors.textWeak },
  price: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3, color: colors.text },
  muted: { color: colors.placeholder },
  body: { fontSize: 15, lineHeight: 27, color: colors.textSub, marginTop: 4 },
  barUnit: { fontSize: 12, color: colors.textWeak },
  barPrice: { fontSize: 26, fontWeight: '900', color: colors.text, lineHeight: 30 },
  barYen: { fontSize: 15 },
});
