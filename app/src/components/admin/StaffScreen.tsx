import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { adminColors } from '@/theme/adminTokens';

/** 運営画面の地（#FAF7F2）と上の安全領域 */
export function StaffScreen({
  children,
  padTop = true,
  style,
}: {
  children: ReactNode;
  padTop?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: padTop ? insets.top : 0 }, style]}>{children}</View>
  );
}

function goBack(fallback: string) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as Parameters<typeof router.replace>[0]);
}

/** 下階層のナビ行（高さ 52）：戻る＋タイトル、右にアクション */
export function StaffNavBar({
  title,
  right,
  fallback = '/staff',
  onBack,
  backIcon = 'back',
  center,
}: {
  title?: string;
  /** 中央に置く見出し（A-10 の「種類ラベル＋◯◯を掲載」） */
  center?: ReactNode;
  right?: ReactNode;
  fallback?: string;
  onBack?: () => void;
  backIcon?: 'back' | 'close';
}) {
  return (
    <View style={styles.nav}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backIcon === 'close' ? '閉じる' : '戻る'}
        onPress={onBack ?? (() => goBack(fallback))}
        hitSlop={6}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
      >
        <Icon name={backIcon} size={24} color={adminColors.text} strokeWidth={2.4} />
      </Pressable>
      {center ? (
        <>
          <View style={styles.center}>{center}</View>
          <View style={styles.back} />
        </>
      ) : (
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title ?? ''}
        </Text>
      )}
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: adminColors.bg },
  nav: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: adminColors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
