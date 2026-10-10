import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/** 商品タブの中のスタック。お知らせはタブバーを出したまま「商品」を選択状態にする（design 05） */
export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
