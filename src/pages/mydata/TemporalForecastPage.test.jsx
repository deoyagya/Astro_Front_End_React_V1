import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TemporalForecastPage from './TemporalForecastPage';

vi.mock('../../context/MyDataContext', () => ({
  useMyData: () => ({
    birthPayload: null,
    refreshKey: 0,
    hasBirthData: false,
    chartBundle: null,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'free' },
  }),
}));

vi.mock('../../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../../api/client', () => ({
  api: {
    post: vi.fn(),
    postLong: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  ReferenceDot: () => null,
}));

describe('TemporalForecastPage', () => {
  it('routes premium upgrade CTA to pricing', () => {
    render(
      <MemoryRouter>
        <TemporalForecastPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Upgrade to Premium/i })).toHaveAttribute('href', '/pricing');
  });
});
