import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderPage from './OrderPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
    post: (...args) => mocks.apiPost(...args),
  },
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ApiError', () => ({
  default: ({ message }) => message ? <div>{message}</div> : null,
}));

vi.mock('../components/EmbeddedCheckoutModal', () => ({
  default: () => <div>Embedded Checkout</div>,
}));

vi.mock('../components/RazorpayCheckoutModal', () => ({
  default: () => <div>Razorpay Checkout</div>,
}));

vi.mock('../hooks/usePaymentGateway', () => ({
  default: () => ({
    currency: 'USD',
    gateway: 'stripe',
  }),
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => ({}),
  }),
}));

describe('OrderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('blocks checkout when the validated cart requires saved-chart ordering', async () => {
    mocks.apiGet.mockResolvedValue({
      reports: [
        { id: 'career', name: 'Career & Finance', price_display: '$1499.00', price_cents: 149900, icon: 'fa-briefcase' },
      ],
    });
    mocks.apiPost.mockResolvedValue({
      items: [
        {
          id: 'career',
          name: 'Career & Finance',
          price_cents: 149900,
          price_display: '$1499.00',
          icon: 'fa-briefcase',
          requires_saved_chart: true,
          unsupported_order_flow: false,
          order_flow_hint: 'This report requires a saved chart before checkout.',
        },
      ],
      total_cents: 149900,
      total_display: '$1499.00',
      item_count: 1,
      display_currency: 'USD',
    });

    render(<OrderPage />);

    await waitFor(() => {
      expect(screen.getByText('Career & Finance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByText(/require a saved chart before checkout/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled();
  });
});
