import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/theme/tokens';

import { BackButton } from './Screen';

/** 畳んだ見出しのナビ行の高さ（SafeArea を除く） */
export const HERO_NAV_HEIGHT = 56;

type Props = {
  /** 畳んだ見出しに出すタイトル */
  title: string;
  /** 写真のブロック（`ProductPhoto`） */
  photo: ReactNode;
  photoHeight: number;
  /** 畳んだ見出しの地に敷く写真。null なら白地 */
  photoUri: string | null;
  /** 写真直下の帯。畳んだ見出しの直下に貼りつく */
  band?: ReactNode;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * 写真を大きく見せ、スクロールで小さな見出しに畳む詳細画面の骨格（設計 A.7.1）。
 * 戻るボタンと見出しはスクロールの外に固定し、本文と一緒に消えないようにする。
 * `Screen padTop={false}` の中に置き、下部固定バーは兄弟として後ろに置く。
 */
export function HeroScroll({
  title,
  photo,
  photoHeight,
  photoUri,
  band,
  children,
  contentContainerStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HERO_NAV_HEIGHT;
  // 写真の下端が見出しの下端に届く位置
  const collapseAt = Math.max(photoHeight - headerHeight, 1);

  const y = useSharedValue(0);
  const [collapsed, setCollapsed] = useState(false);

  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  useAnimatedReaction(
    () => y.value >= collapseAt - 16,
    (next, prev) => {
      if (next !== prev) scheduleOnRN(setCollapsed, next);
    },
    [collapseAt],
  );

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [collapseAt - 32, collapseAt], [0, 1], Extrapolation.CLAMP),
  }));

  // 上に引っ張ったとき、写真は上端に張りついたまま伸びる
  const photoStyle = useAnimatedStyle(() => {
    const pull = Math.max(-y.value, 0);
    return {
      transform: [{ translateY: -pull / 2 }, { scale: 1 + pull / photoHeight }],
    };
  });

  // 帯は畳む位置を越えたぶんだけ下げて、見出しの直下に貼りつける
  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(y.value - collapseAt, 0) }],
  }));

  const hasPhoto = Boolean(photoUri);

  return (
    <View style={styles.root}>
      <StatusBar style={collapsed && hasPhoto ? 'light' : 'dark'} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
      >
        <Animated.View style={photoStyle}>{photo}</Animated.View>
        {band ? <Animated.View style={[styles.band, bandStyle]}>{band}</Animated.View> : null}
        {children}
      </Animated.ScrollView>

      <Animated.View
        accessibilityElementsHidden={!collapsed}
        importantForAccessibility={collapsed ? 'auto' : 'no-hide-descendants'}
        style={[
          styles.header,
          { height: headerHeight, paddingTop: insets.top },
          hasPhoto ? styles.headerPhoto : styles.headerPlain,
          headerStyle,
        ]}
      >
        {photoUri ? (
          <>
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              blurRadius={12}
            />
            <View style={[StyleSheet.absoluteFill, styles.scrim]} />
          </>
        ) : null}
        <Text
          style={[styles.title, { color: hasPhoto ? colors.white : colors.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </Animated.View>

      <View style={[styles.back, { top: insets.top + (HERO_NAV_HEIGHT - 44) / 2 }]}>
        <BackButton onPhoto />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  band: { zIndex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    overflow: 'hidden',
    // タッチを通して、写真の上からでもスクロールを始められるようにする
    pointerEvents: 'none',
  },
  headerPhoto: { backgroundColor: colors.text },
  headerPlain: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  scrim: { backgroundColor: 'rgba(31,27,23,0.55)' },
  title: {
    fontSize: 17,
    fontWeight: '800',
    paddingLeft: 16 + 44 + 12,
    paddingRight: 16,
  },
  back: { position: 'absolute', left: 16 },
});
