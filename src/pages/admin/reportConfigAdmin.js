export function normalizeReportConfigForEditor(config) {
  return {
    reportName: config.name || '',
    description: config.description || '',
    includeCharts: Boolean(config.include_charts),
    selectedCharts: config.divisional_charts || [],
    showBadge: config.show_badge !== false,
    addBadge: Boolean(config.badge_text),
    badgeText: config.badge_text || '',
    reportLength: config.report_length ?? '',
    sampleReportLink: config.sample_report_url || '',
    slug: config.slug || '',
    icon: config.icon || '',
    deliveryHours: config.delivery_hours ?? 24,
    routeSlug: config.route_slug || '',
    displayOrder: config.display_order ?? 0,
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

export function buildReportConfigPayload(editor) {
  return {
    name: editor.reportName.trim(),
    description: editor.description.trim() || null,
    include_charts: editor.includeCharts,
    divisional_charts: editor.includeCharts ? editor.selectedCharts : [],
    show_badge: editor.showBadge,
    badge_text: editor.addBadge ? editor.badgeText.trim() || null : null,
    report_length: editor.reportLength ? parseInt(editor.reportLength, 10) : null,
    sample_report_url: editor.sampleReportLink.trim() || null,
    slug: editor.slug.trim() || null,
    icon: editor.icon.trim() || null,
    delivery_hours: editor.deliveryHours ? parseInt(editor.deliveryHours, 10) : 24,
    route_slug: editor.routeSlug.trim() || null,
    display_order: editor.displayOrder ? parseInt(editor.displayOrder, 10) : 0,
    question_ids: editor.selectedQuestions.map((q) => q.id),
    pricing_mode: editor.pricingMode,
    fixed_price:
      editor.pricingMode === 'fixed'
        ? Math.round(parseFloat(editor.fixedPrice) * 100)
        : null,
    num_iterations: editor.numIterations,
    discount_mode: editor.discountMode === 'none' ? null : editor.discountMode,
    discount_value:
      editor.discountMode !== 'none' ? parseFloat(editor.discountValue) : null,
    discount_valid_until: editor.discountValidity || null,
    creator_model: editor.creatorModel || 'gemini-2.5-flash',
    reviewer_model: editor.reviewerModel || 'claude-opus',
    review_iterations: editor.reviewIterations,
    iteration_cost_mode: editor.iterCostMode,
    iteration_cost_value: editor.iterCostValue ? parseFloat(editor.iterCostValue) : null,
    creator_prompt: editor.creatorPrompt.trim() || null,
    reviewer_prompt: editor.reviewerPrompt.trim() || null,
  };
}
