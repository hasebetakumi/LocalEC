import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBand } from '@/components/Bands';
import { PrimaryButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { NavBar, Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth/AuthProvider';
import { completeProfile, sendRegisterLink } from '@/features/auth/api';
import { goAfterLogin } from '@/features/auth/goAfterLogin';
import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/format';
import { colors } from '@/theme/tokens';

type Errors = { name?: string; phone?: string; email?: string };

/**
 * U-01 新規登録。
 * ?complete=1 は「メールだけでログインしたが氏名・電話がない人」向けで、メール欄を出さずに profiles を更新する
 */
export default function RegisterScreen() {
  const { complete } = useLocalSearchParams<{ complete?: string }>();
  const isComplete = complete === '1';
  const { session, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'お名前を入力してください';
    if (!isValidPhone(normalizePhone(phone))) e.phone = '電話番号を正しく入力してください';
    if (!isComplete && !isValidEmail(email)) e.email = 'メールアドレスを正しく入力してください';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitError(null);
    setSending(true);
    const input = { name: name.trim(), phone: normalizePhone(phone) };
    try {
      if (isComplete) {
        if (!session) {
          router.replace('/auth/login');
          return;
        }
        await completeProfile(session.user.id, input);
        await refreshProfile();
        await goAfterLogin();
      } else {
        await sendRegisterLink({ ...input, email });
        router.push({ pathname: '/auth/sent', params: { email: email.trim() } });
      }
    } catch {
      setSubmitError(
        isComplete
          ? '登録できませんでした。時間をおいてもう一度お試しください。'
          : 'メールを送れませんでした。しばらく待ってからもう一度お試しください。',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <NavBar title={isComplete ? '登録情報の入力' : '新規登録'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
        >
          {isComplete ? (
            <Text style={styles.lead}>予約の前に、お名前と電話番号を登録してください。</Text>
          ) : null}
          <TextField
            label="お名前"
            placeholder="例）栗橋 花子"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            error={errors.name}
          />
          <TextField
            label="電話番号"
            placeholder="例）09012345678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            hint="受け取り時の確認と、お店からの連絡に使います"
            error={errors.phone}
          />
          {isComplete ? null : (
            <TextField
              label="メールアドレス"
              placeholder="example@mail.jp"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              hint="ログインに使います（パスワードはありません）"
              error={errors.email}
            />
          )}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed((v) => !v)}
            style={styles.agree}
            testID="agree"
          >
            <View style={[styles.check, agreed && styles.checkOn]}>
              {agreed ? (
                <Icon name="checkMark" size={18} color={colors.white} strokeWidth={2.6} />
              ) : null}
            </View>
            {/* 規約・プライバシーポリシーのページは後続。文言だけ先に置く */}
            <Text style={styles.agreeText}>
              <Text style={styles.link}>利用規約</Text>と
              <Text style={styles.link}>プライバシーポリシー</Text>
              に同意する
            </Text>
          </Pressable>

          {submitError ? <MessageBand message={submitError} /> : null}

          <View style={styles.spacer} />
          <PrimaryButton
            testID="register-submit"
            label={sending ? '送信しています…' : '登録する'}
            onPress={() => void submit()}
            disabled={!agreed || sending}
            height={56}
            labelSize={17}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 6, paddingHorizontal: 24, gap: 14 },
  lead: { fontSize: 14.5, lineHeight: 22, color: colors.textSub },
  agree: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent },
  agreeText: { flex: 1, fontSize: 14.5, lineHeight: 23, color: colors.text },
  link: { color: colors.accent, fontWeight: '700', textDecorationLine: 'underline' },
  spacer: { flex: 1, minHeight: 8 },
});
