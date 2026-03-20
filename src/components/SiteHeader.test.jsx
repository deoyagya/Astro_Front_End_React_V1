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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState.value,
}));

vi.mock('../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    authState.value = {
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    };
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

    expect(screen.getByRole('link', { name: /Users/i })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: /Orders/i })).toHaveAttribute('href', '/admin/orders');
    expect(screen.queryByRole('link', { name: /^Users$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Orders$/i })).toBeInTheDocument();
  });
});
