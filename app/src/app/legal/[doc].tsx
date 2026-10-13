import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { NavBar, Screen } from '@/components/Screen';
import { legalTitle } from '@/features/legal/docs';
import { colors } from '@/theme/tokens';

/** 利用規約・プライバシーポリシー・特商法表記・お問い合わせ（文面を受け取るまで枠だけ） */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const title = legalTitle(doc);
  return (
    <Screen>
      <NavBar title={title ?? ''} />
      {title ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.body}>内容は準備中です。</Text>
          </Card>
        </ScrollView>
      ) : (
        <EmptyState icon="ticket" title="ページが見つかりませんでした" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  card: { padding: 22 },
  body: { fontSize: 15, lineHeight: 26, color: colors.textSub },
});
