import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { initialOf } from '@/features/staff/derive';
import { adminColors } from '@/theme/adminTokens';

import { ActionMenu } from './ActionMenu';

/** 右上のアバター（氏名の 1 文字）。押すと 氏名・メール／利用者画面へ戻る／ログアウト */
export function AvatarMenu() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const toUserScreens = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  return (
    <>
      <Pressable
        testID="avatar"
        accessibilityRole="button"
        accessibilityLabel="アカウントのメニュー"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.initial}>{initialOf(profile?.name)}</Text>
      </Pressable>
      <ActionMenu
        visible={open}
        title={profile?.name}
        message={profile?.email}
        onClose={() => setOpen(false)}
        testID="avatar-menu"
        items={[
          { key: 'user', label: '利用者画面へ戻る', onPress: toUserScreens },
          {
            key: 'logout',
            label: 'ログアウト',
            danger: true,
            onPress: () => {
              void signOut().then(toUserScreens);
            },
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: adminColors.white, fontSize: 14, fontWeight: '800' },
});
