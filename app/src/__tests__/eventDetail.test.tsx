import { screen } from '@testing-library/react-native';

import ListingDetailScreen from '@/app/listings/[id]/index';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchListing } from '@/features/listings/api';
import type { EventListing, JobListing } from '@/features/listings/types';
import { store2 } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'e-1' }),
  Redirect: () => null,
}));
jest.mock('@/features/listings/api', () => ({ fetchListing: jest.fn() }));
jest.mock('@/features/auth/api', () => ({ saveNextPath: jest.fn() }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const HOUR = 60 * 60 * 1000;
const now = Date.now();

function event(o: Partial<EventListing> = {}): EventListing {
  return {
    kind: 'event',
    id: 'e-1',
    title: '親子でさつまいも掘り体験',
    body: null,
    photoUrl: null,
    publishStart: new Date(now - 24 * HOUR),
    publishEnd: new Date(now + 240 * HOUR),
    displayStatus: 'published',
    store: store2,
    pricePerPerson: 500,
    capacity: 20,
    maxPerBooking: 4,
    remaining: 8,
    eventStart: new Date(now + 200 * HOUR),
    eventEnd: new Date(now + 202 * HOUR),
    placeName: 'あけぼの農園 第2畑',
    placeAddress: '埼玉県久喜市栗橋北3-10',
    applicationDeadline: new Date(now + 100 * HOUR),
    cancelDeadline: new Date(now + 150 * HOUR),
    conditions: '軍手をお持ちください。',
    ...o,
  };
}

beforeEach(() => {
  jest.mocked(useAuth).mockReturnValue({
    session: null,
    profile: null,
    isRegistered: false,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
});

describe('U-12 イベント・求人詳細', () => {
  it('受付中のイベント', async () => {
    jest.mocked(fetchListing).mockResolvedValue(event());
    await renderScreen(<ListingDetailScreen />);
    expect(await screen.findByText('参加を申し込む')).toBeTruthy();
    expect(screen.getByText('残り定員 8名 / 20名')).toBeTruthy();
    expect(screen.getByText('軍手をお持ちください。')).toBeTruthy();
  });

  it('満員はボタンが押せず理由を出す', async () => {
    jest.mocked(fetchListing).mockResolvedValue(event({ remaining: 0 }));
    await renderScreen(<ListingDetailScreen />);
    expect(await screen.findByText('申し込みできません')).toBeTruthy();
    expect(screen.getByTestId('go-book').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByText(/定員に達したため/)).toBeTruthy();
  });

  it('求人は募集人数に達しても応募できる', async () => {
    const job: JobListing = {
      ...event(),
      kind: 'job',
      id: 'j-1',
      title: '稲の脱穀作業（日払い）',
      payText: '日給 9,000円',
      payAmount: 9000,
      payUnit: 'daily',
      headcount: 5,
      reservedQuantity: 5,
      workStart: new Date(now + 200 * HOUR),
      workEnd: new Date(now + 207 * HOUR),
      workText: null,
    };
    jest.mocked(fetchListing).mockResolvedValue(job);
    await renderScreen(<ListingDetailScreen />);
    expect(await screen.findByText('この求人に応募する')).toBeTruthy();
    expect(screen.getByText('募集人数に達していますが、引き続き応募できます。')).toBeTruthy();
    expect(screen.getByText('9,000円')).toBeTruthy();
  });
});
