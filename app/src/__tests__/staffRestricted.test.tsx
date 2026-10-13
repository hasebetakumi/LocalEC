import { fireEvent, screen } from '@testing-library/react-native';

import { RestrictedEditView } from '@/features/staff/components/RestrictedEditView';
import { fetchListingBookings } from '@/features/staff/api';
import { makeStaffListing } from '@/test/staffFixtures';
import { renderStaff } from '@/test/staffRender';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useNavigation: () => ({ addListener: () => () => {}, dispatch: jest.fn() }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/staff/api', () => {
  const actual = jest.requireActual('@/features/staff/api');
  return {
    ...actual,
    fetchListingBookings: jest.fn(),
    updateListing: jest.fn(),
    endListing: jest.fn(),
  };
});

describe('A-12 予約後の編集', () => {
  it('固定の項目は入力欄にならず、数量は予約済みより減らせない', async () => {
    jest.mocked(fetchListingBookings).mockResolvedValue([]);
    await renderStaff(<RestrictedEditView listing={makeStaffListing()} storeName="駅前店" />);
    expect(screen.getByText('予約が8件入っています')).toBeTruthy();
    expect(screen.getByTestId('locked-fields')).toBeTruthy();
    expect(screen.queryByLabelText('タイトル')).toBeNull();
    expect(screen.getByText('8〜20食の範囲で減らせます')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('数量'), '6');
    expect(screen.getByText('予約済みの8食より少なくはできません')).toBeTruthy();
    expect(screen.getByTestId('save-restricted').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await fireEvent.changeText(screen.getByLabelText('数量'), '10');
    expect(screen.getByTestId('save-restricted').props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});
