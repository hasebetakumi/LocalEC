import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { useRequireRegistered } from '@/features/auth/useBookingGate';
import { useListing } from '@/features/listings/hooks';
import { BookForm } from '@/features/listings/screens/BookForm';

/** U-20 予約・申し込み・応募 */
export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading } = useRequireRegistered(id);
  const { data, isPending, isError, refetch } = useListing(id);

  if (isPending || authLoading || isError || !data || data.kind === 'notice') {
    return (
      <Screen>
        <NavBar />
        {isPending || authLoading ? (
          <Loading />
        ) : isError ? (
          <LoadError onRetry={() => void refetch()} />
        ) : (
          <EmptyState
            icon="bag"
            title="この掲載は見つかりませんでした"
            body="掲載が終了した可能性があります。"
          />
        )}
      </Screen>
    );
  }
  return <BookForm listing={data} onRefetch={refetch} />;
}
