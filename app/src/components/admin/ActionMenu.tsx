import { useEffect, useRef } from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon, type IconName } from '@/components/Icon';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

export type ActionMenuItem = {
  key: string;
  label: string;
  /** Android・Web のシートで行の左に出す（iOS のアクションシートには出ない） */
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  /** iOS はシートの見出し、Android・Web は下シートの見出し */
  title?: string;
  /** iOS だけ。見出しの下の補足（アバターメニューのメールアドレスなど） */
  message?: string;
  items: ActionMenuItem[];
  /** 閉じたあとに呼ばれる。親はここで visible を false にする */
  onClose: () => void;
  testID?: string;
};

export const CANCEL_LABEL = 'キャンセル';

/**
 * iOS：OS 標準のアクションシート（画面下の選択肢。危険な操作は赤字）。
 * 選んだ項目の処理はシートが閉じてから走るので、続けて確認シートを開いても重ならない
 */
export function ActionMenuIos({ visible, title, message, items, onClose }: Props) {
  // 開いている間に props が変わっても、開いたときの内容で動かす（ref は描画中に触らず effect で更新する）
  const latest = useRef({ items, onClose });
  useEffect(() => {
    latest.current = { items, onClose };
  }, [items, onClose]);

  useEffect(() => {
    if (!visible) return;
    const { items: opened } = latest.current;
    const cancelButtonIndex = opened.length;
    const destructive = opened.flatMap((item, i) => (item.danger ? [i] : []));
    const disabled = opened.flatMap((item, i) => (item.disabled ? [i] : []));
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...opened.map((item) => item.label), CANCEL_LABEL],
        cancelButtonIndex,
        destructiveButtonIndex: destructive.length > 0 ? destructive : undefined,
        disabledButtonIndices: disabled.length > 0 ? disabled : undefined,
      },
      (index) => {
        latest.current.onClose();
        if (index !== cancelButtonIndex) opened[index]?.onPress();
      },
    );
  }, [visible, title, message]);

  return null;
}

/** Android・Web：下から出るシートに項目を並べる（PC 幅では中央のダイアログ） */
export function ActionMenuSheet({ visible, title, items, onClose, testID }: Props) {
  const { isWide } = useStaffLayout();
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      testID={testID}
      centered={isWide}
    >
      {(close) => (
        <View accessibilityRole="menu">
          {items.map((item, i) => {
            const color = item.disabled
              ? adminColors.placeholder2
              : item.danger
                ? adminColors.dangerDark
                : adminColors.text;
            return (
              <Pressable
                key={item.key}
                testID={`menu-${item.key}`}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: !!item.disabled }}
                disabled={item.disabled}
                onPress={() => close(() => item.onPress())}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.border,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={22} color={color} strokeWidth={1.9} />
                ) : null}
                <Text style={[styles.label, { color }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

/** ボタンから開く操作メニュー（＋掲載・⋯・アバター共通）。OS ごとの見た目は上の 2 つ */
export const ActionMenu = Platform.OS === 'ios' ? ActionMenuIos : ActionMenuSheet;

const styles = StyleSheet.create({
  row: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 14 },
  border: { borderTopWidth: 1, borderTopColor: adminColors.divider },
  label: { fontSize: 16, fontWeight: '700' },
});
