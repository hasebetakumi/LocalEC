import { Redirect, router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/Buttons';
import { Loading } from '@/components/LoadState';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { saveNextPath } from '@/features/auth/api';
import { adminColors } from '@/theme/adminTokens';

/**
 * 運営画面のガード。未ログインはログインへ（戻り先 /staff）、スタッフでなければ権限なしの表示
 */
export default function StaffLayout() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) void saveNextPath('/staff');
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
          label="利用者画面へ"
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
