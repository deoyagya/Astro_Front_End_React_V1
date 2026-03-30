import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import AdminSubscriptionPage from './AdminSubscriptionPage';

const navigateMock = vi.fn();

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../api/client', () => ({
  api: {
    get: (...args) => apiMocks.get(...args),
    post: (...args) => apiMocks.post(...args),
    put: (...args) => apiMocks.put(...args),
    patch: (...args) => apiMocks.patch(...args),
  },
}));

vi.mock('../../context/StyleContext', () => ({
  useStyles: () => ({
    getStyle: () => ({}),
    getOverride: () => undefined,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('AdminSubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    apiMocks.get.mockImplementation((url) => {
      if (url === '/v1/admin/subscription/entitlements/matrix') {
        return Promise.resolve({
          plans: [
            {
              id: 'plan-1',
              slug: 'basic',
              name: 'Basic',
              color: '#9d7bff',
              is_active: true,
              display_order: 1,
            },
          ],
          rows: [
            {
              feature_key: 'birth_chart_generation',
              name: 'Birth Chart Generation',
              category: 'charts',
              description: 'Controls chart generation.',
              unit_label: 'charts',
              is_active: true,
              display_order: 10,
              metadata_json: {
                entitlement_mode: 'quota',
                limit_period_options: ['monthly'],
              },
              plan_values: [
                {
                  plan_id: 'plan-1',
                  enabled: true,
                  limit_value: 3,
                  limit_period: 'monthly',
                },
              ],
            },
          ],
        });
      }
      if (url === '/v1/admin/subscription/plans') {
        return Promise.resolve([
          {
            id: 'plan-1',
            slug: 'basic',
            name: 'Basic',
            description: 'Starter plan',
            icon: 'fa-gem',
            color: '#9d7bff',
            price_monthly_cents: 250,
            price_yearly_cents: 2500,
            trial_days: 7,
            display_order: 1,
            is_active: true,
            feature_count: 1,
          },
        ]);
      }
      if (url === '/v1/admin/subscription/stats') {
        return Promise.resolve({ active_subscriptions: 1, plans: [] });
      }
      return Promise.resolve([]);
    });
  });

  it('renders the plans tab without crashing and loads plans', async () => {
    render(<AdminSubscriptionPage />);

    expect(screen.getByText(/Subscription Management/i)).toBeInTheDocument();
    expect(await screen.findByText(/Plan Entitlement Matrix/i)).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/subscription/entitlements/matrix');
  });

  it('opens the plans tab without crashing', async () => {
    render(<AdminSubscriptionPage />);

    await screen.findByText(/Plan Entitlement Matrix/i);
    fireEvent.click(screen.getByRole('button', { name: /Plans/i }));

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/subscription/plans');
    });
  });

  it('routes plan actions to the dedicated editor screen', async () => {
    render(<AdminSubscriptionPage />);

    await screen.findByText(/Plan Entitlement Matrix/i);
    fireEvent.click(screen.getByRole('button', { name: /Plans/i }));
    await screen.findByText('Basic');

    fireEvent.click(screen.getByRole('button', { name: /New Plan/i }));
    expect(navigateMock).toHaveBeenCalledWith('/admin/subscriptions/plan/new');

    fireEvent.click(screen.getByTitle('Edit Plan'));
    expect(navigateMock).toHaveBeenCalledWith('/admin/subscriptions/plan/plan-1');
  });
});
