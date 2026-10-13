import { Redirect, router, Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/Buttons';
import { Loading } from '@/components/LoadState';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { saveNextPath } from '@/features/auth/api';
import { adminColors } from '@/theme/adminTokens';

/**
 * 運営画面のガード。未ログインはログインへ（戻り先は開こうとした画面）、スタッフでなければ権限なしの表示
 */
export default function StaffLayout() {
  const { session, profile, loading } = useAuth();
  const pathname = usePathname();
  // この画面にいる間にセッションが消えた＝ログアウト。そのときは戻り先を残さない
  // （残すと、次に別の人がログインしたときに運営画面へ飛んでしまう）
  const hadSession = useRef(false);
  // 開いた時点の画面だけを戻り先にする。画面遷移のたびに保存し直すと、裏に残ったガードが
  // ほかの入口（マイページなど）で保存した戻り先を上書きしてしまう
  const openedAt = useRef(pathname);

  useEffect(() => {
    if (session) hadSession.current = true;
    else if (!loading && !hadSession.current && openedAt.current.startsWith('/staff')) {
      void saveNextPath(openedAt.current);
    }
  }, [loading, session]);

  if (loading) {
    return (
      <StaffScreen>
        <Loading />
      </StaffScreen>
    );
  }
  if (!session) return <Redirect href="/auth/login" />;
  if (!profile?.is_staff) return <NoAccess />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: adminColors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="new-store"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

/** 権限なし（design 03 A-00 の注記） */
function NoAccess() {
  return (
    <StaffScreen>
      <View style={styles.center}>
        <Text style={styles.title} accessibilityRole="header">
          この画面を使う権限がありません
        </Text>
        <Text style={styles.body}>スタッフ用のアカウントでログインしてください。</Text>
        <PrimaryButton
          label="利用者画面へ戻る"
          onPress={() => router.replace('/')}
          height={52}
          labelSize={16}
          style={{ paddingHorizontal: 28, marginTop: 8 }}
        />
      </View>
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 18, fontWeight: '800', color: adminColors.text, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 22, color: adminColors.textWeak, textAlign: 'center' },
});
