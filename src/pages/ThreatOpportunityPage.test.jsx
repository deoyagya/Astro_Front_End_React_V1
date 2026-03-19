import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ThreatOpportunityPage from './ThreatOpportunityPage';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const birthDataMocks = vi.hoisted(() => ({
  applyBirthData: vi.fn(),
  validate: vi.fn(() => null),
  buildPayload: vi.fn(() => ({
    name: 'Sonam',
    dob: '1990-01-01',
    tob: '10:30',
    place_of_birth: 'Melbourne',
  })),
  saveBirthData: vi.fn(),
  resetBirthData: vi.fn(),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../api/client', () => ({
  api: {
    get: (...args) => apiMocks.get(...args),
    post: (...args) => apiMocks.post(...args),
  },
}));

vi.mock('../hooks/useBirthData', () => ({
  useBirthData: () => ({
    loaded: true,
    applyBirthData: birthDataMocks.applyBirthData,
    validate: birthDataMocks.validate,
    buildPayload: birthDataMocks.buildPayload,
    saveBirthData: birthDataMocks.saveBirthData,
    resetBirthData: birthDataMocks.resetBirthData,
  }),
}));

vi.mock('./mydata/TemporalForecastPage', () => ({
  default: () => <div>Temporal Forecast Body</div>,
}));

describe('ThreatOpportunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.get.mockResolvedValue({
      charts: [
        {
          id: 'chart-1',
          birth_data: {
            name: 'Sonam',
            dob: '1990-01-01',
            place_of_birth: 'Melbourne',
          },
        },
      ],
    });
    apiMocks.post.mockResolvedValue({ bundle: {} });
  });

  it('renders the standalone temporal forecast workspace', async () => {
    render(
      <MemoryRouter>
        <ThreatOpportunityPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Threat and Opportunity/i)).toBeInTheDocument();
    expect(screen.getByText('Temporal Forecast Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Forecast/i })).toBeInTheDocument();
  });

  it('does not load a forecast when no saved chart is selected', async () => {
    render(
      <MemoryRouter>
        <ThreatOpportunityPage />
      </MemoryRouter>,
    );

    const loadButton = await screen.findByRole('button', { name: /Load Forecast/i });
    fireEvent.click(loadButton);

    expect(await screen.findByText(/Please select a saved chart before loading the forecast/i)).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
    expect(birthDataMocks.resetBirthData).toHaveBeenCalled();
  });
});
