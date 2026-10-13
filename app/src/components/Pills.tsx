import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Badge as BadgeValue, BadgeTone } from '@/features/listings/derive';
import { colors, radius } from '@/theme/tokens';

const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  off: { bg: colors.accent, fg: colors.white },
  few: { bg: colors.danger, fg: colors.white },
  new: { bg: colors.white, fg: colors.accent },
  today: { bg: colors.text, fg: colors.white },
  gray: { bg: colors.placeholder, fg: colors.white },
};

/** 写真の左上のバッジ（半額・◯%OFF・残りわずか・本日限定・新着） */
export function Badge({
  badge,
  size = 'sm',
  style,
}: {
  badge: BadgeValue;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const c = BADGE_COLORS[badge.tone];
  // 本日限定は詳細の写真でアクセント色（design 01 の U-12）
  const bg = size === 'md' && badge.tone === 'today' ? colors.accent : c.bg;
  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, size === 'md' && styles.badgeTextMd, { color: c.fg }]}>
        {badge.label}
      </Text>
    </View>
  );
}

/** 写真の右上の残数（締切後は「受付終了」を灰で） */
export function RemainPill({ label, closed = false }: { label: string; closed?: boolean }) {
  return (
    <View style={[styles.remain, closed && styles.remainClosed]}>
      <Text style={styles.remainText}>{label}</Text>
    </View>
  );
}

/** 小さな塗りのピル（件数・割引率・残り・支払い方法） */
export function Tag({
  label,
  bg,
  fg,
  style,
  fontSize = 13,
}: {
  label: string;
  bg: string;
  fg: string;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }, style]}>
      <Text style={[styles.tagText, { color: fg, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeMd: { paddingVertical: 6, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  badgeTextMd: { fontSize: 13 },
  remain: {
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.remainPill,
  },
  remainClosed: { backgroundColor: colors.grayPillText },
  remainText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  tagText: { fontWeight: '700' },
});
