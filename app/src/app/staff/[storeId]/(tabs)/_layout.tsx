import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

/**
 * 店舗モードの下タブ。icon は Web（JS の Tabs）用、sf / md は iOS / Android（NativeTabs）用。
 * 利用者側（src/app/(tabs)/_layout.tsx）と同じ分け方。設計：docs/設計_下タブ_NativeTabs.md
 */
const TABS = [
  {
    name: 'listings',
    title: '掲載',
    icon: 'list',
    sf: { default: 'list.bullet', selected: 'list.bullet' },
    md: 'list',
  },
  {
    name: 'bookings',
    title: '予約・申し込み',
    icon: 'calendarCheck',
    sf: { default: 'calendar.badge.checkmark', selected: 'calendar.badge.checkmark' },
    md: 'event_available',
  },
  {
    name: 'store',
    title: '店舗情報',
    icon: 'store',
    sf: { default: 'storefront', selected: 'storefront.fill' },
    md: 'storefront',
  },
] as const;

/** iOS / Android：OS 標準のタブバー。指定するのはアクセント色とラベルだけ */
function NativeStoreTabsLayout() {
  return (
    <NativeTabs tintColor={adminColors.accent}>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf} md={t.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Web の下タブ（design 04：選択タブの上端に 3px のバー） */
function StaffTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? adminColors.accent : adminColors.placeholder;
        return (
          <Pressable
            key={route.key}
            testID={`staff-tab-${tab.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.title}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.item}
          >
            <View style={[styles.indicator, focused && { backgroundColor: adminColors.accent }]} />
            <Icon name={tab.icon} size={24} color={color} strokeWidth={focused ? 2.2 : 1.8} />
            <Text style={[styles.label, { color }]}>{tab.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Web：design 04 の JS タブ。PC 幅では左メニューがタブの代わりなので出さない */
function WebStoreTabsLayout() {
  const { isWide } = useStaffLayout();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: adminColors.bg } }}
      // PC の枠では左メニューがタブの代わり
      tabBar={(props) => (isWide ? null : <StaffTabBar {...props} />)}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}

export default Platform.OS === 'web' ? WebStoreTabsLayout : NativeStoreTabsLayout;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.line,
    paddingTop: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 },
  indicator: {
    position: 'absolute',
    top: -10,
    left: 14,
    right: 14,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  label: { fontSize: 11, fontWeight: '700' },
});
