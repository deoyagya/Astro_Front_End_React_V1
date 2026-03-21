import { render, screen, waitFor } from '@testing-library/react';
import ProductReportLandingPage from './ProductReportLandingPage';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ReportLandingPage', () => ({
  default: ({ config }) => <div>Landing loaded for {config.slug}</div>,
}));

vi.mock('../hooks/useSharedEffects', () => ({
  useSharedEffects: () => {},
}));

describe('ProductReportLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads landing config from the backend product endpoint', async () => {
    api.get.mockResolvedValue({
      slug: 'sade-sati',
      activeNav: 'kundli',
      title: 'Shani Sade Sati Report',
    });

    render(<ProductReportLandingPage slug="sade-sati" defaultActiveNav="kundli" />);

    expect(screen.getByText(/Loading report details/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Landing loaded for sade-sati')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/v1/reports/products/sade-sati/landing');
  });
});
