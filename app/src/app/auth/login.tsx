import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MessageBand } from '@/components/Bands';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { sendLoginLink } from '@/features/auth/api';
import { isValidEmail } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** U-01 ログイン（パスワードなし。メールに届くリンクでログイン） */
export default function LoginScreen() {
  const { error: linkError } = useLocalSearchParams<{ error?: string }>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setEmailError('メールアドレスを正しく入力してください');
      return;
    }
    setEmailError(null);
    setSendError(null);
    setSending(true);
    try {
      await sendLoginLink(email);
      router.push({ pathname: '/auth/sent', params: { email: email.trim() } });
    } catch {
      setSendError('メールを送れませんでした。しばらく待ってからもう一度お試しください。');
    } finally {
      setSending(false);
    }
  };

  const browse = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Icon name="bag" size={38} color={colors.white} strokeWidth={1.8} />
            </View>
            <Text style={styles.appName}>LocalEC</Text>
            <Text style={styles.tagline}>地域の商品を、予約して受け取る</Text>
          </View>

          {linkError ? (
            <MessageBand message="リンクの有効期限が切れているか、すでに使われています。もう一度リンクを送ってください。" />
          ) : null}

          <TextField
            label="メールアドレス"
            placeholder="example@mail.jp"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
            height={54}
            hint="パスワードはありません。メールに届くリンクを押すとログインできます"
            error={emailError}
          />
          {sendError ? <MessageBand message={sendError} /> : null}
          <PrimaryButton
            testID="send-login-link"
            label={sending ? '送信しています…' : 'ログイン用リンクを送る'}
            onPress={() => void submit()}
            disabled={sending}
            height={56}
            labelSize={17}
            style={{ marginTop: 6 }}
          />

          <View style={styles.or}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>はじめての方</Text>
            <View style={styles.orLine} />
          </View>
          <SecondaryButton label="新規登録" onPress={() => router.push('/auth/register')} />
          <TextButton label="ログインせずに商品を見る" onPress={browse} style={{ marginTop: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 48, paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  brand: { alignItems: 'center', gap: 12, marginBottom: 14 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: 0.5, color: colors.text },
  tagline: { fontSize: 14, color: colors.textWeak },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.lineStrong },
  orText: { fontSize: 13, color: colors.placeholder },
});
