import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SurveyBuilder from './SurveyBuilder';

describe('SurveyBuilder', () => {
  it('auto-generates the slug from the title until the slug is manually edited', async () => {
    render(
      <SurveyBuilder
        apiCreate={vi.fn().mockResolvedValue({ id: 'form-1', slug: 'customer-feedback' })}
        apiUpdate={vi.fn()}
        apiGet={vi.fn()}
        apiPublish={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Survey Title'), {
      target: { value: 'Customer Feedback' },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Survey Slug').value).toBe('customer-feedback');
    });

    fireEvent.change(screen.getByLabelText('Survey Slug'), {
      target: { value: 'custom-link' },
    });
    fireEvent.change(screen.getByLabelText('Survey Title'), {
      target: { value: 'Customer Feedback Updated' },
    });

    expect(screen.getByLabelText('Survey Slug').value).toBe('custom-link');
  });

  it('saves experience settings and intro/outro content in the payload', async () => {
    const apiCreate = vi.fn().mockResolvedValue({ id: 'form-1', slug: 'feedback-survey' });

    render(
      <SurveyBuilder
        apiCreate={apiCreate}
        apiUpdate={vi.fn()}
        apiGet={vi.fn()}
        apiPublish={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Survey Title'), {
      target: { value: 'Feedback Survey' },
    });
    fireEvent.change(screen.getByLabelText('Survey Description'), {
      target: { value: 'Capture customer reactions' },
    });
    fireEvent.change(screen.getByLabelText('Submit Button Text'), {
      target: { value: 'Send Feedback' },
    });
    fireEvent.change(screen.getByLabelText('Thank You Message'), {
      target: { value: 'Thanks for sharing your thoughts.' },
    });
    fireEvent.click(screen.getByLabelText('Show Progress Indicator'));
    fireEvent.change(screen.getByLabelText('Header HTML'), {
      target: { value: '<p>Welcome to our premium survey</p>' },
    });
    fireEvent.change(screen.getByLabelText('Footer HTML'), {
      target: { value: '<p>We appreciate your time</p>' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(apiCreate).toHaveBeenCalledTimes(1);
    });

    expect(apiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Feedback Survey',
        slug: 'feedback-survey',
        description: 'Capture customer reactions',
        header_html: '<p>Welcome to our premium survey</p>',
        footer_html: '<p>We appreciate your time</p>',
        settings: expect.objectContaining({
          submit_text: 'Send Feedback',
          thank_you_message: 'Thanks for sharing your thoughts.',
          show_progress: true,
        }),
      }),
    );
  });
});
