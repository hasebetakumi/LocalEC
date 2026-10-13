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
});
