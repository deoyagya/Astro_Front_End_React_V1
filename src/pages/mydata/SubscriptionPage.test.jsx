import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SubscriptionPage from './SubscriptionPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  navigate: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('../../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
    post: (...args) => mocks.apiPost(...args),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Bharti',
      email: 'bharti@example.com',
      role: 'free',
    },
    refreshUser: mocks.refreshUser,
  }),
}));

vi.mock('../../hooks/usePaymentGateway', () => ({
  default: () => ({
    gateway: 'stripe',
    currency: 'USD',
    exchangeRate: 1,
    razorpayKeyId: null,
    loading: false,
  }),
}));

vi.mock('../../components/EmbeddedCheckoutModal', () => ({
  default: () => null,
}));

vi.mock('../../components/RazorpayCheckoutModal', () => ({
  default: () => null,
}));

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiGet
      .mockResolvedValueOnce({
        has_subscription: false,
        plan_slug: 'free',
        plan_name: 'Free',
        status: 'active',
        billing_cycle: null,
        current_period_end: null,
        features: {
          monthly_prediction_report: { enabled: false, limit: 0, period: null },
          daily_prediction_report: { enabled: false, limit: 0, period: null },
        },
        credits: {},
      })
      .mockResolvedValueOnce({ balances: {} })
      .mockResolvedValueOnce({ packs: [] });
  });

  it('renders safely with the flat backend subscription response shape', async () => {
    render(<SubscriptionPage />);

    await waitFor(() => {
      expect(screen.getByText(/Current Plan/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getAllByText(/Upgrade required/i)).toHaveLength(2);
    expect(screen.getByText(/Forecast entitlements are controlled by your subscription plan/i)).toBeInTheDocument();
  });
});
