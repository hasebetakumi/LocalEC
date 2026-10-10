import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { EmptyState } from './EmptyState';

/** 読み込み中 */
export function Loading() {
  return (
    <View style={styles.center} testID="loading">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/** 読み込み失敗（再読み込みボタンつき） */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon="bag"
      title="読み込めませんでした"
      body={'通信状態を確認して、\nもう一度お試しください。'}
      action={{ label: '再読み込み', onPress: onRetry, kind: 'secondary' }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
