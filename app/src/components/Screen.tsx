import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/theme/tokens';

import { Icon } from './Icon';

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** 戻るボタン。onPhoto=true は写真の上に置く白丸（U-12） */
export function BackButton({
  onPhoto = false,
  onPress = goBack,
}: {
  onPhoto?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="戻る"
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        onPhoto ? styles.backOnPhoto : styles.back,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icon name="back" size={24} color={colors.text} strokeWidth={2.4} />
    </Pressable>
  );
}

/** ナビ行：戻る＋太字タイトル（高さ 56） */
export function NavBar({ title, onBack }: { title?: string; onBack?: () => void }) {
  return (
    <View style={styles.nav}>
      <BackButton onPress={onBack} />
      {title ? (
        <Text style={styles.navTitle} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
    </View>
  );
}

type ScreenProps = {
  children: ReactNode;
  /** 上の安全領域を確保する（写真が端まで来る画面では false） */
  padTop?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
};

/** 画面の地（生成り）と上の安全領域 */
export function Screen({ children, padTop = true, background = colors.bg, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: background, paddingTop: padTop ? insets.top : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  nav: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
  },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backOnPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
});
