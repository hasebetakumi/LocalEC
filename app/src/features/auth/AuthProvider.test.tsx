import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from './AuthProvider';
import { fetchProfile } from './api';

type Listener = (event: string, session: unknown) => void;
let listener: Listener = () => {};
const mockGetSession = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: Listener) => {
        listener = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
      signOut: jest.fn(),
    },
  },
}));
jest.mock('./api', () => ({ fetchProfile: jest.fn() }));

const mockFetchProfile = jest.mocked(fetchProfile);

function Probe() {
  const { loading, isRegistered, session } = useAuth();
  return (
    <Text testID="state">
      {`${loading ? 'loading' : 'ready'}/${session ? 'in' : 'out'}/${isRegistered ? 'reg' : 'unreg'}`}
    </Text>
  );
}

describe('AuthProvider', () => {
  it('ログイン直後はプロフィールを読み終えるまで loading のまま', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let resolveProfile: (p: unknown) => void = () => {};
    mockFetchProfile.mockReturnValue(
      new Promise((r) => {
        resolveProfile = r;
      }) as never,
    );
    await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText('ready/out/unreg')).toBeTruthy();

    // メールのリンクでログインした（セッションだけ先に届く）
    await act(async () => listener('SIGNED_IN', { user: { id: 'u-1' } }));
    expect(screen.getByTestId('state')).toHaveTextContent('loading/in/unreg');

    await act(async () =>
      resolveProfile({
        id: 'u-1',
        name: '栗橋 花子',
        phone: '09012345678',
        email: 'a@b.jp',
        pending_email: null,
        notifications_enabled: true,
        is_staff: false,
      }),
    );
    expect(screen.getByTestId('state')).toHaveTextContent('ready/in/reg');
  });
});
