import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SiteHeader from './SiteHeader';

const authState = vi.hoisted(() => ({
  value: {
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  },
}));

const featureAccessState = vi.hoisted(() => ({
  value: { allowed: false, loading: false },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState.value,
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

vi.mock('../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => featureAccessState.value,
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    authState.value = {
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    };
    featureAccessState.value = { allowed: false, loading: false };
  });

  it('redirects unauthenticated users to login when opening protected nav items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /Free Tools/i }));

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('does not render protected submenu items for unauthenticated users', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /Birth Chart \(Kundli\)/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Compatibility/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Threat and Opportunity/i })).not.toBeInTheDocument();
  });

  it('allows authenticated users to stay on the page when clicking protected nav items', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'free' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /Free Tools/i }));

    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Free Tools/i })).toBeInTheDocument();
  });

  it('shows the Threat and Opportunity item under Kundli and sends authenticated users to the public landing page', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'free' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/temporal-forecast" element={<div>Temporal Forecast Landing</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /^Kundli$/i }));
    fireEvent.click(screen.getByRole('link', { name: /Threat and Opportunity/i }));

    expect(screen.getByText('Temporal Forecast Landing')).toBeInTheDocument();
  });

  it('opens the Kundli submenu on click for authenticated users', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'premium' },
      logout: vi.fn(),
    };
    featureAccessState.value = { allowed: true, loading: false };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    const kundliTrigger = screen.getByRole('link', { name: /^Kundli$/i });
    expect(kundliTrigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(kundliTrigger);

    expect(kundliTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/Threat and Opportunity/i).length).toBeGreaterThan(0);
  });

  it('navigates authenticated users to the temporal forecast landing page from the Kundli submenu', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'premium' },
      logout: vi.fn(),
    };
    featureAccessState.value = { allowed: true, loading: false };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/temporal-forecast" element={<div>Temporal Forecast Landing</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /^Kundli$/i }));
    fireEvent.click(screen.getAllByRole('link', { name: /Threat and Opportunity/i })[0]);

    expect(screen.getByText('Temporal Forecast Landing')).toBeInTheDocument();
  });

  it('shows the Muhurta Finder item under Kundli and navigates to its public landing page', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'free' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/muhurta-finder" element={<div>Muhurta Landing</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /^Kundli$/i }));
    fireEvent.click(screen.getByRole('link', { name: /Muhurta Finder/i }));

    expect(screen.getByText('Muhurta Landing')).toBeInTheDocument();
  });

  it('shows the Sade Sati Report item under Kundli and navigates to its landing page', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'free' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
          <Route path="/sade-sati-report" element={<div>Sade Sati Report Landing</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: /^Kundli$/i }));
    fireEvent.click(screen.getByRole('link', { name: /Sade Sati Report/i }));

    expect(screen.getByText('Sade Sati Report Landing')).toBeInTheDocument();
  });

  it('does not show the credit wallet gauge for authenticated end users in the plan-first shell', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'ria@example.com', role: 'premium' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SiteHeader active="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: /Credit balance 27/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Credits')).not.toBeInTheDocument();
  });

  it('does not show the credit wallet gauge for admins', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'admin@example.com', role: 'admin' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/admin/observability']}>
        <Routes>
          <Route path="/admin/observability" element={<SiteHeader active="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Credits')).not.toBeInTheDocument();
  });

  it('surfaces admin users and orders inside the Manage Data menu', () => {
    authState.value = {
      isAuthenticated: true,
      user: { email: 'admin@example.com', role: 'admin' },
      logout: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/admin/observability']}>
        <Routes>
          <Route path="/admin/observability" element={<SiteHeader active="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Manage Data/i }));

    expect(screen.getByRole('link', { name: /Legal Policies/i })).toHaveAttribute('href', '/admin/legal-policies');
    expect(screen.getByRole('link', { name: /AI Settings/i })).toHaveAttribute('href', '/admin/ai-settings');
    expect(screen.getByRole('link', { name: /AI Audit Log/i })).toHaveAttribute('href', '/admin/ai-settings/audit-log');
    expect(screen.getByRole('link', { name: /Users/i })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: /Orders/i })).toHaveAttribute('href', '/admin/orders');
    expect(screen.queryByRole('link', { name: /^Users$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Orders$/i })).toBeInTheDocument();
  });
});
