import { screen } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/(home)/index';
import { fetchNotices, fetchProducts } from '@/features/listings/api';
import { liveProduct } from '@/test/fixturesRelative';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/listings/api', () => ({ fetchProducts: jest.fn(), fetchNotices: jest.fn() }));

const mockFetchProducts = jest.mocked(fetchProducts);
jest.mocked(fetchNotices).mockResolvedValue([]);

describe('U-10 商品ホーム', () => {
  it('もうすぐ終了の帯に商品が出る', async () => {
    mockFetchProducts.mockResolvedValue([
      liveProduct({ id: 'a', title: '日替わり弁当' }),
      liveProduct({ id: 'b', title: '季節のシフォンケーキ', category: 'sweets' }),
    ]);
    await renderScreen(<HomeScreen />);
    expect(await screen.findByText('もうすぐ終了！')).toBeTruthy();
    expect(screen.getAllByText('日替わり弁当').length).toBeGreaterThan(0);
    expect(screen.getByText('2件')).toBeTruthy();
  });

  it('商品がないときは空状態', async () => {
    mockFetchProducts.mockResolvedValue([]);
    await renderScreen(<HomeScreen />);
    expect(await screen.findByText('いまは商品がありません')).toBeTruthy();
  });
});
