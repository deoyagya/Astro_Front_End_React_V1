import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BirthChartPage from './BirthChartPage';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  saveBirthData: vi.fn(),
  validate: vi.fn(() => ''),
  buildPayload: vi.fn(() => ({
    name: 'Bharti',
    dob: '1979-04-17',
    tob: '16:32',
    place_of_birth: 'Khurja',
  })),
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/form/DateInput', () => ({
  default: ({ id, value, onChange }) => (
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('../components/form/TimeSelectGroup', () => ({
  default: () => <div>Time Select</div>,
}));

vi.mock('../components/PlaceAutocomplete', () => ({
  default: ({ id, value, onSelect }) => (
    <input id={id} value={value} onChange={(e) => onSelect({ name: e.target.value })} />
  ),
}));

vi.mock('../components/chart', () => ({
  __esModule: true,
  default: () => <div>Chart</div>,
  CHART_OPTIONS: [
    { value: 'D1', label: 'Rashi (D-1)', description: 'Base chart' },
    { value: 'D9', label: 'Navamsa (D-9)', description: 'Divisional chart' },
  ],
  enrichD1: (chart) => chart,
}));

vi.mock('../api/client', () => ({
  api: {
    post: (...args) => mocks.apiPost(...args),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { full_name: 'Yagya' },
    isAuthenticated: true,
  }),
}));

vi.mock('../hooks/useBirthData', () => ({
  useBirthData: () => ({
    fullName: 'Bharti',
    setFullName: vi.fn(),
    birthDate: '17/04/1979',
    setBirthDate: vi.fn(),
    hour: '4',
    setHour: vi.fn(),
    minute: '32',
    setMinute: vi.fn(),
    ampm: 'PM',
    setAmpm: vi.fn(),
    birthPlace: { name: 'Khurja' },
    setBirthPlace: vi.fn(),
    saveBirthData: (...args) => mocks.saveBirthData(...args),
    validate: (...args) => mocks.validate(...args),
    buildPayload: (...args) => mocks.buildPayload(...args),
  }),
  to24Hour: vi.fn(() => '16:32'),
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

describe('BirthChartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiPost.mockResolvedValue({ bundle: { charts: { D1: { placements: {} } } } });
  });

  it('does not request divisional entitlements when D1 is selected', async () => {
    render(
      <MemoryRouter>
        <BirthChartPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate Chart/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/v1/chart/create?include_vargas=false&include_dasha=false&include_ashtakavarga=false',
        expect.any(Object),
      );
    });
  });

  it('requests divisional data when a divisional chart is selected', async () => {
    render(
      <MemoryRouter>
        <BirthChartPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Select Chart Type/i), { target: { value: 'd9' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate Chart/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/v1/chart/create?include_vargas=true&include_dasha=false&include_ashtakavarga=false',
        expect.any(Object),
      );
    });
  });
});
