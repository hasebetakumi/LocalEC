import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import BookingDetailScreen from '@/app/bookings/[id]/index';
import { cancelBooking, fetchBooking } from '@/features/bookings/api';
import { liveBooking } from '@/test/bookingFixtures';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'b-1' }),
}));
jest.mock('@/features/bookings/api', () => {
  const actual = jest.requireActual('@/features/bookings/api');
  return { ...actual, fetchBooking: jest.fn(), cancelBooking: jest.fn() };
});
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const mockFetch = jest.mocked(fetchBooking);

beforeEach(() => jest.clearAllMocks());

describe('U-22 予約詳細・U-21 キャンセル', () => {
  it('期限内ならキャンセルでき、確認シートで確定する', async () => {
    mockFetch.mockResolvedValue(liveBooking());
    jest.mocked(cancelBooking).mockResolvedValue(undefined);
    await renderScreen(<BookingDetailScreen />);
    expect(await screen.findByTestId('booking-number')).toHaveTextContent('0427');
    await fireEvent.press(screen.getByTestId('open-cancel'));
    expect(await screen.findByText('予約をキャンセルしますか？')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('danger-confirm'));
    await waitFor(() => expect(cancelBooking).toHaveBeenCalledWith('b-1'));
  });

  it('期限後はボタンを出さず、店舗の電話番号を案内する', async () => {
    mockFetch.mockResolvedValue(
      liveBooking({ listing: { cancelDeadline: new Date(Date.now() - 60_000) } }),
    );
    await renderScreen(<BookingDetailScreen />);
    expect(await screen.findByText('アプリからはキャンセルできません')).toBeTruthy();
    expect(screen.queryByTestId('open-cancel')).toBeNull();
    expect(screen.getByText('048-000-0001')).toBeTruthy();
  });

  it('キャンセル不可の設定', async () => {
    mockFetch.mockResolvedValue(liveBooking({ listing: { cancelDeadline: null } }));
    await renderScreen(<BookingDetailScreen />);
    expect(await screen.findByText('この予約はキャンセルできません')).toBeTruthy();
  });

  it('求人は「応募の取り消し」の文言', async () => {
    mockFetch.mockResolvedValue(
      liveBooking({ kind: 'job', amount: null, listing: { payText: '日給 9,000円' } }),
    );
    await renderScreen(<BookingDetailScreen />);
    expect(await screen.findByText('応募を取り消す')).toBeTruthy();
    expect(screen.getByText('受付番号')).toBeTruthy();
  });
});
