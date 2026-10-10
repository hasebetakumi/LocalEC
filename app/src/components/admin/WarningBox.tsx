import { StyleSheet, Text, View } from 'react-native';

import { adminColors } from '@/theme/adminTokens';

/** 黄色い注意（A-12「予約が N 件入っています」） */
export function WarningBox({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>
        <Text style={styles.bold}>{title}</Text>
        {'\n'}
        {body}
      </Text>
    </View>
  );
}

/** 帯（灰・赤・青）。A-21 の期限切れの説明やエラー */
export function AdminBand({
  text,
  tone = 'gray',
  testID,
}: {
  text: string;
  tone?: 'gray' | 'danger' | 'info';
  testID?: string;
}) {
  const c =
    tone === 'danger'
      ? { bg: adminColors.dangerBand, fg: adminColors.dangerBandText }
      : tone === 'info'
        ? { bg: adminColors.infoBand, fg: adminColors.infoBandText }
        : { bg: adminColors.grayPill, fg: adminColors.grayText };
  return (
    <View
      style={[styles.band, { backgroundColor: c.bg }]}
      testID={testID}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      <Text style={[styles.bandText, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: adminColors.warningBg,
    borderWidth: 1,
    borderColor: adminColors.warningLine,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  text: { fontSize: 14, lineHeight: 22.4, color: adminColors.warningText },
  bold: { fontWeight: '800' },
  band: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  bandText: { fontSize: 14, lineHeight: 22, fontWeight: '700' },
});
