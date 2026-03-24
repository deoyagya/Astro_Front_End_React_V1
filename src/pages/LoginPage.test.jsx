import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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
});
