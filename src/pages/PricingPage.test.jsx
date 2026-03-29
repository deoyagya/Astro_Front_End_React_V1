import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PricingPage from './PricingPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  navigate: vi.fn(),
  refreshUser: vi.fn(),
  toast: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useSearchParams: () => [mocks.searchParams],
  };
});

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/EmbeddedCheckoutModal', () => ({
  default: ({ clientSecret }) => <div>Stripe Checkout {clientSecret}</div>,
}));

vi.mock('../components/RazorpayCheckoutModal', () => ({
  default: ({ orderId, verifyUrl }) => <div>Razorpay Checkout {orderId} {verifyUrl}</div>,
}));

vi.mock('../hooks/usePaymentGateway', () => ({
  default: () => ({
    gateway: 'stripe',
    currency: 'USD',
    exchangeRate: 1,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'user@example.com', role: 'free' },
    isAuthenticated: true,
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    toast: mocks.toast,
  }),
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
    post: (...args) => mocks.apiPost(...args),
  },
}));

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.apiGet
      .mockResolvedValueOnce({
        plans: [
          {
            slug: 'free',
            name: 'Free',
            description: 'Starter plan',
            icon: '✨',
            price_monthly_cents: 0,
            price_yearly_cents: 0,
            features_json: [],
            display_features: ['3 AI Questions/month', 'Basic Chart'],
            features: {},
            display_order: 0,
          },
        ],
        comparison_features: [
          { key: 'ai_chat', label: 'AI Chat Questions' },
        ],
      })
      .mockResolvedValueOnce({
        packs: [
          {
            id: 'pack_1',
            name: '10 AI Questions',
            credit_amount: 10,
            price_cents: 99,
          },
        ],
      });
  });

  it('starts credit-pack checkout directly from the pricing page', async () => {
    mocks.apiPost.mockResolvedValue({
      gateway: 'stripe',
      client_secret: 'cs_test_secret',
    });

    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText(/10 AI Questions/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Buy Now/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith('/v1/subscription/purchase-credits', {
        pack_id: 'pack_1',
        gateway: 'stripe',
      });
    });

    expect(screen.getByText(/Stripe Checkout cs_test_secret/i)).toBeInTheDocument();
  });

  it('renders backend-driven plan display features and comparison rows', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('3 AI Questions/month')).toBeInTheDocument();
    });

    expect(screen.getByText('Basic Chart')).toBeInTheDocument();
    expect(screen.getByText('AI Chat Questions')).toBeInTheDocument();
  });
});
