import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  persistSession,
  refreshStoredSession,
  sessionKeys,
} from './session';

describe('session helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persists and clears session data consistently', () => {
    persistSession({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      user: { id: 'u1', role: 'admin' },
    });

    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
    expect(getStoredUser()).toEqual({ id: 'u1', role: 'admin' });

    clearSession();

    expect(getAccessToken()).toBe('');
    expect(getRefreshToken()).toBe('');
    expect(getStoredUser()).toBeNull();
  });

  it('refreshes stored session and emits a refresh event marker', async () => {
    localStorage.setItem(sessionKeys.REFRESH_TOKEN_KEY, 'refresh-456');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      }),
    }));

    const result = await refreshStoredSession();

    expect(result).toEqual({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });
    expect(getAccessToken()).toBe('new-access');
    expect(getRefreshToken()).toBe('new-refresh');
    expect(localStorage.getItem(sessionKeys.REFRESH_EVENT_KEY)).toBeTruthy();
  });
});
