import { describe, expect, it } from 'vitest';

import {
  buildReportConfigPayload,
  getReportConfigTotalCostCents,
  normalizeReportConfigForEditor,
} from './reportConfigAdmin';

describe('reportConfigAdmin helpers', () => {
  it('normalizes backend report config fields for the wizard editor', () => {
    const normalized = normalizeReportConfigForEditor({
      name: 'Career Premium',
      description: 'Detailed career report',
      include_charts: true,
      divisional_charts: ['D1', 'D10'],
      badge_text: 'Popular',
      report_length: 18,
      sample_report_url: 'https://example.com/sample.pdf',
      questions: [
        {
          question_id: 'q1',
          question_id_display: 'Q-101',
          question_text: 'Will I switch jobs?',
          cost_snapshot: 1499,
          cost_currency: 'USD',
          theme_name: 'Career',
          life_area_name: 'Job',
        },
      ],
      pricing_mode: 'fixed',
      fixed_price: 2499,
      num_iterations: 2,
      discount_mode: 'percentage',
      discount_value: 10,
      discount_valid_until: '2026-04-01T00:00:00Z',
      creator_model: 'gpt-5.4',
      reviewer_model: 'gpt-5.4-mini',
      review_iterations: 2,
      iteration_cost_mode: 'percentage',
      iteration_cost_value: 15,
      creator_prompt: 'Generate',
      reviewer_prompt: 'Review',
    });

    expect(normalized.sampleReportLink).toBe('https://example.com/sample.pdf');
    expect(normalized.discountValidity).toBe('2026-04-01');
    expect(normalized.iterCostMode).toBe('percentage');
    expect(normalized.iterCostValue).toBe('15');
    expect(normalized.fixedPrice).toBe('24.99');
    expect(normalized.showBadge).toBe(true);
    expect(normalized.deliveryHours).toBe(24);
    expect(normalized.selectedQuestions).toHaveLength(1);
  });

  it('reads total cost from the backend total_cost_paisa field', () => {
    expect(getReportConfigTotalCostCents({ total_cost_paisa: 1899 })).toBe(1899);
    expect(getReportConfigTotalCostCents({})).toBe(0);
  });

  it('builds a backend-compatible payload including catalog and delivery controls', () => {
    const payload = buildReportConfigPayload({
      reportName: 'Career Premium',
      description: 'Deep career report',
      includeCharts: true,
      selectedCharts: ['D1', 'D10'],
      showBadge: true,
      addBadge: true,
      badgeText: 'Best Seller',
      reportLength: '24',
      sampleReportLink: 'https://example.com/sample.pdf',
      slug: 'career-premium',
      icon: 'fa-briefcase',
      deliveryHours: '48',
      routeSlug: '/career-premium',
      displayOrder: '3',
      selectedQuestions: [{ id: 'q1' }],
      pricingMode: 'fixed',
      fixedPrice: '49.99',
      numIterations: 2,
      discountMode: 'percentage',
      discountValue: '10',
      discountValidity: '2026-04-10',
      creatorModel: 'gpt-5.4',
      reviewerModel: 'gpt-5.4-mini',
      reviewIterations: 2,
      iterCostMode: 'percentage',
      iterCostValue: '15',
      creatorPrompt: 'Generate',
      reviewerPrompt: 'Review',
    });

    expect(payload.show_badge).toBe(true);
    expect(payload.slug).toBe('career-premium');
    expect(payload.icon).toBe('fa-briefcase');
    expect(payload.delivery_hours).toBe(48);
    expect(payload.route_slug).toBe('/career-premium');
    expect(payload.display_order).toBe(3);
    expect(payload.fixed_price).toBe(4999);
  });
});
