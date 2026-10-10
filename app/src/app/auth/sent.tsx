import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBand } from '@/components/Bands';
import { SecondaryButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { NavBar, Screen } from '@/components/Screen';
import { sendLoginLink } from '@/features/auth/api';
import { colors } from '@/theme/tokens';

/** U-01 メール送信後（ログイン・新規登録の両方がここを通る） */
export default function SentScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  // 新規登録の再送でも、ユーザーはすでに作られているのでログイン用リンクを送れば足りる
  const resend = async () => {
    setSending(true);
    try {
      await sendLoginLink(email);
      setNotice({ tone: 'info', text: 'メールを再送しました。' });
    } catch {
      setNotice({ tone: 'danger', text: 'しばらく待ってから再送してください。' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <NavBar />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={styles.icon}>
          <Icon name="mail" size={40} color={colors.accent} strokeWidth={1.8} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          メールを送りました
        </Text>
        <Text style={styles.body}>
          <Text style={styles.email}>{email}</Text>{' '}
          宛にログイン用のリンクを送りました。メールを開いてリンクを押すと、このアプリに戻ってログインが完了します。
        </Text>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            メールが届かないときは、迷惑メールフォルダをご確認ください。リンクの有効期限は15分です。
          </Text>
        </View>
        {notice ? (
          <MessageBand message={notice.text} tone={notice.tone} style={{ alignSelf: 'stretch' }} />
        ) : null}
        <View style={styles.spacer} />
        <SecondaryButton
          label={sending ? '送信しています…' : 'メールを再送する'}
          onPress={() => void resend()}
          disabled={sending || !email}
          height={52}
          style={{ alignSelf: 'stretch' }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 24, alignItems: 'center', gap: 18 },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  body: { fontSize: 15.5, lineHeight: 27, color: colors.textSub, textAlign: 'center' },
  email: { fontWeight: '700', color: colors.text },
  note: {
    alignSelf: 'stretch',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  noteText: { fontSize: 14, lineHeight: 22, color: colors.textSub },
  spacer: { flex: 1 },
});
