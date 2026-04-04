import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SiteGate from './SiteGate';
import { clearAcceptanceGateToken, getAcceptanceGateToken } from '../api/acceptanceGate';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    post: (...args) => mocks.apiPost(...args),
  },
}));

describe('SiteGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAcceptanceGateToken();
  });

  it('lets the app through immediately when the backend gate is disabled', async () => {
    mocks.apiPost.mockResolvedValueOnce({ enabled: false });

    render(
      <SiteGate>
        <div>App Ready</div>
      </SiteGate>,
    );

    await waitFor(() => {
      expect(screen.getByText('App Ready')).toBeInTheDocument();
    });
  });

  it('requests a code and unlocks the app after a successful verification', async () => {
    mocks.apiPost
      .mockResolvedValueOnce({
        enabled: true,
        sent: true,
        masked_email: 'd***@gmail.com',
        expires_in_seconds: 300,
      })
      .mockResolvedValueOnce({
        enabled: true,
        verified: true,
        access_token: 'gate-token-123',
        token_type: 'bearer',
      });

    render(
      <SiteGate>
        <div>Unlocked App</div>
      </SiteGate>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Acceptance Testing Access/i)).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole('textbox');
    '123456'.split('').forEach((digit, index) => {
      fireEvent.change(inputs[index], { target: { value: digit } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Unlock Site/i }));

    await waitFor(() => {
      expect(screen.getByText('Unlocked App')).toBeInTheDocument();
    });
    expect(getAcceptanceGateToken()).toBe('gate-token-123');
  });
});

