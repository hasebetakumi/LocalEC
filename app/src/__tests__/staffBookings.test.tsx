import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import StaffBookingsScreen from '@/app/staff/[storeId]/(tabs)/bookings';
import StaffBookingScreen from '@/app/staff/[storeId]/bookings/[bookingId]';
import {
  completeBooking,
  fetchStaffBooking,
  fetchStoreBookings,
  revertBooking,
} from '@/features/staff/api';
import { makeRow } from '@/test/staffFixtures';
import { mockAuthValue, renderStaff } from '@/test/staffRender';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
    navigate: jest.fn(),
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ storeId: 'store-1', bookingId: 'b-1' }),
  usePathname: () => '/staff/store-1/bookings',
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => mockAuthValue }));
jest.mock('@/features/staff/api', () => {
  const actual = jest.requireActual('@/features/staff/api');
  return {
    ...actual,
    fetchStoreBookings: jest.fn(),
    searchBookings: jest.fn().mockResolvedValue([]),
    fetchStaffBooking: jest.fn(),
    completeBooking: jest.fn(),
    revertBooking: jest.fn(),
    staffCancelBooking: jest.fn(),
  };
});

const HOUR = 3600e3;
const live = (o: Parameters<typeof makeRow>[0] = {}) => {
  const now = Date.now();
  return makeRow({
    scheduleStart: new Date(now + HOUR),
    scheduleEnd: new Date(now + 2 * HOUR),
    expiresAt: new Date(now + 2 * HOUR),
    ...o,
  });
};

beforeEach(() => jest.clearAllMocks());

describe('A-20 予約・申し込み', () => {
  it('初期値は本日×未完了。完了は出さず、未完了のピルも出さない', async () => {
    jest
      .mocked(fetchStoreBookings)
      .mockResolvedValue([
        live({ id: 'a', number: '0427' }),
        live({ id: 'b', number: '0421', status: 'completed', completedAt: new Date() }),
      ]);
    await renderStaff(<StaffBookingsScreen />);
    expect(await screen.findByText('0427')).toBeTruthy();
    expect(screen.queryByText('0421')).toBeNull();
    expect(screen.queryByText('未受け取り')).toBeNull();
    expect(jest.mocked(fetchStoreBookings).mock.calls[0][1]).toBe('today');
  });

  it('状態を「すべて」にすると完了も出て、完了だけピルが付く', async () => {
    jest
      .mocked(fetchStoreBookings)
      .mockResolvedValue([
        live({ id: 'a', number: '0427' }),
        live({ id: 'b', number: '0421', status: 'completed', completedAt: new Date() }),
      ]);
    await renderStaff(<StaffBookingsScreen />);
    await fireEvent.press(await screen.findByTestId('filter-status'));
    await fireEvent.press(await screen.findByTestId('option-all'));
    expect(await screen.findByText('0421')).toBeTruthy();
    expect(screen.getByText('受け取り済み')).toBeTruthy();
  });
});

describe('A-21 受け取り処理', () => {
  it('1 タップで受け取り済みにして戻る', async () => {
    jest.mocked(fetchStaffBooking).mockResolvedValue(live());
    jest.mocked(completeBooking).mockResolvedValue(undefined);
    await renderStaff(<StaffBookingScreen />);
    expect(await screen.findByText('栗橋 花子 様')).toBeTruthy();
    expect(screen.getByText('090-1234-5678')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('complete-booking'));
    await waitFor(() => expect(jest.mocked(completeBooking).mock.calls[0]?.[0]).toBe('b-1'));
    expect(router.back).toHaveBeenCalled();
  });

  it('受け取り済みなら「未受け取りに戻す」', async () => {
    jest
      .mocked(fetchStaffBooking)
      .mockResolvedValue(live({ status: 'completed', completedAt: new Date() }));
    jest.mocked(revertBooking).mockResolvedValue(undefined);
    await renderStaff(<StaffBookingScreen />);
    await fireEvent.press(await screen.findByText('未受け取りに戻す'));
    await waitFor(() => expect(jest.mocked(revertBooking).mock.calls[0]?.[0]).toBe('b-1'));
  });

  it('削除済みユーザーは氏名と電話を出さない', async () => {
    jest
      .mocked(fetchStaffBooking)
      .mockResolvedValue(live({ customerDeleted: true, customerName: null, customerPhone: null }));
    await renderStaff(<StaffBookingScreen />);
    expect(await screen.findByText('削除済みユーザー')).toBeTruthy();
    expect(screen.queryByText(/様$/)).toBeNull();
  });
});
