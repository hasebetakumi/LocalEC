import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { LoadError, Loading } from '@/components/LoadState';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { StaffWebShell } from '@/components/admin/StaffWebShell';
import { useStoreSummaries } from '@/features/staff/hooks';
import { StaffStoreContext } from '@/features/staff/StaffStoreContext';
import { useStaffLayout } from '@/features/staff/useStaffLayout';
import { adminColors } from '@/theme/adminTokens';

/** 店舗モード。所属している店舗か確かめてから中を出す（違えば A-01 へ） */
export default function StoreModeLayout() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const summaries = useStoreSummaries();
  const { isWide } = useStaffLayout();

  if (summaries.isPending || summaries.isError) {
    return (
      <StaffScreen>
        {summaries.isPending ? <Loading /> : <LoadError onRetry={() => void summaries.refetch()} />}
      </StaffScreen>
    );
  }
  const store = summaries.data.find((s) => s.id === storeId);
  if (!store) return <Redirect href="/staff" />;

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: adminColors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="listings/new"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="listings/[id]/edit"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
  return (
    <StaffStoreContext.Provider value={store}>
      {isWide ? <StaffWebShell store={store}>{stack}</StaffWebShell> : stack}
    </StaffStoreContext.Provider>
  );
}
