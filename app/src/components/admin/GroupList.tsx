import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { adminColors, adminShadow } from '@/theme/adminTokens';

/** 1 枚の白い枠に行を区切り線で並べる（design 04 のグループリスト） */
export function GroupList({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = Children.toArray(children);
  return (
    <View style={[styles.card, style]}>
      {items.map((child, i) => (
        <View key={i} style={i > 0 ? styles.divider : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...adminShadow.card,
  },
  divider: { borderTopWidth: 1, borderTopColor: adminColors.divider },
});
