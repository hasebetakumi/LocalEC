import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { colors } from '@/theme/tokens';

/**
 * 下タブ。icon は Web（JS の Tabs）用、sf / md は iOS / Android（NativeTabs）用。
 * 設計：docs/設計_下タブ_NativeTabs.md
 */
const TABS = [
  {
    name: '(home)',
    title: '商品',
    icon: 'tag',
    sf: { default: 'tag', selected: 'tag.fill' },
    md: 'sell',
  },
  {
    name: 'events',
    title: 'イベント・求人',
    icon: 'megaphone',
    sf: { default: 'megaphone', selected: 'megaphone.fill' },
    md: 'campaign',
  },
  {
    name: 'bookings',
    title: '予約・申込',
    icon: 'ticket',
    sf: { default: 'ticket', selected: 'ticket.fill' },
    md: 'confirmation_number',
  },
  {
    name: 'mypage',
    title: 'マイページ',
    icon: 'person',
    sf: { default: 'person', selected: 'person.fill' },
    md: 'person',
  },
] as const;

/** iOS / Android：OS 標準のタブバー（iOS 26 では浮いたカプセル型）。指定するのはアクセント色とラベルだけ */
function NativeTabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent}>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={t.sf} md={t.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

/** Web：design/ の画面に合わせた従来の JS タブ */
function WebTabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused }) => (
              <Icon
                name={t.icon}
                size={26}
                color={focused ? colors.accent : colors.iconOff}
                strokeWidth={focused ? 2.3 : 1.8}
              />
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={[styles.label, { color: focused ? colors.accent : colors.textWeak }]}>
                {t.title}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default Platform.OS === 'web' ? WebTabsLayout : NativeTabsLayout;

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: -0.5, marginTop: 3 },
});
