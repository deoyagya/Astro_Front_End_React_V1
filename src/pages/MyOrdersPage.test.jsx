import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MyOrdersPage from './MyOrdersPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
  },
}));

describe('MyOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows rechecking a pending stripe order and shows generation notice when payment is confirmed', async () => {
    mocks.apiGet
      .mockResolvedValueOnce([
        {
          id: 'order-1',
          gateway_order_id: 'cs_test_123',
          amount: 2999,
          currency: 'USD',
          status: 'pending',
          receipt: 'REC-1',
          order_type: 'report',
          payment_provider: 'stripe',
          items: [{ id: 'item-1', report_name: 'Shani Sade Sati Report', price: 2999 }],
          created_at: '2026-03-20T10:00:00Z',
        },
      ])
      .mockResolvedValueOnce({ orders: [] })
      .mockResolvedValueOnce({
        status: 'complete',
        payment_status: 'paid',
        order_type: 'report',
      })
      .mockResolvedValueOnce([
        {
          id: 'order-1',
          gateway_order_id: 'cs_test_123',
          amount: 2999,
          currency: 'USD',
          status: 'paid',
          receipt: 'REC-1',
          order_type: 'report',
          payment_provider: 'stripe',
          items: [{ id: 'item-1', report_name: 'Shani Sade Sati Report', price: 2999 }],
          created_at: '2026-03-20T10:00:00Z',
        },
      ])
      .mockResolvedValueOnce({ orders: [] });

    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/REC-1/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/REC-1/i));
    fireEvent.click(screen.getByRole('button', { name: /Recheck Payment/i }));

    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledWith('/v1/payment/session-status?session_id=cs_test_123');
    });

    expect(screen.getByText(/Payment confirmed. Report generation has started/i)).toBeInTheDocument();
  });
});
