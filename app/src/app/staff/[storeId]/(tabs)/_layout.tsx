import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'listings', title: '掲載', icon: 'list' },
  { name: 'bookings', title: '予約・申し込み', icon: 'calendarCheck' },
  { name: 'store', title: '店舗情報', icon: 'store' },
];

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** 店舗モードの下タブ（design 04：選択タブの上端に 3px のバー） */
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

export default function StoreTabsLayout() {
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
