import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { initialOf } from '@/features/staff/derive';
import { adminColors } from '@/theme/adminTokens';

import { PopMenu } from './PopMenu';

/** 右上のアバター（氏名の 1 文字）。押すと 氏名・メール／利用者画面へ戻る／ログアウト */
export function AvatarMenu() {
  const { profile, signOut } = useAuth();
  const ref = useRef<View>(null);
  const [open, setOpen] = useState(false);

  const toUserScreens = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  return (
    <>
      <View ref={ref} collapsable={false}>
        <Pressable
          testID="avatar"
          accessibilityRole="button"
          accessibilityLabel="アカウントのメニュー"
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.initial}>{initialOf(profile?.name)}</Text>
        </Pressable>
      </View>
      <PopMenu
        visible={open}
        anchorRef={ref}
        onClose={() => setOpen(false)}
        header={
          <View style={styles.header}>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {profile?.email}
            </Text>
          </View>
        }
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
  header: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.divider,
  },
  name: { fontSize: 14, fontWeight: '800', color: adminColors.text },
  email: { fontSize: 12, color: adminColors.textWeak },
});
