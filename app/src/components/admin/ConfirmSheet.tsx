import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

import { AdminBand } from './WarningBox';

type Props = {
  visible: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'accent' | 'done';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  testID?: string;
};

const TONE = { danger: adminColors.danger, accent: adminColors.accent, done: adminColors.done };

/** 下から出る確認シート（店舗キャンセル・終了・削除・支払い方法の変更・破棄） */
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
          {error ? <AdminBand text={error} tone="danger" /> : null}
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
    color: adminColors.text,
    marginTop: -6,
  },
  text: { fontSize: 14.5, lineHeight: 23, color: adminColors.textSub },
});
