import type { ReactNode } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { LinkButton } from '@/components/Buttons';
import { Card, Divider } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Tag } from '@/components/Pills';
import { formatDateTimeJa } from '@/lib/format';
import { colors } from '@/theme/tokens';

import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '../master';

export function openMap(address: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  void Linking.openURL(url);
}

/** 「できます（10/5(月) 10:00 まで）」／「できません」 */
export function cancelText(deadline: Date | null): string {
  return deadline ? `できます（${formatDateTimeJa(deadline)} まで）` : 'できません';
}

type ScheduleProps = {
  timeIcon: IconName;
  timeLabel: string;
  time: string;
  placeLabel: string;
  placeName: string;
  address: string;
};

/** 日時（受け取り時間）と場所（地図アプリで開く） */
export function ScheduleCard({
  timeIcon,
  timeLabel,
  time,
  placeLabel,
  placeName,
  address,
}: ScheduleProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.row, styles.center]}>
        <Icon name={timeIcon} size={22} color={colors.accent} strokeWidth={1.9} />
        <View style={styles.flex}>
          <Text style={styles.label}>{timeLabel}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
      <Divider />
      <View style={styles.row}>
        <View style={{ marginTop: 2 }}>
          <Icon name="pin" size={22} color={colors.accent} strokeWidth={1.9} />
        </View>
        <View style={[styles.flex, { gap: 3 }]}>
          <Text style={styles.label}>{placeLabel}</Text>
          <Text style={styles.place}>{placeName}</Text>
          <Text style={styles.address}>{address}</Text>
          <LinkButton
            label="地図アプリで開く ↗"
            onPress={() => openMap(address)}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Card>
  );
}

/** 区切り線で並ぶ項目のカード（お支払い・キャンセル・条件など） */
export function TermsCard({ children }: { children: ReactNode[] }) {
  const items = children.filter(Boolean);
  return (
    <Card style={styles.card}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <Divider /> : null}
          {child}
        </View>
      ))}
    </Card>
  );
}

export function TermsItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={[styles.block, { gap: 4 }]}>
      <Text style={styles.label}>{label}</Text>
      {typeof children === 'string' ? <Text style={styles.value}>{children}</Text> : children}
    </View>
  );
}

/** 長めの文章（食品表示・参加条件・仕事内容） */
export function TermsText({ label, text }: { label: string; text: string }) {
  return (
    <View style={[styles.block, { gap: 6 }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

/** お支払い方法のチップ（店舗の設定、A-02） */
export function PaymentItem({ label, methods }: { label: string; methods: PaymentMethod[] }) {
  return (
    <View style={[styles.block, { gap: 8 }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.methods}>
        {methods.map((m) => (
          <Tag
            key={m}
            label={PAYMENT_METHOD_LABELS[m]}
            bg={colors.bg}
            fg={colors.text}
            fontSize={13.5}
            style={styles.method}
          />
        ))}
      </View>
      <Text style={styles.note}>アプリでのお支払いはありません</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  center: { alignItems: 'center' },
  flex: { flex: 1 },
  block: { paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textWeak },
  time: { fontSize: 18, fontWeight: '800', color: colors.text },
  place: { fontSize: 16, fontWeight: '800', color: colors.text },
  address: { fontSize: 14, lineHeight: 21, color: colors.textSub },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  method: { paddingVertical: 6, paddingHorizontal: 12 },
  note: { fontSize: 12.5, color: colors.textWeak },
  value: { fontSize: 15, fontWeight: '700', color: colors.text },
  text: { fontSize: 14.5, lineHeight: 24, color: colors.text },
});
