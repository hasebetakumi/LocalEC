import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/** 詳細の写真直下の帯（残り数＋締切）。受付中は黄、終了・売り切れは灰 */
export function InfoBand({
  left,
  right,
  closed,
}: {
  left: string;
  right: string;
  closed: boolean;
}) {
  const fg = closed ? colors.grayPillText : colors.noticeBandText;
  return (
    <View style={[styles.info, { backgroundColor: closed ? colors.grayPill : colors.noticeBand }]}>
      <Text style={[styles.infoLeft, { color: fg }]}>{left}</Text>
      <Text style={[styles.infoRight, { color: fg }]}>{right}</Text>
    </View>
  );
}

/** 押せない理由など。danger＝赤、info＝青 */
export function MessageBand({
  message,
  tone = 'danger',
  style,
  testID,
}: {
  message: string;
  tone?: 'danger' | 'info';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const isDanger = tone === 'danger';
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[
        styles.message,
        { backgroundColor: isDanger ? colors.dangerLight : colors.jobLight },
        style,
      ]}
    >
      <Text style={[styles.messageText, { color: isDanger ? colors.dangerText : colors.infoText }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLeft: { fontSize: 14, fontWeight: '800' },
  infoRight: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  message: { borderRadius: radius.input, paddingVertical: 10, paddingHorizontal: 14 },
  messageText: { fontSize: 14, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
});

/** 青い案内の箱（求人の「応募後、店舗から…」）。左寄せ・通常の太さ */
export function InfoNote({ text, fontSize = 14 }: { text: string; fontSize?: number }) {
  return (
    <View style={noteStyles.box}>
      <Text style={[noteStyles.text, { fontSize, lineHeight: fontSize * 1.65 }]}>{text}</Text>
    </View>
  );
}

const noteStyles = StyleSheet.create({
  box: {
    backgroundColor: colors.jobLight,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: { color: colors.infoText },
});
