import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { MessageBand } from '@/components/Bands';
import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Card, Divider } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { PageHeader, Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { setNotificationsEnabled } from '@/features/auth/api';
import { goToLogin } from '@/features/auth/goToLogin';
import { LEGAL_DOCS } from '@/features/legal/docs';
import {
  getPushPermission,
  registerForPush,
  type PushPermission,
} from '@/features/notifications/push';
import { formatPhone } from '@/lib/format';
import { colors, radius, shadow, space } from '@/theme/tokens';

/** マイページ（U-30 通知設定を含む） */
export default function MyPageScreen() {
  const { emailChanged } = useLocalSearchParams<{ emailChanged?: string }>();
  const { session, profile, isRegistered, signOut, refreshProfile } = useAuth();
  const [notifyError, setNotifyError] = useState<string | null>(null);
  // スイッチは押した瞬間に切り替え、失敗したら戻す
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const notificationsOn = optimistic ?? profile?.notifications_enabled ?? true;
  // 端末（OS）側の許可。アプリからは変えられないので、拒否なら「設定を開く」を案内する
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const showNotify = !!session && isRegistered && Platform.OS !== 'web';
  const readPermission = useCallback(() => {
    if (!showNotify) return;
    void getPushPermission().then(setPermission);
  }, [showNotify]);
  useFocusEffect(
    useCallback(() => {
      readPermission();
      // 設定アプリで許可を変えて戻ってきたときにも読み直す
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') readPermission();
      });
      return () => sub.remove();
    }, [readPermission]),
  );
  // 引っ張って更新：登録情報を読み直す（未ログインでは何もしない）
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch {
      // 読み直しの失敗は表示を変えない（今の内容を残す）
    } finally {
      setRefreshing(false);
    }
  };

  const toggleNotifications = async (next: boolean) => {
    if (!session) return;
    setNotifyError(null);
    setOptimistic(next);
    try {
      await setNotificationsEnabled(session.user.id, next);
      await refreshProfile();
      // オンにしたら端末を登録する。端末の設定で拒否されていれば、下の案内が出る
      if (next) {
        await registerForPush();
        readPermission();
      }
    } catch {
      setNotifyError('通知の設定を保存できませんでした。');
    } finally {
      setOptimistic(null);
    }
  };

  return (
    <Screen>
      <PageHeader title="マイページ" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        {emailChanged ? <MessageBand message="メールアドレスを変更しました。" tone="info" /> : null}

        {!session ? (
          <PrimaryButton
            label="ログイン・新規登録"
            onPress={() => void goToLogin('/mypage')}
            height={56}
            labelSize={17}
          />
        ) : !isRegistered ? (
          <PrimaryButton
            label="登録情報を入力する"
            onPress={() => router.push({ pathname: '/auth/register', params: { complete: '1' } })}
            height={56}
            labelSize={17}
          />
        ) : (
          <Pressable
            testID="profile-card"
            accessibilityRole="button"
            accessibilityLabel="登録情報を変更する"
            onPress={() => router.push('/account/profile')}
            style={({ pressed }) => [styles.profile, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.avatar}>
              <Icon name="person" size={24} color={colors.accent} strokeWidth={2} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name}>{profile?.name}</Text>
              <Text style={styles.sub}>{formatPhone(profile?.phone ?? '')}</Text>
              <Text style={styles.sub} numberOfLines={1} ellipsizeMode="middle">
                {profile?.email}
              </Text>
              {profile?.pending_email ? (
                <Text style={styles.pending} numberOfLines={1} ellipsizeMode="middle">
                  確認待ち：{profile.pending_email}
                </Text>
              ) : null}
            </View>
            <Text style={styles.change}>変更 ›</Text>
          </Pressable>
        )}

        {profile?.is_staff ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/staff')}
            style={({ pressed }) => [styles.staff, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.staffLabel}>スタッフメニュー</Text>
            <Text style={styles.staffArrow}>›</Text>
          </Pressable>
        ) : null}

        {/* U-30：通知は 1 つだけ。Web 版では出さない */}
        {showNotify ? (
          <Card>
            <View style={styles.notifyRow}>
              <View style={styles.notifyText}>
                <Text style={styles.notifyLabel}>お知らせ通知</Text>
                <Text style={styles.notifySub}>新着・予約確定・リマインドなど</Text>
              </View>
              <Switch
                accessibilityLabel="お知らせ通知"
                value={notificationsOn}
                onValueChange={(v) => void toggleNotifications(v)}
                trackColor={{ true: colors.event, false: colors.lineStrong }}
                thumbColor={colors.white}
                // RN の Switch は alignSelf: 'flex-start' を持つので、行の中央に寄せ直す
                style={styles.switch}
              />
            </View>
            {notificationsOn && permission === 'denied' ? (
              <View style={styles.denied}>
                <Text style={styles.deniedText}>端末の設定で通知が許可されていません。</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void Linking.openSettings()}
                  hitSlop={8}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                >
                  <Text style={styles.deniedLink}>設定を開く</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}
        {notifyError ? <MessageBand message={notifyError} /> : null}

        <Card style={styles.links}>
          {LEGAL_DOCS.map((doc, i) => (
            <View key={doc.key}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: doc.key } })}
                style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.linkLabel}>{doc.title}</Text>
                <Text style={styles.linkArrow}>›</Text>
              </Pressable>
            </View>
          ))}
        </Card>

        {session ? (
          <View style={styles.footer}>
            <TextButton
              testID="logout"
              label="ログアウト"
              color={colors.textSub}
              onPress={() => void signOut()}
            />
            <TextButton
              testID="go-delete"
              label="アカウント削除"
              color={colors.danger}
              onPress={() => router.push('/account/delete')}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.screenX, paddingBottom: 24, gap: 12 },
  profile: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '900', color: colors.text },
  sub: { fontSize: 13, color: colors.textSub },
  pending: { fontSize: 12, fontWeight: '700', color: colors.accent },
  change: { fontSize: 14, fontWeight: '700', color: colors.accent },
  staff: {
    backgroundColor: colors.text,
    borderRadius: 20,
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffLabel: { fontSize: 15.5, fontWeight: '800', color: colors.white },
  staffArrow: { fontSize: 18, color: colors.white, opacity: 0.8 },
  notifyRow: { paddingHorizontal: 16, height: 62, flexDirection: 'row', alignItems: 'center' },
  notifyText: { flex: 1 },
  switch: { alignSelf: 'center' },
  notifyLabel: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  notifySub: { fontSize: 12, color: colors.textWeak },
  denied: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    backgroundColor: colors.jobLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deniedText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.infoText },
  deniedLink: { fontSize: 13, fontWeight: '800', color: colors.infoText },
  links: { paddingHorizontal: 16 },
  link: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkLabel: { fontSize: 15, color: colors.text },
  linkArrow: { fontSize: 18, color: colors.placeholder },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
});
