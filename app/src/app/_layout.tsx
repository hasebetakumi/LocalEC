import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { NotificationsBridge } from '@/features/notifications/NotificationsBridge';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  // アプリを前面に戻したら古い（staleTime を過ぎた）データを取り直す。Web は window の focus で動くので不要
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsBridge />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="bookings/[id]/done" options={{ gestureEnabled: false }} />
        </Stack>
        <StatusBar style="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
