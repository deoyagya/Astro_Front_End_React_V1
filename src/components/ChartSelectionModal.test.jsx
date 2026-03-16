import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChartSelectionModal from './ChartSelectionModal';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPostLong: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
    postLong: (...args) => mocks.apiPostLong(...args),
  },
}));

vi.mock('../hooks/usePaymentGateway', () => ({
  default: () => ({
    gateway: 'stripe',
    currency: 'USD',
  }),
}));

vi.mock('./EmbeddedCheckoutModal', () => ({
  default: ({ clientSecret }) => <div>Stripe Checkout: {clientSecret}</div>,
}));

vi.mock('./RazorpayCheckoutModal', () => ({
  default: () => <div>Razorpay Checkout</div>,
}));

describe('ChartSelectionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads saved charts and creates a per-chart order payload', async () => {
    mocks.apiGet.mockResolvedValue({
      charts: [
        {
          id: 'chart-1',
          birth_data: {
            name: 'Ria Sharma',
            dob: '1990-01-15',
            tob: '10:30',
            place_of_birth: 'Melbourne',
            gender: 'female',
          },
        },
      ],
    });
    mocks.apiPostLong.mockResolvedValue({
      gateway: 'stripe',
      client_secret: 'cs_test_secret',
    });

    render(
      <MemoryRouter>
        <ChartSelectionModal
          isOpen
          onClose={vi.fn()}
          reportSlug="career"
          reportName="Career Report"
          reportPrice={1999}
          reportIcon="fa-briefcase"
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Ria Sharma')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Ria Sharma/i }));
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Pay/i }));

    await waitFor(() => {
      expect(mocks.apiPostLong).toHaveBeenCalledTimes(1);
    });

    expect(mocks.apiPostLong).toHaveBeenCalledWith('/v1/payment/create-order', expect.objectContaining({
      amount: 1999,
      items: [
        {
          id: 'career',
          name: 'Career Report - Ria Sharma',
          price: 1999,
          chart_id: 'chart-1',
        },
      ],
    }));
    expect(screen.getByText(/Stripe Checkout: cs_test_secret/i)).toBeInTheDocument();
  });
});
