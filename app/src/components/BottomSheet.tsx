import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme/tokens';

import { Icon } from './Icon';

type Close = (after?: () => void) => void;

type Props = {
  visible: boolean;
  /** 閉じるアニメーションが終わってから呼ばれる。親はここで visible を false にする */
  onClose: () => void;
  title?: string;
  children: ReactNode | ((close: Close) => ReactNode);
  testID?: string;
};

const SHEET_OFFSET = 600;

/**
 * 下から出るシート。背景 50% 暗転、外側タップ・下スワイプ・× で閉じる。
 * 閉じるときは先にアニメーションし、終わってから onClose を呼ぶ
 */
export function BottomSheet({ visible, onClose, title, children, testID }: Props) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    drag.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress, drag]);

  const close = useCallback<Close>(
    (after) => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onClose();
        after?.();
      });
    },
    [progress, onClose],
  );

  // 下スワイプで閉じる（つまみと見出しの部分）
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 80 || g.vy > 1) {
            close();
          } else {
            Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }),
    [close, drag],
  );

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [SHEET_OFFSET, 0] }),
    drag,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close()}
      statusBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="閉じる"
            onPress={() => close()}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 24) + 10, transform: [{ translateY }] },
          ]}
        >
          <View {...pan.panHandlers}>
            <View style={styles.grabber} />
            {title ? (
              <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="閉じる"
                  onPress={() => close()}
                  style={styles.closeBtn}
                  hitSlop={4}
                >
                  <Icon name="close" size={18} color={colors.text} strokeWidth={2.2} />
                </Pressable>
              </View>
            ) : null}
          </View>
          {typeof children === 'function' ? children(close) : children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 16,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
