import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { checkConnection } from '@/lib/supabase';

type Status = 'checking' | 'ok' | 'ng';

const statusLabel: Record<Status, string> = {
  checking: 'Supabase に接続中…',
  ok: 'Supabase に接続できました',
  ng: 'Supabase に接続できません。supabase start と .env を確認してください',
};

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let active = true;
    checkConnection().then((ok) => {
      if (active) setStatus(ok ? 'ok' : 'ng');
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LocalEC</Text>
      <Text style={styles.description}>環境構築が完了しました。画面はこれから作ります。</Text>
      <Text style={styles.status} testID="supabase-status">
        {statusLabel[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
