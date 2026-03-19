import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReportLandingPage from './ReportLandingPage';

const authState = vi.hoisted(() => ({
  value: {
    isAuthenticated: false,
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState.value,
}));

vi.mock('./ChartSelectionModal', () => ({
  default: ({ isOpen, reportSlug }) => (isOpen ? <div>Chart modal open for {reportSlug}</div> : null),
}));

const baseConfig = {
  slug: 'career',
  icon: 'fa-briefcase',
  iconColor: '#f3b554',
  title: 'Career Report',
  tagline: 'Career clarity',
  metaDescription: 'Career report',
  priceCents: 1999,
  originalPriceCents: 2499,
  pages: 24,
  deliveryHours: 24,
  heroImage: '',
  insideItems: [],
  sampleSnapshot: null,
  features: [],
  planetsCovered: [],
  housesCovered: [],
  testimonials: [],
  faqs: [],
  whyChoose: [],
};

describe('ReportLandingPage', () => {
  beforeEach(() => {
    authState.value = { isAuthenticated: false };
  });

  it('redirects unauthenticated users back to the same report page after login', () => {
    render(
      <MemoryRouter initialEntries={['/career-report']}>
        <Routes>
          <Route path="/career-report" element={<ReportLandingPage config={baseConfig} />} />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Order Your Report/i }));

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('opens the reusable chart-selection modal for authenticated users', () => {
    authState.value = { isAuthenticated: true };

    render(
      <MemoryRouter initialEntries={['/career-report']}>
        <Routes>
          <Route path="/career-report" element={<ReportLandingPage config={baseConfig} />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Order Your Report/i }));

    expect(screen.getByText('Chart modal open for career')).toBeInTheDocument();
  });
});
