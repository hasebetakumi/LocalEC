import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import NewListingScreen from '@/app/staff/[storeId]/listings/new';
import { insertListing } from '@/features/staff/api';
import { renderStaff } from '@/test/staffRender';

const mockParams = { kind: 'product' as string | undefined };
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ addListener: () => () => {}, dispatch: jest.fn() }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/staff/photo', () => ({
  pickAndUploadPhoto: jest.fn(),
  removePhotoIfUnused: jest.fn(),
}));
jest.mock('@/features/staff/api', () => {
  const actual = jest.requireActual('@/features/staff/api');
  return { ...actual, insertListing: jest.fn(), fetchStaffListing: jest.fn() };
});

beforeEach(() => jest.clearAllMocks());

describe('A-10 掲載入力', () => {
  it('公開は必須が空だと欄の下に理由を出して保存しない', async () => {
    await renderStaff(<NewListingScreen />);
    await fireEvent.press(screen.getByTestId('publish'));
    expect(await screen.findByText('タイトルを入力してください')).toBeTruthy();
    expect(screen.getByText('カテゴリを選んでください')).toBeTruthy();
    expect(insertListing).not.toHaveBeenCalled();
  });

  it('下書き保存はタイトルだけで保存できる', async () => {
    jest.mocked(insertListing).mockResolvedValue('new-id');
    await renderStaff(<NewListingScreen />);
    await fireEvent.changeText(screen.getByLabelText('タイトル'), '試作の弁当');
    await fireEvent.press(screen.getByTestId('save-draft'));
    await waitFor(() => expect(insertListing).toHaveBeenCalled());
    expect(jest.mocked(insertListing).mock.calls[0][0]).toMatchObject({
      store_id: 'store-1',
      kind: 'product',
      status: 'draft',
      title: '試作の弁当',
    });
  });

  it('お知らせは本文の欄があり写真の欄はない', async () => {
    mockParams.kind = 'notice';
    await renderStaff(<NewListingScreen />);
    expect(screen.getByLabelText('本文')).toBeTruthy();
    expect(screen.queryByText('＋ 写真を選ぶ')).toBeNull();
    mockParams.kind = 'product';
  });
});
