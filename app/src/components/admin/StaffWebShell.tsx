import { router, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { StoreSummary } from '@/features/staff/types';
import { adminColors } from '@/theme/adminTokens';

import { AvatarMenu } from './AvatarMenu';

const MENU = [
  { key: 'listings', label: '商品・イベント・求人' },
  { key: 'bookings', label: '予約・申し込み' },
  { key: 'store', label: '店舗情報' },
] as const;

/**
 * PC 向けの枠（design 03）：黒いヘッダー（店舗名・店舗を切り替える・アバター）＋左メニュー＋中身
 */
export function StaffWebShell({ store, children }: { store: StoreSummary; children: ReactNode }) {
  const pathname = usePathname();
  const active =
    MENU.find((m) => pathname.includes(`/${m.key}`))?.key ??
    (pathname.includes('/bookings') ? 'bookings' : 'listings');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.storeLabel}>店舗</Text>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/staff')}
            style={({ pressed }) => [styles.switch, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.switchText}>店舗を切り替える</Text>
          </Pressable>
        </View>
        <AvatarMenu />
      </View>
      <View style={styles.body}>
        <View style={styles.aside}>
          {MENU.map((m) => (
            <Pressable
              key={m.key}
              testID={`pc-menu-${m.key}`}
              accessibilityRole="link"
              accessibilityState={{ selected: active === m.key }}
              onPress={() =>
                router.navigate({
                  pathname: `/staff/[storeId]/${m.key}`,
                  params: { storeId: store.id },
                })
              }
              style={[styles.menuItem, active === m.key && styles.menuItemOn]}
            >
              <Text style={[styles.menuText, active === m.key && styles.menuTextOn]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
          <View style={styles.today}>
            <Text style={styles.todayText}>
              この店舗の{'\n'}本日の予定 <Text style={styles.todayNum}>{store.todayCount}</Text>件
            </Text>
          </View>
        </View>
        <View style={styles.main}>
          <View style={styles.inner}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.bg },
  header: {
    height: 60,
    backgroundColor: adminColors.pcHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  storeLabel: { fontSize: 12, fontWeight: '700', color: adminColors.white, opacity: 0.7 },
  storeName: { fontSize: 18, fontWeight: '800', color: adminColors.white, flexShrink: 1 },
  switch: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
  },
  switchText: { fontSize: 13, fontWeight: '700', color: adminColors.white },
  body: { flex: 1, flexDirection: 'row' },
  aside: {
    width: 220,
    backgroundColor: adminColors.card,
    borderRightWidth: 1,
    borderRightColor: adminColors.line,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 4,
  },
  menuItem: { height: 44, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
  menuItemOn: { backgroundColor: adminColors.pcMenuSelected },
  menuText: { fontSize: 15, fontWeight: '700', color: adminColors.textSub },
  menuTextOn: { color: adminColors.pcMenuSelectedText },
  today: { marginTop: 'auto', backgroundColor: adminColors.pcAside, borderRadius: 10, padding: 12 },
  todayText: { fontSize: 12.5, lineHeight: 20, color: adminColors.textSub },
  todayNum: { fontSize: 16, fontWeight: '800', color: adminColors.done },
  main: { flex: 1, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: 820 },
});
