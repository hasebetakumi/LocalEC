import { useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/Buttons';
import { Card, Divider } from '@/components/Card';
import { DangerSheet } from '@/components/DangerSheet';
import { StatusPill } from '@/components/KindPills';
import { LoadError, Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { BookingError, deleteMyAccount } from '@/features/bookings/api';
import {
  isActive,
  numberLabel,
  placeName,
  scheduleText,
  statusPill,
  titleWithQuantity,
} from '@/features/bookings/derive';
import { useMyBookings } from '@/features/bookings/hooks';
import { unregisterPush } from '@/features/notifications/push';
import { useNow } from '@/hooks/useNow';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/tokens';

const NOTES = [
  '削除すると、このアカウントではログインできなくなります。',
  '受け取り前の予約があると削除できません。受け取りかキャンセルのあとにお手続きください。',
  'これまでの予約の記録は、お名前などを消したうえで「削除済みユーザー」として運営側に残ります。',
];

/** U-02 アカウント削除 */
export default function AccountDeleteScreen() {
  const { session } = useAuth();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bookings = useMyBookings(session?.user.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return <Redirect href="/auth/login" />;
  }
  if (bookings.isPending || bookings.isError) {
    return (
      <Screen>
        <NavBar title="アカウント削除" />
        {bookings.isPending ? <Loading /> : <LoadError onRetry={() => void bookings.refetch()} />}
      </Screen>
    );
  }

  const active = bookings.data.filter((b) => isActive(b, now));
  const blocked = active.length > 0;

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      // ログインしているうちに、この端末のトークンを外す
      await unregisterPush().catch(() => {});
      await deleteMyAccount();
      // サーバー側でユーザーは消えているので、端末のセッションだけ消す
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
      setSheetOpen(false);
      if (router.canDismiss()) router.dismissAll();
      router.replace('/auth/login');
    } catch (e) {
      if (e instanceof BookingError && e.code === 'has_active_bookings') {
        setSheetOpen(false);
        void bookings.refetch();
      } else {
        setError('削除できませんでした。時間をおいてもう一度お試しください。');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <NavBar title="アカウント削除" />
      <ScrollView contentContainerStyle={styles.content}>
        {blocked ? (
          <>
            <Text style={styles.heading}>受け取り前の予約があるため、{'\n'}今は削除できません</Text>
            <Text style={styles.lead}>
              以下の予約を受け取るか、キャンセルしたあとに、もう一度お手続きください。
            </Text>
            <Card style={{ overflow: 'hidden' }}>
              {active.map((b, i) => {
                const pill = statusPill(b, now);
                return (
                  <View key={b.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={styles.item} testID={`blocking-${b.number}`}>
                      <View style={styles.itemHead}>
                        <StatusPill label={pill.label} tone={pill.tone} />
                        <Text style={styles.itemNumber}>
                          {numberLabel(b.kind)}{' '}
                          <Text style={styles.itemNumberValue}>{b.number}</Text>
                        </Text>
                      </View>
                      <Text style={styles.itemTitle}>{titleWithQuantity(b)}</Text>
                      <Text style={styles.itemLine}>
                        {scheduleText(b)}　{placeName(b)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        ) : (
          <>
            <Text style={styles.heading}>アカウントを削除する前に{'\n'}ご確認ください</Text>
            <Card style={styles.notes}>
              {NOTES.map((n) => (
                <View key={n} style={styles.note}>
                  <Text style={styles.bullet}>・</Text>
                  <Text style={styles.noteText}>{n}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {blocked ? (
          <>
            <PrimaryButton
              label="予約・申込を見る"
              onPress={() => {
                if (router.canDismiss()) router.dismissAll();
                router.navigate('/bookings');
              }}
              height={56}
              labelSize={17}
            />
            <PrimaryButton
              testID="delete-account"
              label="アカウントを削除する"
              disabled
              height={56}
              labelSize={17}
            />
          </>
        ) : (
          <PrimaryButton
            testID="delete-account"
            label="アカウントを削除する"
            onPress={() => setSheetOpen(true)}
            height={56}
            labelSize={17}
            style={{ backgroundColor: colors.danger }}
          />
        )}
      </View>
      <DangerSheet
        visible={sheetOpen}
        title="本当に削除しますか？"
        body="削除したアカウントは元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="やめる"
        busy={busy}
        error={error}
        onConfirm={() => void confirmDelete()}
        onClose={() => setSheetOpen(false)}
        testID="delete-sheet"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingHorizontal: 22, paddingBottom: 20, gap: 14 },
  heading: { fontSize: 20, fontWeight: '900', lineHeight: 30, color: colors.text },
  lead: { fontSize: 14.5, lineHeight: 24.5, color: colors.textSub },
  notes: { padding: 16, gap: 12 },
  note: { flexDirection: 'row', gap: 10 },
  bullet: { fontSize: 15, fontWeight: '800', color: colors.danger, lineHeight: 25 },
  noteText: { flex: 1, fontSize: 15, lineHeight: 25, color: colors.text },
  item: { paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemNumber: { fontSize: 13, color: colors.textWeak },
  itemNumberValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemLine: { fontSize: 13, color: colors.textSub },
  actions: { paddingTop: 12, paddingHorizontal: 22, gap: 10 },
});
