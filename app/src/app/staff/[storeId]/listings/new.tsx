import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/LoadState';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { ListingFormView } from '@/features/staff/components/ListingFormView';
import { duplicateForm, formDefaults } from '@/features/staff/form';
import { useStaffListing } from '@/features/staff/hooks';
import { useStaffStore } from '@/features/staff/StaffStoreContext';
import type { ListingKind } from '@/features/staff/types';

const KINDS: readonly ListingKind[] = ['product', 'event', 'job', 'notice'];

/** A-10 新しく掲載する（?kind=…、?from=<掲載ID> なら複製） */
export default function NewListingScreen() {
  const { kind, from } = useLocalSearchParams<{ kind?: string; from?: string }>();
  const store = useStaffStore();
  const source = useStaffListing(from);
  const [now] = useState(() => new Date());
  const k = KINDS.find((x) => x === kind);

  if (!k) {
    return (
      <StaffScreen>
        <StaffNavBar backIcon="close" />
        <EmptyState icon="list" title="種類を選び直してください" />
      </StaffScreen>
    );
  }
  if (from && source.isPending) {
    return (
      <StaffScreen>
        <StaffNavBar backIcon="close" />
        <Loading />
      </StaffScreen>
    );
  }
  const initial =
    from && source.data && source.data.kind === k
      ? duplicateForm(source.data, now)
      : formDefaults(k, store, now);
  return <ListingFormView kind={k} store={store} initial={initial} />;
}
