import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { pickAndUploadPhoto } from '@/features/staff/photo';
import { adminColors } from '@/theme/adminTokens';

import { Field } from './Fields';
import { AdminBand } from './WarningBox';

/** 写真（任意）。選ぶとアップロードしてプレビュー（4:3）。変更・削除できる */
export function PhotoField({
  storeId,
  value,
  onChange,
}: {
  storeId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const pick = async () => {
    setFailed(false);
    setBusy(true);
    try {
      const url = await pickAndUploadPhoto(storeId);
      if (url) onChange(url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label="写真">
      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value }} style={styles.preview} contentFit="cover" />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void pick()}
              style={styles.action}
              disabled={busy}
            >
              <Text style={styles.actionText}>{busy ? 'アップロード中…' : '変更'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange(null)}
              style={styles.action}
              disabled={busy}
            >
              <Text style={[styles.actionText, { color: adminColors.dangerDark }]}>削除</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          testID="pick-photo"
          accessibilityRole="button"
          onPress={() => void pick()}
          disabled={busy}
          style={({ pressed }) => [styles.empty, pressed && { opacity: 0.8 }]}
        >
          {busy ? (
            <ActivityIndicator color={adminColors.accent} />
          ) : (
            <>
              <Icon name="camera" size={26} color={adminColors.textWeak} strokeWidth={1.8} />
              <Text style={styles.emptyText}>＋ 写真を選ぶ</Text>
            </>
          )}
        </Pressable>
      )}
      {failed ? <AdminBand text="写真をアップロードできませんでした。" tone="danger" /> : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 120,
    borderRadius: 12,
    backgroundColor: adminColors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: adminColors.textSub },
  previewWrap: { gap: 8 },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: adminColors.fill,
  },
  actions: { flexDirection: 'row', gap: 16 },
  action: { minHeight: 44, justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '700', color: adminColors.text },
});
