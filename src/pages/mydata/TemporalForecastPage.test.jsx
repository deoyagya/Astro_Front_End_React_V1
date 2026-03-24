import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TemporalForecastPage from './TemporalForecastPage';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPostLong: vi.fn(),
  mockMyData: {
    birthPayload: null,
    refreshKey: 0,
    hasBirthData: false,
    chartBundle: null,
  },
  mockAuth: {
    user: { role: 'free' },
  },
}));

vi.mock('../../context/MyDataContext', () => ({
  useMyData: () => mocks.mockMyData,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mocks.mockAuth,
}));

vi.mock('../../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../../api/client', () => ({
  api: {
    post: mocks.mockPost,
    postLong: mocks.mockPostLong,
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
  beforeEach(() => {
    mocks.mockMyData = {
      birthPayload: null,
      refreshKey: 0,
      hasBirthData: false,
      chartBundle: null,
    };
    mocks.mockAuth = {
      user: { role: 'free' },
    };
    mocks.mockPost.mockReset();
    mocks.mockPostLong.mockReset();
  });

  it('routes premium upgrade CTA to pricing', () => {
    const { rerender } = render(
      <MemoryRouter>
        <TemporalForecastPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Upgrade to Premium/i })).toHaveAttribute('href', '/pricing');
  });

  it('shows simple mode first and lets the user switch to advanced', async () => {
    mocks.mockAuth = {
      user: { role: 'premium', full_name: 'Sonam' },
    };
    mocks.mockMyData = {
      birthPayload: {
        name: 'Sonam',
        lat: 28.6139,
        lon: 77.2090,
        tz_id: 'Asia/Kolkata',
      },
      refreshKey: 0,
      hasBirthData: true,
      chartBundle: {
        bundle: {
          request: { lat: 28.6139, lon: 77.2090, tz_id: 'Asia/Kolkata' },
          natal: {
            ascendant: { sign: 'Aries' },
            planets: {
              Moon: { sign: 'Taurus', sign_number: 2 },
              Jupiter: { sign_number: 3 },
            },
          },
          dasha_tree: [
            {
              planet: 'Jupiter',
              start: '2025-01-01T00:00:00Z',
              end: '2027-12-31T00:00:00Z',
              sub_periods: [
                {
                  planet: 'Venus',
                  start: '2026-01-01T00:00:00Z',
                  end: '2026-12-31T00:00:00Z',
                },
              ],
            },
          ],
        },
      },
    };
    mocks.mockPostLong.mockResolvedValueOnce({
      computed_at: '2026-03-17T00:00:00Z',
      transit_date: '2026-03-17',
      dasha_path: 'Jupiter/Venus',
      sade_sati_phase: 'none',
      forecasts: [
        {
          life_area_id: '601',
          life_area_name: 'Finance & Wealth',
          domain_name: 'Finance & Wealth',
          icon: 'fa-coins',
          premium_label: 'Wealth Forecast',
          primary_houses: [2, 5, 11],
          window_type: 'opportunity',
          intensity: 'moderate',
          score: 68.4,
          confidence: 'high',
          opportunity_score: 72,
          threat_score: 28,
          dasha_path: 'Jupiter/Venus',
          dasha_lord_nature: 'functional_benefic',
          key_transits: [
            { planet: 'Jupiter', sign: 'Gemini', house_from_lagna: 3, functional_nature: 'functional_benefic' },
          ],
          double_transit: true,
          double_transit_houses: [2, 11],
          sade_sati_phase: 'none',
          start: '2026-04-01',
          end: '2026-09-30',
          summary: 'Supportive phase for money decisions and structured growth.',
          primary_trigger: 'Jupiter strongly activates gains and accumulation houses.',
          interpretation: 'A reviewed interpretation grounded in dasha and transit evidence.',
        },
      ],
      opportunity_count: 1,
      threat_count: 0,
      mixed_count: 0,
      overall_score: 68.4,
      overall_type: 'opportunity',
    });
    mocks.mockPostLong.mockResolvedValueOnce({
      life_area_id: '601',
      life_area_name: 'Finance & Wealth',
      domain_name: 'Finance & Wealth',
      icon: 'fa-coins',
      premium_label: 'Wealth Forecast',
      primary_houses: [2, 5, 11],
      scan_start: '2026-06-15',
      scan_end: '2028-03-16',
      interval_days: 14,
      dasha_path: 'Jupiter/Venus',
      points: [
        { date: '2026-06-15', window_type: 'opportunity', score: 64, opportunity_score: 70, threat_score: 30 },
        { date: '2026-08-15', window_type: 'opportunity', score: 66, opportunity_score: 74, threat_score: 26 },
        { date: '2027-01-15', window_type: 'mixed', score: 52, opportunity_score: 55, threat_score: 45 },
      ],
      opportunity_count: 2,
      threat_count: 0,
      mixed_count: 1,
      peak_opportunity: { date: '2026-08-15', score: 66 },
      peak_threat: null,
    });

    const { rerender } = render(
      <MemoryRouter>
        <TemporalForecastPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Wealth Forecast')).toBeInTheDocument();
    });

    expect(screen.getByText(/How to read this: green shows support and openings, red shows pressure and risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Opportunity dominates here\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Expand Wealth Forecast$/ }));

    await waitFor(() => {
      expect(screen.getByText(/Plain-English Outlook/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Simple view uses the same reviewed forecast as Advanced mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Why we are saying this/i)).toBeInTheDocument();
    expect(screen.getByText(/Reading rule: treat a point as Opportunity only when green clearly dominates red/i)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TemporalForecastPage viewMode="advanced" />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Key Transits/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Interpretation/i)).toBeInTheDocument();
  });
});
