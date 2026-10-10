import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/theme/tokens';

/** ホームの帯の見出し（左に名前、右に「すべて見る」） */
export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable accessibilityRole="link" onPress={onSeeAll} hitSlop={10}>
          <Text style={styles.link}>すべて見る</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: space.screenX,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  link: { fontSize: 13, fontWeight: '700', color: colors.accent },
});
