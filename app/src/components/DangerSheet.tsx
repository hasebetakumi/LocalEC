import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { MessageBand } from './Bands';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton, SecondaryButton } from './Buttons';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
  testID?: string;
};

/** 取り消し系の確認シート（U-21・U-02）。確定は赤塗り、やめるは薄い塗り */
export function DangerSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  error,
  onConfirm,
  onClose,
  testID,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} testID={testID}>
      {(close) => (
        <View style={styles.body}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.text}>{body}</Text>
          {error ? <MessageBand message={error} /> : null}
          <PrimaryButton
            testID="danger-confirm"
            label={busy ? '処理しています…' : confirmLabel}
            onPress={onConfirm}
            disabled={busy}
            height={56}
            labelSize={16}
            style={busy ? undefined : styles.danger}
          />
          <SecondaryButton label={cancelLabel} onPress={() => close()} />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginTop: -6,
  },
  text: { fontSize: 14, lineHeight: 23, color: colors.textSub, textAlign: 'center' },
  danger: { backgroundColor: colors.danger },
});
