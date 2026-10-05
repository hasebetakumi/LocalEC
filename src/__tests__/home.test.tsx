import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('HomeScreen', () => {
  it('アプリ名を表示する', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('LocalEC')).toBeTruthy();
  });
});
