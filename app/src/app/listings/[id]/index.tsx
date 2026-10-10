import { Redirect, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { NavBar, Screen } from '@/components/Screen';
import { useListing } from '@/features/listings/hooks';
import { EventJobDetail } from '@/features/listings/screens/EventJobDetail';
import { ProductDetail } from '@/features/listings/screens/ProductDetail';

/** U-12 詳細（種類で切り替え。お知らせはお知らせ詳細へ） */
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, refetch } = useListing(id);

  if (isPending || isError || !data) {
    return (
      <Screen>
        <NavBar />
        {isPending ? (
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
  switch (data.kind) {
    case 'product':
      return <ProductDetail product={data} />;
    case 'event':
    case 'job':
      return <EventJobDetail listing={data} />;
    case 'notice':
      return <Redirect href={{ pathname: '/notices/[id]', params: { id: data.id } }} />;
  }
}
