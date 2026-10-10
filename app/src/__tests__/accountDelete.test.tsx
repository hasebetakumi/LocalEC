import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import AccountDeleteScreen from '@/app/account/delete';
import { useAuth } from '@/features/auth/AuthProvider';
import { deleteMyAccount, fetchMyBookings } from '@/features/bookings/api';
import { liveBooking } from '@/test/bookingFixtures';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn(), canDismiss: () => false },
  Redirect: () => null,
}));
jest.mock('@/features/bookings/api', () => {
  const actual = jest.requireActual('@/features/bookings/api');
  return { ...actual, fetchMyBookings: jest.fn(), deleteMyAccount: jest.fn() };
});
jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signOut: jest.fn() } } }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'u-1' } } as never,
    profile: null,
    isRegistered: true,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
});

describe('U-02 アカウント削除', () => {
  it('受け取り前の予約があると削除できない', async () => {
    jest.mocked(fetchMyBookings).mockResolvedValue([liveBooking()]);
    await renderScreen(<AccountDeleteScreen />);
    expect(await screen.findByText(/今は削除できません/)).toBeTruthy();
    expect(screen.getByTestId('blocking-0427')).toBeTruthy();
    expect(screen.getByTestId('delete-account').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('予約中がなければ確認シートから削除できる', async () => {
    jest
      .mocked(fetchMyBookings)
      .mockResolvedValue([liveBooking({ status: 'completed', completedAt: new Date() })]);
    jest.mocked(deleteMyAccount).mockResolvedValue(undefined);
    await renderScreen(<AccountDeleteScreen />);
    await fireEvent.press(await screen.findByTestId('delete-account'));
    expect(await screen.findByText('本当に削除しますか？')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('danger-confirm'));
    await waitFor(() => expect(deleteMyAccount).toHaveBeenCalled());
  });
});
