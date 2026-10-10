import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { colors } from '@/theme/tokens';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: '(home)', title: '商品', icon: 'tag' },
  { name: 'events', title: 'イベント・求人', icon: 'calendar' },
  { name: 'bookings', title: '予約・申込', icon: 'ticket' },
  { name: 'mypage', title: 'マイページ', icon: 'person' },
];

export default function TabsLayout() {
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

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: -0.5, marginTop: 3 },
});
