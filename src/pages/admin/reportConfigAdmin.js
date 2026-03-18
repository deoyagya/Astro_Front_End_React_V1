export function normalizeReportConfigForEditor(config) {
  return {
    reportName: config.name || '',
    description: config.description || '',
    includeCharts: Boolean(config.include_charts),
    selectedCharts: config.divisional_charts || [],
    addBadge: Boolean(config.badge_text),
    badgeText: config.badge_text || '',
    reportLength: config.report_length ?? '',
    sampleReportLink: config.sample_report_url || '',
    selectedQuestions: (config.questions || []).map((q, idx) => ({
      id: q.question_id || q.id,
      question_id_display: q.question_id_display || q.question_id || '',
      question_text: q.question_text || '',
      cost_amount: q.cost_amount ?? q.cost_snapshot ?? 0,
      cost_currency: q.cost_currency || 'USD',
      theme_name: q.theme_name || '',
      life_area_name: q.life_area_name || '',
      display_order: q.display_order ?? idx,
    })),
    pricingMode: config.pricing_mode || 'fixed',
    fixedPrice:
      config.fixed_price != null ? (config.fixed_price / 100).toString() : '',
    numIterations: config.num_iterations ?? 1,
    discountMode: config.discount_mode || 'none',
    discountValue:
      config.discount_value != null ? config.discount_value.toString() : '',
    discountValidity: config.discount_valid_until
      ? String(config.discount_valid_until).substring(0, 10)
      : '',
    creatorModel: config.creator_model || '',
    reviewerModel: config.reviewer_model || '',
    reviewIterations: config.review_iterations ?? 1,
    iterCostMode: config.iteration_cost_mode || 'fixed',
    iterCostValue:
      config.iteration_cost_value != null
        ? config.iteration_cost_value.toString()
        : '',
    creatorPrompt: config.creator_prompt || '',
    reviewerPrompt: config.reviewer_prompt || '',
  };
}

export function getReportConfigTotalCostCents(config) {
  return config.total_cost_paisa ?? 0;
}
