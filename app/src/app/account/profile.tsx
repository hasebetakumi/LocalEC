import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBand } from '@/components/Bands';
import { PrimaryButton } from '@/components/Buttons';
import { Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { type Profile, requestEmailChange, updateProfile } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/format';

/** 登録情報の変更（氏名・電話は即反映、メールは確認リンクで完了） */
export default function ProfileEditScreen() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <Screen>
        <NavBar title="登録情報" />
        <Loading />
      </Screen>
    );
  }
  if (!session || !profile) {
    return <Redirect href="/auth/login" />;
  }
  return <ProfileForm userId={session.user.id} profile={profile} />;
}

type Errors = { name?: string; phone?: string; email?: string };

function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const { refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const normalizedPhone = normalizePhone(phone);
  const nameChanged = name.trim() !== profile.name;
  const phoneChanged = normalizedPhone !== profile.phone;
  const emailChanged = email.trim() !== profile.email;
  const changed = nameChanged || phoneChanged || emailChanged;

  const save = async () => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'お名前を入力してください';
    if (!isValidPhone(normalizedPhone)) e.phone = '電話番号を正しく入力してください';
    if (!isValidEmail(email)) e.email = 'メールアドレスを正しく入力してください';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    setNotice(null);
    try {
      if (nameChanged || phoneChanged) {
        await updateProfile(userId, { name: name.trim(), phone: normalizedPhone });
      }
      if (emailChanged) {
        await requestEmailChange(email);
        setNotice({
          tone: 'info',
          text: '確認リンクを送りました。新しいアドレスのリンクを押すと変更が完了します。',
        });
      } else {
        setNotice({ tone: 'info', text: '保存しました。' });
      }
      await refreshProfile();
    } catch {
      setNotice({
        tone: 'danger',
        text: '保存できませんでした。時間をおいてもう一度お試しください。',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <NavBar title="登録情報" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 24) + 6 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="お名前"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            error={errors.name}
          />
          <TextField
            label="電話番号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="変更後の内容は、予約中の予約にも反映されます"
            error={errors.phone}
          />
          <TextField
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            hint="ログインに使うため、変更すると新しいアドレスに確認リンクを送ります。リンクを押すと変更が完了します"
            error={errors.email}
          />
          {notice ? <MessageBand message={notice.text} tone={notice.tone} /> : null}
          <View style={styles.spacer} />
          <PrimaryButton
            testID="save-profile"
            label={saving ? '保存しています…' : '保存する'}
            onPress={() => void save()}
            disabled={!changed || saving}
            height={56}
            labelSize={17}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 6, paddingHorizontal: 24, gap: 16 },
  spacer: { flex: 1, minHeight: 8 },
});
