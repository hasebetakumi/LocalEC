import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

jest.mock('@/lib/supabase', () => ({
  checkConnection: jest.fn().mockResolvedValue(true),
}));

describe('HomeScreen', () => {
  it('アプリ名を表示する', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('LocalEC')).toBeTruthy();
  });

  it('Supabase への接続結果を表示する', async () => {
    await render(<HomeScreen />);
    expect(await screen.findByText('Supabase に接続できました')).toBeTruthy();
  });
});
