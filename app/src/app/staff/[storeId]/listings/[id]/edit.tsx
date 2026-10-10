import { useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { LoadError, Loading } from '@/components/LoadState';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { ListingFormView } from '@/features/staff/components/ListingFormView';
import { RestrictedEditView } from '@/features/staff/components/RestrictedEditView';
import { isRestricted, listingToForm } from '@/features/staff/form';
import { useStaffListing } from '@/features/staff/hooks';
import { useStaffStore } from '@/features/staff/StaffStoreContext';

/** A-10 掲載の編集。予約が入っていれば A-12（制限つき） */
export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStaffStore();
  const listing = useStaffListing(id);

  if (listing.isPending || listing.isError || !listing.data) {
    return (
      <StaffScreen>
        <StaffNavBar backIcon="close" />
        {listing.isPending ? (
          <Loading />
        ) : listing.isError ? (
          <LoadError onRetry={() => void listing.refetch()} />
        ) : (
          <EmptyState icon="list" title="この掲載は見つかりませんでした" />
        )}
      </StaffScreen>
    );
  }
  const l = listing.data;
  if (isRestricted(l)) return <RestrictedEditView listing={l} storeName={store.name} />;
  return (
    <ListingFormView
      kind={l.kind}
      store={store}
      initial={listingToForm(l)}
      editing={{ id: l.id, status: l.status, photoUrl: l.photoUrl }}
    />
  );
}
