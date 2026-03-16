import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  value: {
    isAuthenticated: false,
    loading: false,
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState.value,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.value = {
      isAuthenticated: false,
      loading: false,
    };
  });

  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            path="/secure"
            element={(
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    authState.value = {
      isAuthenticated: true,
      loading: false,
    };

    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            path="/secure"
            element={(
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
  });
});
