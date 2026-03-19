import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from './ReportsPage';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
}));

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders report cards from the API and opens the sample modal', async () => {
    api.get.mockResolvedValue({
      reports: [
        {
          id: 'career',
          title: 'Career Report',
          icon: 'fa-briefcase',
          desc: 'Career sample description',
          pages: '24',
          delivery_hours: 24,
          price: 2999,
          badge: 'Popular',
          warnings: ['Timing needs attention'],
          highlights: ['Promotion windows'],
          planets: [{ name: 'Saturn', house: '10th', status: 'afflicted', effect: 'Delay' }],
          remedies: ['Strengthen Saturn'],
        },
      ],
    });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Career Report')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /view sample/i }));

    expect(
      screen.getByRole('heading', { name: /Career Report .* Sample Preview/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Promotion windows/i)).toBeInTheDocument();
  });
});
