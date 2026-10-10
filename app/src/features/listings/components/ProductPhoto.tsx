import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors } from '@/theme/tokens';

type Props = {
  uri: string | null;
  height: number;
  /** 写真がないときの面の色（新着の帯・イベントは緑がかった色、求人は黄土） */
  tone?: 'default' | 'fresh' | 'job';
  /** 売り切れ・満員：写真を薄くして文字を重ねる */
  overlayLabel?: string | null;
  overlaySize?: 'sm' | 'lg';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** 商品写真（写真がなければ色面）。children は写真の上に絶対配置するバッジなど */
export function ProductPhoto({
  uri,
  height,
  tone = 'default',
  overlayLabel,
  overlaySize = 'sm',
  style,
  children,
}: Props) {
  const bg = tone === 'fresh' ? colors.photoFresh : tone === 'job' ? colors.photoJob : colors.photo;
  const fg =
    tone === 'fresh'
      ? colors.photoFreshText
      : tone === 'job'
        ? colors.photoJobText
        : colors.photoText;
  return (
    <View style={[{ height, backgroundColor: bg }, styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <Icon name="bag" size={Math.min(48, height / 3)} color={fg} strokeWidth={1.4} />
      )}
      {overlayLabel ? (
        <>
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
          <View style={[styles.overlayPill, overlaySize === 'lg' && styles.overlayPillLg]}>
            <Text style={[styles.overlayText, overlaySize === 'lg' && styles.overlayTextLg]}>
              {overlayLabel}
            </Text>
          </View>
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // グレースケールの代わりに生成りの灰色を重ねて彩度を落とす
  dim: { backgroundColor: 'rgba(217,210,200,0.6)' },
  overlayPill: {
    backgroundColor: colors.soldOutPill,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  overlayPillLg: { paddingVertical: 10, paddingHorizontal: 24 },
  overlayText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  overlayTextLg: { fontSize: 20 },
});
