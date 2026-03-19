import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import AdminWizardContentPage from './AdminWizardContentPage';

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
    getStyle: () => ({}),
    getOverride: () => undefined,
  }),
}));

describe('AdminWizardContentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.get.mockImplementation((url) => {
      if (url.startsWith('/v1/admin/wizard-content?')) {
        return Promise.resolve([
          {
            id: 'row-1',
            consultation_category: 'A',
            step_number: 2,
            field_key: 'birth_place',
            label: 'Birth Place',
            is_active: true,
          },
        ]);
      }
      if (url === '/v1/admin/taxonomy/themes?include_inactive=true') {
        return Promise.resolve([{ id: 'theme-1', name: 'Career' }]);
      }
      if (url === '/v1/admin/taxonomy/themes/theme-1/life-areas?include_inactive=true') {
        return Promise.resolve([{ id: 'life-1', name: 'Job Loss' }]);
      }
      if (url === '/v1/admin/wizard-content/preview/A/2?theme_id=theme-1&life_area_id=life-1') {
        return Promise.resolve({
          step_label: 'Career Question Setup',
          step_help: 'Guide the user toward the right job-loss question.',
          fields: {
            birth_place: {
              label: 'City of Birth',
              help_text: 'Use the dropdown to keep geocoding accurate.',
            },
          },
        });
      }
      return Promise.resolve([]);
    });
  });

  it('loads a resolved preview for the selected category, step, theme, and life area', async () => {
    render(<AdminWizardContentPage />);

    expect(await screen.findByText(/Wizard Step Content/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Preview Step Number'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Preview Theme'), {
      target: { value: 'theme-1' },
    });

    await waitFor(() => {
      expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/taxonomy/themes/theme-1/life-areas?include_inactive=true');
    });

    fireEvent.change(screen.getByLabelText('Preview Life Area'), {
      target: { value: 'life-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /load preview/i }));

    await screen.findByText('Career Question Setup');
    expect(screen.getByText(/Guide the user toward the right job-loss question/i)).toBeInTheDocument();
    expect(screen.getByText(/City of Birth/i)).toBeInTheDocument();
    expect(screen.getByText(/Use the dropdown to keep geocoding accurate/i)).toBeInTheDocument();
    expect(apiMocks.get).toHaveBeenCalledWith('/v1/admin/wizard-content/preview/A/2?theme_id=theme-1&life_area_id=life-1');
  });
});
