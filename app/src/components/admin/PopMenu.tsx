import { type ReactNode, type RefObject, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { adminColors, adminShadow } from '@/theme/adminTokens';

export type PopMenuItem = {
  key: string;
  label: string;
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  /** メニューを出す元のボタン（その直下・右端そろえで出す） */
  anchorRef: RefObject<View | null>;
  items: PopMenuItem[];
  header?: ReactNode;
  onClose: () => void;
  testID?: string;
};

/**
 * ボタン直下に出すメニュー（＋掲載・⋯・アバター共通）。背景は暗くし、外側タップで閉じる
 */
export function PopMenu({ visible, anchorRef, items, header, onClose, testID }: Props) {
  const { width } = useWindowDimensions();
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setPos({ top: y + h + 8, right: Math.max(width - (x + w), 12) });
    });
  }, [visible, anchorRef, width]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[StyleSheet.absoluteFill, styles.overlay]}
        accessibilityLabel="閉じる"
        onPress={onClose}
      />
      {pos ? (
        <View style={[styles.menu, { top: pos.top, right: pos.right }]} testID={testID}>
          {header}
          {items.map((item) => (
            <Pressable
              key={item.key}
              testID={`menu-${item.key}`}
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: !!item.disabled }}
              disabled={item.disabled}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: adminColors.fill },
              ]}
            >
              {item.icon ? (
                <Icon
                  name={item.icon}
                  size={22}
                  color={item.danger ? adminColors.dangerDark : adminColors.text}
                  strokeWidth={1.9}
                />
              ) : null}
              <Text
                style={[
                  styles.label,
                  item.danger && { color: adminColors.dangerDark },
                  item.disabled && { color: adminColors.placeholder2 },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: adminColors.overlay },
  menu: {
    position: 'absolute',
    width: 232,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 6,
    ...adminShadow.menu,
  },
  item: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  label: { fontSize: 17, fontWeight: '700', color: adminColors.text },
});
