import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { useListing } from '@/features/listings/hooks';
import { useMarkNoticeRead } from '@/features/notices/hooks';
import { formatLongDateJa } from '@/lib/format';
import { colors, shadow } from '@/theme/tokens';

/** U-11 お知らせ詳細。読むだけ、写真なし。開いたら既読 */
export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useListing(id);
  const { mutate: markRead } = useMarkNoticeRead();

  const noticeId = data?.kind === 'notice' ? data.id : undefined;
  useEffect(() => {
    if (noticeId) markRead(noticeId);
  }, [noticeId, markRead]);

  return (
    <Screen>
      <NavBar title="お知らせ" />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <LoadError onRetry={() => void refetch()} />
      ) : !data || data.kind !== 'notice' ? (
        <EmptyState
          icon="bell"
          title="このお知らせは見つかりませんでした"
          body="掲載が終了した可能性があります。"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.date}>{formatLongDateJa(data.publishStart)}</Text>
            <Text style={styles.title} accessibilityRole="header">
              {data.title}
            </Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{data.body}</Text>
            <Text style={styles.store}>{data.store.name}</Text>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 22, gap: 12, ...shadow.card },
  date: { fontSize: 13, fontWeight: '700', color: colors.textWeak },
  title: { fontSize: 22, fontWeight: '900', lineHeight: 32, color: colors.text },
  rule: { height: 1, backgroundColor: colors.line },
  body: { fontSize: 15.5, lineHeight: 29, color: colors.text },
  store: { fontSize: 13, fontWeight: '700', color: colors.textWeak, textAlign: 'right' },
});
