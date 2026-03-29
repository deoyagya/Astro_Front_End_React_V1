import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyReportsPage from './MyReportsPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiDownload: vi.fn(),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => mocks.apiGet(...args),
    download: (...args) => mocks.apiDownload(...args),
  },
}));

describe('MyReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recurring forecast items and filters by forecast tab', async () => {
    mocks.apiGet.mockResolvedValue({
      counts: {
        all: 3,
        one_time: 1,
        yearly: 0,
        monthly: 1,
        daily: 1,
        processing: 1,
        failed: 0,
      },
      items: [
        {
          id: 'report-1',
          source: 'one_time_purchase',
          report_type: 'career',
          family_label: 'Career & Finance Report',
          display_name: 'Career & Finance Report',
          status: 'ready',
          cadence: 'one_time',
          generated_at: '2026-03-29T03:00:00Z',
          file_size: 2048,
          is_downloadable: true,
          download_report_id: 'report-1',
        },
        {
          id: 'forecast-1',
          source: 'subscription_recurring',
          report_type: 'monthly_prediction_report',
          family_label: 'Monthly Prediction Report',
          display_name: 'Monthly Prediction Report - April 2026',
          status: 'ready',
          cadence: 'monthly',
          period_label: 'April 2026',
          generated_at: '2026-03-29T04:00:00Z',
          file_size: 4096,
          is_downloadable: true,
          download_report_id: 'forecast-download-1',
        },
        {
          id: 'forecast-2',
          source: 'subscription_recurring',
          report_type: 'daily_prediction_report',
          family_label: 'Daily Prediction Report',
          display_name: 'Daily Prediction Report - 29 Mar 2026',
          status: 'processing',
          cadence: 'daily',
          period_label: '29 Mar 2026',
          updated_at: '2026-03-29T05:00:00Z',
          is_downloadable: false,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/my-reports?tab=forecast']}>
        <MyReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Prediction Report - April 2026')).toBeInTheDocument();
    });

    expect(screen.queryByText('Career & Finance Report')).not.toBeInTheDocument();
    expect(screen.getByText('Daily Prediction Report - 29 Mar 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Monthly/i }));

    await waitFor(() => {
      expect(screen.getByText('Monthly Prediction Report - April 2026')).toBeInTheDocument();
    });

    expect(screen.queryByText('Daily Prediction Report - 29 Mar 2026')).not.toBeInTheDocument();
  });
});
