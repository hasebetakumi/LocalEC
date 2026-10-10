import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

import { AvatarMenu } from './AvatarMenu';

/**
 * 店舗モードのヘッダー（高さ 60）。店舗名 ▾ で A-01 に戻る。右にアクションとアバター
 */
export function StoreHeader({
  storeName,
  action,
  pcTitle,
}: {
  storeName: string;
  action?: ReactNode;
  /** PC の枠での見出し（店舗名は黒いヘッダーに出る） */
  pcTitle?: string;
}) {
  const { isWide } = useStaffLayout();
  if (isWide) {
    return (
      <View style={styles.pcHeader}>
        <Text style={styles.pcTitle} accessibilityRole="header">
          {pcTitle}
        </Text>
        {action}
      </View>
    );
  }
  return (
    <View style={styles.header}>
      <Pressable
        testID="store-switch"
        accessibilityRole="button"
        accessibilityLabel={`${storeName}（店舗を切り替える）`}
        onPress={() => router.navigate('/staff')}
        style={({ pressed }) => [styles.store, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.name} numberOfLines={1}>
          {storeName}
        </Text>
        <Icon name="chevronDown" size={18} color={adminColors.text} strokeWidth={2.4} />
      </Pressable>
      <View style={styles.right}>
        {action}
        <AvatarMenu />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 12,
  },
  store: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  name: { fontSize: 19, fontWeight: '800', color: adminColors.text, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  pcTitle: { fontSize: 24, fontWeight: '800', color: adminColors.text },
});
