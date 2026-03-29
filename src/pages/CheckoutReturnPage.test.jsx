import { act, render, screen } from '@testing-library/react';
import CheckoutReturnPage from './CheckoutReturnPage';

const mocks = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  refreshUserMock: vi.fn(),
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  currentSearchParams: new URLSearchParams(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigateMock,
    useSearchParams: () => [mocks.currentSearchParams],
  };
});

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGetMock(...args),
    post: (...args) => mocks.apiPostMock(...args),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    refreshUser: mocks.refreshUserMock,
  }),
}));

describe('CheckoutReturnPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.currentSearchParams = new URLSearchParams();
    mocks.apiPostMock.mockResolvedValue({});
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn) => {
      if (typeof fn === 'function') fn();
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles razorpay success by clearing cart data and redirecting to reports', async () => {
    mocks.currentSearchParams = new URLSearchParams('gateway=razorpay&payment=success');
    localStorage.setItem('cart', JSON.stringify([{ id: 'career' }]));
    localStorage.setItem('cart_ids', JSON.stringify(['career']));

    render(<CheckoutReturnPage />);

    expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
    expect(localStorage.getItem('cart')).toBeNull();
    expect(localStorage.getItem('cart_ids')).toBeNull();
    expect(mocks.refreshUserMock).toHaveBeenCalledTimes(1);

    expect(mocks.navigateMock).toHaveBeenCalledWith('/my-reports', { replace: true });
    expect(mocks.apiGetMock).not.toHaveBeenCalled();
  });

  it('verifies a completed stripe session and redirects question orders correctly', async () => {
    mocks.currentSearchParams = new URLSearchParams('session_id=cs_test_123&type=question');
    mocks.apiGetMock.mockResolvedValue({
      status: 'complete',
      customer_email: 'user@example.com',
      order_type: 'question',
      order_id: 'order-123',
    });

    render(<CheckoutReturnPage />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
    expect(mocks.apiGetMock).toHaveBeenCalledWith('/v1/payment/session-status?session_id=cs_test_123');
    expect(mocks.refreshUserMock).toHaveBeenCalledTimes(1);
    expect(mocks.navigateMock).toHaveBeenCalledWith('/my-reports?tab=questions&order=order-123', { replace: true });
  });

  it('treats a paid stripe session as successful even if status is still open', async () => {
    mocks.currentSearchParams = new URLSearchParams('session_id=cs_test_456&type=question');
    mocks.apiGetMock.mockResolvedValue({
      status: 'open',
      payment_status: 'paid',
      order_type: 'question',
      order_id: 'order-456',
    });

    render(<CheckoutReturnPage />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
    expect(mocks.refreshUserMock).toHaveBeenCalledTimes(1);
    expect(mocks.navigateMock).toHaveBeenCalledWith('/my-reports?tab=questions&order=order-456', { replace: true });
  });

  it('shows report-delivery guidance for completed report orders', async () => {
    mocks.currentSearchParams = new URLSearchParams('session_id=cs_test_report');
    mocks.apiGetMock.mockResolvedValue({
      status: 'complete',
      payment_status: 'paid',
      customer_email: 'user@example.com',
      order_type: 'report',
      order_id: 'order-report-1',
    });

    render(<CheckoutReturnPage />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
    expect(screen.getByText(/Your PDF report is being prepared, emailed to you, and saved in My Reports/i)).toBeInTheDocument();
    expect(mocks.navigateMock).toHaveBeenCalledWith('/my-reports', { replace: true });
  });

  it('redirects completed credit-pack purchases to subscription management', async () => {
    mocks.currentSearchParams = new URLSearchParams('session_id=cs_credit_pack&type=credit_pack');
    mocks.apiGetMock.mockResolvedValue({
      status: 'complete',
      payment_status: 'paid',
      order_type: 'credit_pack',
      order_id: 'order-credit-pack-1',
    });

    render(<CheckoutReturnPage />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/AI chat credits have been added/i)).toBeInTheDocument();
    expect(mocks.navigateMock).toHaveBeenCalledWith('/my-data/subscription', { replace: true });
  });
});
