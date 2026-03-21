import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderPage from './OrderPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPostLong: vi.fn(),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ApiError', () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock('../components/EmbeddedCheckoutModal', () => ({
  default: () => <div>Stripe Checkout</div>,
}));

vi.mock('../components/RazorpayCheckoutModal', () => ({
  default: () => <div>Razorpay Checkout</div>,
}));

vi.mock('../hooks/usePaymentGateway', () => ({
  default: () => ({
    gateway: 'stripe',
    currency: 'USD',
  }),
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
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
    postLong: (...args) => mocks.apiPostLong(...args),
  },
}));

describe('OrderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('routes Sade Sati users to the dedicated landing flow instead of generic cart checkout', async () => {
    mocks.apiGet.mockResolvedValue({
      reports: [
        {
          id: 'sade-sati',
          name: 'Shani Sade Sati Report',
          price_cents: 2999,
          price_display: '$29.99',
          icon: 'fa-moon',
        },
      ],
    });

    render(
      <MemoryRouter>
        <OrderPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Shani Sade Sati Report/i)).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/Shani Sade Sati Report selection/i);
    expect(checkbox).toBeDisabled();
    expect(screen.getByRole('link', { name: /Open Sade Sati order page/i })).toHaveAttribute('href', '/sade-sati-report');
  });
});
