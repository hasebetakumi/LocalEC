import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';
import { colors } from '@/theme/tokens';

import { Band } from './Bands';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton, SecondaryButton } from './Buttons';

type Props = {
  visible: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** 確定ボタンの色。取り消し系は赤、変更は茶、完了は緑 */
  tone?: 'danger' | 'accent' | 'done';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  testID?: string;
};

// done（受け取り済みにする）は運営画面だけで使う緑
const TONE = { danger: colors.danger, accent: colors.accent, done: adminColors.done };

/**
 * 下から出る確認シート（利用者側・運営側で共通。U-21 キャンセル、U-02 削除、店舗キャンセル・終了・削除・破棄など）。
 * 見出し・本文は中央寄せ。幅 960 以上の Web では中央のダイアログとして出す
 */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'やめる',
  tone = 'danger',
  busy,
  error,
  onConfirm,
  onClose,
  testID,
}: Props) {
  const { isWide } = useStaffLayout();
  return (
    <BottomSheet visible={visible} onClose={onClose} testID={testID} centered={isWide}>
      {(close) => (
        <View style={styles.body}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {typeof body === 'string' ? <Text style={styles.text}>{body}</Text> : body}
          {error ? <Band text={error} tone="danger" align="center" /> : null}
          <PrimaryButton
            testID="confirm-ok"
            label={busy ? '処理しています…' : confirmLabel}
            onPress={onConfirm}
            disabled={busy}
            height={54}
            labelSize={17}
            style={busy ? undefined : { backgroundColor: TONE[tone] }}
          />
          <SecondaryButton label={cancelLabel} onPress={() => close()} height={54} />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 29,
    color: colors.text,
    textAlign: 'center',
    marginTop: -6,
  },
  text: { fontSize: 14.5, lineHeight: 23, color: colors.textSub, textAlign: 'center' },
});
