import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/form/DateInput', () => ({
  default: () => null,
}));

vi.mock('../components/form/TimeSelectGroup', () => ({
  default: () => null,
}));

vi.mock('../components/PlaceAutocomplete', () => ({
  default: () => null,
}));

vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('../hooks/useBirthData', () => ({
  useBirthData: () => ({
    fullName: '',
    setFullName: vi.fn(),
    birthDate: '',
    setBirthDate: vi.fn(),
    hour: '',
    setHour: vi.fn(),
    minute: '',
    setMinute: vi.fn(),
    ampm: '',
    setAmpm: vi.fn(),
    birthPlace: null,
    setBirthPlace: vi.fn(),
    saveBirthData: vi.fn(),
    validate: () => '',
    buildPayload: () => ({}),
  }),
  to24Hour: vi.fn(),
}));

import { DashaDrillDown } from './DashaPage';

function makeFiveLevelTree() {
  return [
    {
      planet: 'Saturn',
      start: '2020-01-01T00:00:00Z',
      end: '2039-12-31T00:00:00Z',
      is_current: true,
      sub_periods: [
        {
          planet: 'Venus',
          start: '2026-01-01T00:00:00Z',
          end: '2029-01-01T00:00:00Z',
          is_current: true,
          sub_periods: [
            {
              planet: 'Mercury',
              start: '2026-09-01T00:00:00Z',
              end: '2027-03-01T00:00:00Z',
              is_current: true,
              sub_periods: [
                {
                  planet: 'Moon',
                  start: '2026-12-01T00:00:00Z',
                  end: '2027-01-15T00:00:00Z',
                  is_current: true,
                  sub_periods: [
                    {
                      planet: 'Mars',
                      start: '2026-12-20T00:00:00Z',
                      end: '2026-12-30T00:00:00Z',
                      is_current: true,
                      sub_periods: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      planet: 'Mercury',
      start: '2039-12-31T00:00:00Z',
      end: '2056-12-31T00:00:00Z',
      is_current: false,
      sub_periods: [],
    },
  ];
}

describe('DashaDrillDown', () => {
  it('shows the active dasha path at 5 levels and jumps to deeper timelines from the active path cards', () => {
    render(<DashaDrillDown dashaTree={makeFiveLevelTree()} />);

    expect(screen.getByTestId('dasha-current-path')).toBeInTheDocument();
    expect(screen.getByText('Currently Running Dasha Chain')).toBeInTheDocument();
    expect(screen.getByText(/Showing the active flow across 5 levels/i)).toBeInTheDocument();
    expect(screen.getByTestId('dasha-path-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('dasha-path-item-4')).toBeInTheDocument();
    expect(screen.queryByText('Active Level')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dasha-path-item-1'));

    expect(screen.getByText('Pratyantardasha Periods')).toBeInTheDocument();
    expect(screen.getByText(/Back to Antardasha view/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saturn Mahadasha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Venus Antardasha/i })).toBeInTheDocument();
  });
});
