import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const {
  mockPost,
  mockPostLong,
  mockNavigate,
  mockLogin,
} = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPostLong: vi.fn(),
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
  }),
}));

vi.mock('../context/LegalModalContext', () => ({
  useLegalModal: () => ({
    openPrivacy: vi.fn(),
    openTerms: vi.fn(),
  }),
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: mockPost,
    postLong: mockPostLong,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

import LoginPage from './LoginPage';

describe('LoginPage', () => {
  const flushAsyncState = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.useRealTimers();
    mockPost.mockReset();
    mockPostLong.mockReset();
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('does not send OTP when terms are unchecked, even on Enter', async () => {
    render(<LoginPage />);

    const identifierInput = screen.getByPlaceholderText(/email or phone number/i);
    fireEvent.change(identifierInput, { target: { value: 'user@example.com' } });
    fireEvent.keyDown(identifierInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/please accept the terms of use and privacy policy/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('resyncs the OTP timer from the real deadline after the tab regains focus', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));
    mockPost.mockResolvedValueOnce({
      sent: true,
      type: 'email',
      masked: 'u***@example.com',
      expires_at: '2026-03-29T10:02:00.000Z',
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email or phone number/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    act(() => {
      vi.runOnlyPendingTimers();
    });
    await flushAsyncState();

    expect(screen.getByText(/enter 6-digit verification code/i)).toBeInTheDocument();
    expect(screen.getByText(/code expires in 2:00/i)).toBeInTheDocument();

    act(() => {
      vi.setSystemTime(new Date('2026-03-29T10:02:30.000Z'));
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flushAsyncState();

    expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
  });

  it('unlocks resend immediately when the server says the OTP already expired', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));
    mockPost.mockResolvedValueOnce({
      sent: true,
      type: 'email',
      masked: 'u***@example.com',
      expires_at: '2026-03-29T10:02:00.000Z',
    });
    mockPostLong.mockRejectedValueOnce(new Error('OTP expired or not found. Please request a new code.'));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email or phone number/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    act(() => {
      vi.runOnlyPendingTimers();
    });
    await flushAsyncState();

    expect(screen.getByText(/enter 6-digit verification code/i)).toBeInTheDocument();

    const otpBoxes = screen.getAllByRole('textbox');
    otpBoxes.slice(0, 6).forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } });
    });
    fireEvent.change(screen.getByPlaceholderText(/your full name/i), {
      target: { value: 'Yagya' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify & continue/i }));
    act(() => {
      vi.runOnlyPendingTimers();
    });
    await flushAsyncState();

    expect(screen.getByText(/otp expired or not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
  });
});
