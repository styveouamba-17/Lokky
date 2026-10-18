import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react-native';
import { useSessionStore } from '@/state/session';
import { renderWithProviders } from '@/test/render';
import { makeTestClient, signInAs } from '@/test/mockApi';
import { profileKeys } from '../queryKeys';
import { listUserActivities } from '../api';
import { MyProfileScreen } from '../screens/MyProfileScreen';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));
jest.mock('../api', () => ({
  getUser: jest.fn(),
  listUserActivities: jest.fn(),
}));

afterEach(() => {
  useSessionStore.setState({ status: 'unknown', tokens: null, me: null, firstNameHint: null });
});

describe('MyProfileScreen', () => {
  it('keeps the latest session avatar when the profile query cache is stale', async () => {
    const { me } = makeTestClient();
    const avatarUrl = 'https://pub-example.r2.dev/avatars/u_awa/photo.jpg';
    const latestMe = { ...me, avatarUrl };
    signInAs(latestMe);
    jest.mocked(listUserActivities).mockResolvedValue({ items: [], nextCursor: null });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(profileKeys.user(me.id), {
      ...me,
      firstName: 'Ancien prénom',
      avatarUrl: null,
      relationship: { canMessage: false, isBlocked: false },
    });
    queryClient.setQueryData(profileKeys.activities(me.id), { items: [], nextCursor: null });

    await renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <MyProfileScreen />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('header', { name: latestMe.firstName })).toBeOnTheScreen();
    expect(screen.getByTestId('avatar-image')).toBeOnTheScreen();
    queryClient.clear();
  });
});
