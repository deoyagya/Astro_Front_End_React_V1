import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import AdminRuleBuilderPage from './AdminRuleBuilderPage';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../components/PageShell', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../api/client', () => ({
  api: {
    get: (...args) => apiMocks.get(...args),
    post: (...args) => apiMocks.post(...args),
    put: (...args) => apiMocks.put(...args),
    del: (...args) => apiMocks.del(...args),
  },
}));

vi.mock('../../context/StyleContext', () => ({
  useStyles: () => ({
    getOverride: () => undefined,
  }),
}));

describe('AdminRuleBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.get.mockImplementation((url) => {
      if (url === '/v1/admin/taxonomy/themes') return Promise.resolve([]);
      if (url === '/v1/admin/rules/domains') return Promise.resolve([{ id: 100, name: 'Career' }]);
      if (url === '/v1/admin/rules/domains/100') return Promise.resolve([{ id: 103, name: 'Job Loss' }]);
      if (url === '/v1/admin/rules/103') {
        return Promise.resolve({
          sub_domain_id: 103,
          version: '1.0.0',
          author: 'System',
          primary_tradition: 'PARASHARI',
          rules: [
            {
              rule_id: 'jobloss_dasha_trigger',
              description: 'Dasha trigger',
              weight: 0.12,
              lock: 'dasha',
              condition: {
                type: 'planet_in_house',
                planet: 'saturn',
                house: 10,
              },
            },
          ],
        });
      }
      return Promise.resolve([]);
    });
    apiMocks.post.mockResolvedValue({ status: 'created' });
  });

  it('loads repository subdomains and creates a repository rule from the builder workspace', async () => {
    render(
      <MemoryRouter>
        <AdminRuleBuilderPage />
      </MemoryRouter>,
    );

    await screen.findByText('Career');

    fireEvent.change(screen.getByLabelText('Repository Domain'), {
      target: { value: '100' },
    });

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/rules/domains/100');
    });

    fireEvent.change(screen.getByLabelText('Repository Subdomain'), {
      target: { value: '103' },
    });

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/rules/103');
    });

    fireEvent.change(screen.getByLabelText('Repository Rule ID'), {
      target: { value: 'jobloss_custom' },
    });
    fireEvent.change(screen.getByLabelText('Repository Rule Weight'), {
      target: { value: '0.5' },
    });
    fireEvent.change(screen.getByLabelText('Repository Rule Description'), {
      target: { value: 'Custom repository rule' },
    });

    fireEvent.change(screen.getAllByDisplayValue('Select condition...')[0], {
      target: { value: 'planet_in_house' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create repository rule/i }));

    await waitFor(() => {
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/v1/admin/rules/103',
        expect.objectContaining({
          rule_id: 'jobloss_custom',
          description: 'Custom repository rule',
          weight: 0.5,
          lock: 'natal',
        }),
      );
    });
  });
});
