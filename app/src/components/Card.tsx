import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '@/theme/tokens';

/** カード：枠線なし、白い面＋薄い影 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** カード内の区切り線（1px #F0EBE4） */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, ...shadow.card },
  divider: { height: 1, backgroundColor: colors.divider },
});
