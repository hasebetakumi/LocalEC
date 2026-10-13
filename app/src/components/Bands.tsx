import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

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

export type BandTone = 'gray' | 'danger' | 'info';

const TONES: Record<BandTone, { bg: string; fg: string }> = {
  gray: { bg: colors.grayPill, fg: colors.grayPillText },
  danger: { bg: colors.dangerLight, fg: colors.dangerText },
  info: { bg: colors.jobLight, fg: colors.infoText },
};

/**
 * 帯（灰・赤・青）。押せない理由、保存の結果、A-21 の期限切れの説明など（利用者側・運営側で共通）。
 * ボタンの直上・直下に出すときは中央寄せ、表の上などに出すときは左寄せ。
 * 読み上げの割り込み（alert）は赤帯だけ
 */
export function Band({
  text,
  tone = 'gray',
  align = 'left',
  style,
  testID,
}: {
  text: string;
  tone?: BandTone;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = TONES[tone];
  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={[styles.band, { backgroundColor: c.bg }, style]}
    >
      <Text style={[styles.bandText, { color: c.fg }, align === 'center' && styles.center]}>
        {text}
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
  band: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  bandText: { fontSize: 14, fontWeight: '700', lineHeight: 22 },
  center: { textAlign: 'center' },
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
