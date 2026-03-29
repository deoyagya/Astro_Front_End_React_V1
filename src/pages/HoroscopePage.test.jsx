import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  apiDownload: vi.fn(),
  saveBirthData: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('../api/client', () => ({
  api: {
    post: (...args) => mocks.apiPost(...args),
    download: (...args) => mocks.apiDownload(...args),
  },
}));

vi.mock('../hooks/useBirthData', () => ({
  useBirthData: () => ({
    fullName: 'Bharti',
    setFullName: vi.fn(),
    birthDate: '1990-01-15',
    setBirthDate: vi.fn(),
    hour: '10',
    setHour: vi.fn(),
    minute: '30',
    setMinute: vi.fn(),
    ampm: 'AM',
    setAmpm: vi.fn(),
    birthPlace: { name: 'Melbourne' },
    setBirthPlace: vi.fn(),
    loaded: true,
    saveBirthData: mocks.saveBirthData,
    validate: () => null,
    buildPayload: () => ({
      name: 'Bharti',
      dob: '1990-01-15',
      tob: '10:30',
      place_of_birth: 'Melbourne',
      lat: -37.8136,
      lon: 144.9631,
      tz_id: 'Australia/Melbourne',
    }),
  }),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/form/DateInput', () => ({
  default: ({ id, value }) => <input id={id} value={value} readOnly />,
}));

vi.mock('../components/form/TimeSelectGroup', () => ({
  default: () => <div>Time Selector</div>,
}));

vi.mock('../components/PlaceAutocomplete', () => ({
  default: ({ id, value }) => <input id={id} value={value} readOnly />,
}));

import HoroscopePage from './HoroscopePage';

describe('HoroscopePage', () => {
  beforeEach(() => {
    mocks.apiPost.mockReset();
    mocks.apiDownload.mockReset();
    mocks.saveBirthData.mockReset();
    mocks.navigate.mockReset();
  });

  it('loads and renders the current daily forecast from the recurring forecast endpoint', async () => {
    mocks.apiPost.mockResolvedValue({
      access_state: 'ready',
      library_item: {
        display_name: 'Daily Prediction Report - 29 Mar 2026',
        download_report_id: 'report-123',
      },
      forecast: {
        display_title: 'Daily Prediction Report',
        period_label: '29 Mar 2026',
        generated_at: '2026-03-29T08:30:00Z',
        sections: [
          {
            section_id: 'daily_forecast_snapshot',
            heading: 'Daily Forecast Snapshot',
            body: 'Today is mixed but manageable.',
            structural: false,
          },
          {
            section_id: 'career_and_work',
            heading: 'Career And Work',
            body: 'Handle the most important work early.',
            structural: false,
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <HoroscopePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith('/v1/reports/forecasts/daily/current', {
        name: 'Bharti',
        dob: '1990-01-15',
        tob: '10:30',
        place_of_birth: 'Melbourne',
        lat: -37.8136,
        lon: 144.9631,
        tz_id: 'Australia/Melbourne',
      });
    });

    expect(await screen.findByText('Daily Forecast Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Today is mixed but manageable.')).toBeInTheDocument();
    expect(screen.getByText('Career And Work')).toBeInTheDocument();
    expect(mocks.saveBirthData).toHaveBeenCalled();
  });

  it('shows the subscription gate when daily forecast access is not included', async () => {
    mocks.apiPost.mockResolvedValue({
      access_state: 'requires_subscription',
      message: 'A subscription plan with Daily Prediction Report access is required to view today’s personalized forecast.',
    });

    render(
      <MemoryRouter>
        <HoroscopePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Daily Prediction Report access/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /View Plans & Pricing/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mocks.navigate).toHaveBeenCalledWith('/pricing');
  });
});
