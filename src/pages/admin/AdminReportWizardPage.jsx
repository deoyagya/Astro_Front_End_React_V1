import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

const DIVISIONAL_CHARTS = [
  { value: 'D1',  label: 'D1 — Rashi (Birth Chart)' },
  { value: 'D2',  label: 'D2 — Hora (Wealth)' },
  { value: 'D3',  label: 'D3 — Drekkana (Siblings)' },
  { value: 'D4',  label: 'D4 — Chaturthamsha (Property)' },
  { value: 'D7',  label: 'D7 — Saptamsha (Children)' },
  { value: 'D9',  label: 'D9 — Navamsha (Marriage)' },
  { value: 'D10', label: 'D10 — Dashamsha (Career)' },
  { value: 'D12', label: 'D12 — Dwadashamsha (Parents)' },
  { value: 'D16', label: 'D16 — Shodashamsha (Vehicles)' },
  { value: 'D20', label: 'D20 — Vimshamsha (Spirituality)' },
  { value: 'D24', label: 'D24 — Chaturvimshamsha (Education)' },
  { value: 'D27', label: 'D27 — Saptavimshamsha (Strength)' },
  { value: 'D30', label: 'D30 — Trimshamsha (Misfortune)' },
  { value: 'D40', label: 'D40 — Khavedamsha (Auspiciousness)' },
  { value: 'D45', label: 'D45 — Akshavedamsha (Character)' },
  { value: 'D60', label: 'D60 — Shashtiamsha (Past Karma)' },
];

export default function AdminReportWizardPage() {
  const { getStyle, getOverride } = useStyles('admin-report-wizard');
  const { configId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(configId);

  // ── Wizard step ──
  const [step, setStep] = useState(1);

  // ── Screen 1: Content Setup ──
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [addBadge, setAddBadge] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const [reportLength, setReportLength] = useState('');
  const [sampleReportLink, setSampleReportLink] = useState('');

  // ── Screen 2: Pricing ──
  const [pricingMode, setPricingMode] = useState('fixed');
  const [fixedPrice, setFixedPrice] = useState('');
  const [numIterations, setNumIterations] = useState(1);
  const [discountMode, setDiscountMode] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [discountValidity, setDiscountValidity] = useState('');

  // ── Screen 3: LLM Config ──
  const [availableModels, setAvailableModels] = useState({ providers: [], models: {} });
  const [promptDefaults, setPromptDefaults] = useState({ generator_prompt: '', reviewer_prompt: '' });
  const [creatorModel, setCreatorModel] = useState('');
  const [reviewerModel, setReviewerModel] = useState('');
  const [reviewIterations, setReviewIterations] = useState(1);
  const [iterCostMode, setIterCostMode] = useState('fixed');
  const [iterCostValue, setIterCostValue] = useState('');
  const [creatorPrompt, setCreatorPrompt] = useState('');
  const [reviewerPrompt, setReviewerPrompt] = useState('');

  // ── UI State ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [stepErrors, setStepErrors] = useState({});

  // ── Toast auto-clear ──
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Load themes on mount ──
  const loadThemes = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/taxonomy/themes');
      setThemes(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // ── Load available models and prompt defaults ──
  const loadLLMConfig = useCallback(async () => {
    try {
      const [modelsData, defaultsData] = await Promise.all([
        api.get('/v1/admin/report-configs/available-models'),
        api.get('/v1/admin/report-configs/prompt-defaults'),
      ]);
      setAvailableModels(modelsData);
      setPromptDefaults(defaultsData);
      // Pre-fill prompts only if not already set (create mode)
      if (!creatorPrompt) setCreatorPrompt(defaultsData.generator_prompt || '');
      if (!reviewerPrompt) setReviewerPrompt(defaultsData.reviewer_prompt || '');
    } catch (err) {
      // Non-blocking: LLM config is optional until step 3
      console.warn('Failed to load LLM config:', err.message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load existing config for edit mode ──
  const loadExistingConfig = useCallback(async () => {
    if (!configId) return;
    try {
      setLoading(true);
      const config = await api.get(`/v1/admin/report-configs/${configId}`);

      // Screen 1
      setReportName(config.name || '');
      setDescription(config.description || '');
      setIncludeCharts(Boolean(config.include_charts));
      setSelectedCharts(config.divisional_charts || []);
      setAddBadge(Boolean(config.badge_text));
      setBadgeText(config.badge_text || '');
      setReportLength(config.report_length ?? '');
      setSampleReportLink(config.sample_report_link || '');

      // Map questions from config
      if (config.questions && config.questions.length > 0) {
        setSelectedQuestions(config.questions.map((q, idx) => ({
          id: q.question_id || q.id,
          question_id_display: q.question_id_display || q.question_id || '',
          question_text: q.question_text || '',
          cost_amount: q.cost_amount ?? q.cost_snapshot ?? 0,
          cost_currency: q.cost_currency || 'USD',
          theme_name: q.theme_name || '',
          life_area_name: q.life_area_name || '',
          display_order: q.display_order ?? idx,
        })));
      }

      // Screen 2
      setPricingMode(config.pricing_mode || 'fixed');
      setFixedPrice(config.fixed_price != null ? (config.fixed_price / 100).toString() : '');
      setNumIterations(config.num_iterations ?? 1);
      setDiscountMode(config.discount_mode || 'none');
      setDiscountValue(config.discount_value != null ? config.discount_value.toString() : '');
      setDiscountValidity(config.discount_validity || '');

      // Screen 3
      setCreatorModel(config.creator_model || '');
      setReviewerModel(config.reviewer_model || '');
      setReviewIterations(config.review_iterations ?? 1);
      setIterCostMode(config.iter_cost_mode || 'fixed');
      setIterCostValue(config.iter_cost_value != null ? config.iter_cost_value.toString() : '');
      setCreatorPrompt(config.creator_prompt || '');
      setReviewerPrompt(config.reviewer_prompt || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    loadThemes();
    loadLLMConfig();
    if (isEditMode) loadExistingConfig();
  }, [loadThemes, loadLLMConfig, loadExistingConfig, isEditMode]);

  // ── Cascading: theme -> life areas (only show areas with questions) ──
  const loadLifeAreas = useCallback(async (themeId) => {
    if (!themeId) { setLifeAreas([]); setQuestions([]); return; }
    try {
      const data = await api.get(`/v1/admin/taxonomy/themes/${themeId}/life-areas`);
      // Filter to only show life areas that have questions associated
      const areasWithQuestions = (data || []).filter((a) => (a.question_count || 0) > 0);
      setLifeAreas(areasWithQuestions);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // ── Cascading: life area -> questions ──
  const loadQuestions = useCallback(async (themeId, areaId) => {
    if (!themeId || !areaId) { setQuestions([]); return; }
    try {
      const data = await api.get(`/v1/admin/taxonomy/questions?theme_id=${themeId}&life_area_id=${areaId}`);
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    setSelectedArea('');
    setQuestions([]);
    loadLifeAreas(themeId);
  };

  const handleAreaChange = (areaId) => {
    setSelectedArea(areaId);
    if (selectedTheme && areaId) {
      loadQuestions(selectedTheme, areaId);
    } else {
      setQuestions([]);
    }
  };

  // ── Add / Remove questions ──
  const addQuestion = (q) => {
    if (selectedQuestions.some((sq) => sq.id === q.id)) return;
    const themeName = themes.find((t) => t.id === selectedTheme)?.name || '';
    const areaName = lifeAreas.find((a) => a.id === selectedArea)?.name || '';
    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: q.id,
        question_id_display: q.question_id_display || '',
        question_text: q.question_text || '',
        cost_amount: q.cost_amount ?? 0,
        cost_currency: q.cost_currency || 'USD',
        theme_name: themeName,
        life_area_name: areaName,
      },
    ]);
  };

  const removeQuestion = (questionId) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const isQuestionSelected = (questionId) => {
    return selectedQuestions.some((sq) => sq.id === questionId);
  };

  // ── Chart selection ──
  const toggleChart = (chartValue) => {
    setSelectedCharts((prev) =>
      prev.includes(chartValue)
        ? prev.filter((c) => c !== chartValue)
        : [...prev, chartValue]
    );
  };

  // ── Cost calculation ──
  const questionCostCents = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.cost_amount || 0), 0);
  }, [selectedQuestions]);

  const baseCostCents = useMemo(() => {
    if (pricingMode === 'fixed') {
      const val = parseFloat(fixedPrice);
      return isNaN(val) ? 0 : Math.round(val * 100);
    }
    return questionCostCents;
  }, [pricingMode, fixedPrice, questionCostCents]);

  const iterationCostCents = useMemo(() => {
    const val = parseFloat(iterCostValue);
    if (isNaN(val) || val <= 0 || numIterations <= 0) return 0;
    if (iterCostMode === 'fixed') {
      return numIterations * Math.round(val * 100);
    }
    // percentage
    return numIterations * Math.round(baseCostCents * val / 100);
  }, [numIterations, iterCostMode, iterCostValue, baseCostCents]);

  const discountCents = useMemo(() => {
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0 || discountMode === 'none') return 0;
    if (discountMode === 'fixed') {
      return Math.round(val * 100);
    }
    // percentage
    return Math.round((baseCostCents + iterationCostCents) * val / 100);
  }, [discountMode, discountValue, baseCostCents, iterationCostCents]);

  const totalCostCents = useMemo(() => {
    return Math.max(0, baseCostCents + iterationCostCents - discountCents);
  }, [baseCostCents, iterationCostCents, discountCents]);

  const formatDollars = (cents) => {
    return (cents / 100).toFixed(2);
  };

  // ── Validation ──
  const validateStep1 = () => {
    const errors = {};
    if (!reportName.trim()) errors.reportName = 'Report name is required.';
    if (selectedQuestions.length === 0) errors.questions = 'At least one question must be selected.';
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (pricingMode === 'fixed' && (!fixedPrice || parseFloat(fixedPrice) < 0)) {
      errors.fixedPrice = 'A valid price is required for fixed pricing.';
    }
    if (numIterations < 1 || numIterations > 10) {
      errors.numIterations = 'Iterations must be between 1 and 10.';
    }
    if (discountMode === 'percentage') {
      const val = parseFloat(discountValue);
      if (isNaN(val) || val < 0 || val > 100) {
        errors.discountValue = 'Percentage must be between 0 and 100.';
      }
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Navigation ──
  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStepErrors({});
    setError('');
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setStepErrors({});
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        // Screen 1
        name: reportName.trim(),
        description: description.trim() || null,
        include_charts: includeCharts,
        divisional_charts: includeCharts ? selectedCharts : [],
        badge_text: addBadge ? badgeText.trim() || null : null,
        report_length: reportLength ? parseInt(reportLength, 10) : null,
        sample_report_url: sampleReportLink.trim() || null,
        question_ids: selectedQuestions.map((q) => q.id),

        // Screen 2
        pricing_mode: pricingMode,
        fixed_price: pricingMode === 'fixed' ? Math.round(parseFloat(fixedPrice) * 100) : null,
        num_iterations: numIterations,
        discount_mode: discountMode === 'none' ? null : discountMode,
        discount_value: discountMode !== 'none' ? parseFloat(discountValue) : null,
        discount_valid_until: discountValidity || null,

        // Screen 3
        creator_model: creatorModel || 'gemini-2.5-flash',
        reviewer_model: reviewerModel || 'claude-opus',
        review_iterations: reviewIterations,
        iteration_cost_mode: iterCostMode,
        iteration_cost_value: iterCostValue ? parseFloat(iterCostValue) : null,
        creator_prompt: creatorPrompt.trim() || null,
        reviewer_prompt: reviewerPrompt.trim() || null,
      };

      if (isEditMode) {
        await api.put(`/v1/admin/report-configs/${configId}`, payload);
        setToast({ type: 'success', msg: 'Report config updated!' });
      } else {
        await api.post('/v1/admin/report-configs', payload);
        setToast({ type: 'success', msg: 'Report config created!' });
      }

      setTimeout(() => navigate('/admin/reports'), 600);
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Running subtotal for selected questions ──
  const questionSubtotal = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.cost_amount || 0), 0);
  }, [selectedQuestions]);

  // ── Stepper ──
  const steps = [
    { num: 1, label: 'Content' },
    { num: 2, label: 'Pricing' },
    { num: 3, label: 'LLM Config' },
  ];

  const renderStepper = () => (
    <div className="wizard-stepper">
      {steps.map((s, idx) => (
        <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`wizard-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
            <div className="wizard-step-circle">
              {step > s.num ? <i className="fas fa-check"></i> : s.num}
            </div>
            <span className="wizard-step-label">{s.label}</span>
          </div>
          {idx < steps.length - 1 && <div className="wizard-connector" />}
        </div>
      ))}
    </div>
  );

  // ── Screen 1: Content Setup ──
  const renderStep1 = () => (
    <div className="wizard-split-screen">
      {/* Left panel */}
      <div className="wizard-left-panel">
        <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: "'Cinzel', serif" }}>
          <i className="fas fa-file-alt" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Report Setup
        </h3>

        {/* Report Name */}
        <div className="form-group">
          <label>Report Name *</label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="e.g., Career Deep-Dive Report"
          />
          {stepErrors.reportName && (
            <div style={{ color: '#ff4757', fontSize: '0.9375rem', marginTop: 4 }}>{stepErrors.reportName}</div>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this report..."
            style={{ minHeight: 70 }}
          />
        </div>

        {/* Theme -> Life Area -> Questions cascade */}
        <div className="form-group">
          <label>Select Theme</label>
          <select className="filter-select" value={selectedTheme} onChange={(e) => handleThemeChange(e.target.value)}>
            <option value="">Choose a theme...</option>
            {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Select Life Area</label>
          <select
            className="filter-select"
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            disabled={!selectedTheme}
          >
            <option value="">Choose a life area...</option>
            {lifeAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Questions list */}
        {questions.length > 0 && (
          <div className="form-group">
            <label>Available Questions</label>
            <div className="wizard-question-list">
              {questions.map((q) => {
                const alreadyAdded = isQuestionSelected(q.id);
                return (
                  <div key={q.id} className={`wizard-question-row ${alreadyAdded ? 'added' : ''}`}>
                    <div className="wizard-question-info">
                      <span className="wizard-qid">{q.question_id_display}</span>
                      <span className="wizard-qtext">{q.question_text}</span>
                      {q.cost_amount > 0 && (
                        <span className="wizard-qcost">
                          {q.cost_currency === 'USD' ? '$' : q.cost_currency}{' '}
                          {(q.cost_amount / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      className={alreadyAdded ? 'btn-added' : 'btn-add-question'}
                      onClick={() => !alreadyAdded && addQuestion(q)}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? (
                        <><i className="fas fa-check"></i> Added</>
                      ) : (
                        <><i className="fas fa-plus"></i> Add</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stepErrors.questions && (
          <div style={{ color: '#ff4757', fontSize: '0.9375rem', marginTop: 4, marginBottom: 12 }}>
            {stepErrors.questions}
          </div>
        )}

        {/* Include Charts */}
        <div className="form-group">
          <label>Include Charts</label>
          <div className="chart-style-toggle">
            <button className={!includeCharts ? 'active' : ''} onClick={() => { setIncludeCharts(false); setSelectedCharts([]); }}>
              No
            </button>
            <button className={includeCharts ? 'active' : ''} onClick={() => setIncludeCharts(true)}>
              Yes
            </button>
          </div>
          {includeCharts && (
            <div className="chart-picker-grid">
              {DIVISIONAL_CHARTS.map((ch) => (
                <label
                  key={ch.value}
                  className={`chart-chip ${selectedCharts.includes(ch.value) ? 'selected' : ''}`}
                  onClick={() => toggleChart(ch.value)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharts.includes(ch.value)}
                    onChange={() => toggleChart(ch.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="chip-label">{ch.value}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Add Badge */}
        <div className="form-group">
          <label>Add Badge</label>
          <div className="chart-style-toggle">
            <button className={!addBadge ? 'active' : ''} onClick={() => { setAddBadge(false); setBadgeText(''); }}>
              No
            </button>
            <button className={addBadge ? 'active' : ''} onClick={() => setAddBadge(true)}>
              Yes
            </button>
          </div>
          {addBadge && (
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g., Premium, New, Best Seller"
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        {/* Report Length */}
        <div className="form-group">
          <label>Report Length (pages)</label>
          <input
            type="number"
            min="1"
            value={reportLength}
            onChange={(e) => setReportLength(e.target.value)}
            placeholder="e.g., 25"
          />
        </div>

        {/* Sample Report Link */}
        <div className="form-group">
          <label>Sample Report Link</label>
          <input
            type="url"
            value={sampleReportLink}
            onChange={(e) => setSampleReportLink(e.target.value)}
            placeholder="https://example.com/sample-report.pdf"
          />
        </div>
      </div>

      {/* Right panel — selected questions */}
      <div className="wizard-right-panel">
        <h3 style={{ color: '#fff', marginBottom: 16, fontFamily: "'Cinzel', serif" }}>
          <i className="fas fa-list-check" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Selected Questions ({selectedQuestions.length})
        </h3>

        {selectedQuestions.length === 0 ? (
          <div className="wizard-empty-selection">
            <i className="fas fa-inbox" style={{ fontSize: '2rem', color: '#555', marginBottom: 10, display: 'block' }}></i>
            <p style={{ color: '#a0a8b8' }}>No questions added yet. Use the left panel to browse and add questions.</p>
          </div>
        ) : (
          <div className="wizard-selected-list">
            {selectedQuestions.map((q, idx) => (
              <div key={q.id} className="wizard-selected-item">
                <div className="wizard-selected-num">{idx + 1}</div>
                <div className="wizard-selected-body">
                  <div className="wizard-selected-qid">{q.question_id_display}</div>
                  <div className="wizard-selected-qtext">{q.question_text}</div>
                  <div className="wizard-selected-meta">
                    {q.theme_name && <span className="wizard-meta-tag">{q.theme_name}</span>}
                    {q.life_area_name && <span className="wizard-meta-tag">{q.life_area_name}</span>}
                    {q.cost_amount > 0 && (
                      <span className="wizard-meta-cost">
                        {q.cost_currency === 'USD' ? '$' : q.cost_currency}{' '}
                        {(q.cost_amount / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button className="wizard-remove-btn" onClick={() => removeQuestion(q.id)} title="Remove question">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedQuestions.length > 0 && (
          <div className="wizard-subtotal">
            <span>Subtotal ({selectedQuestions.length} questions)</span>
            <span className="wizard-subtotal-amount">
              {'$'} {formatDollars(questionSubtotal)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Screen 2: Pricing ──
  const renderStep2 = () => (
    <div className="admin-form-page" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: "'Cinzel', serif" }}>
        <i className="fas fa-tags" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        Pricing Configuration
      </h3>

      {/* Regular Cost */}
      <div className="form-group">
        <label>Regular Cost</label>
        <div className="chart-style-toggle">
          <button className={pricingMode === 'fixed' ? 'active' : ''} onClick={() => setPricingMode('fixed')}>
            Fixed
          </button>
          <button className={pricingMode === 'variable' ? 'active' : ''} onClick={() => setPricingMode('variable')}>
            Variable
          </button>
        </div>
        {pricingMode === 'fixed' ? (
          <>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              placeholder="Amount in rupees (e.g., 499)"
              style={{ marginTop: 8 }}
            />
            {stepErrors.fixedPrice && (
              <div style={{ color: '#ff4757', fontSize: '0.9375rem', marginTop: 4 }}>{stepErrors.fixedPrice}</div>
            )}
          </>
        ) : (
          <div className="readonly-field" style={{ marginTop: 8 }}>
            Auto: {'$'} {formatDollars(questionCostCents)} (sum of question costs)
          </div>
        )}
      </div>

      {/* Number of Iterations */}
      <div className="form-group">
        <label>Number of Iterations</label>
        <input
          type="number"
          min="1"
          max="10"
          value={numIterations}
          onChange={(e) => setNumIterations(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
        />
        {stepErrors.numIterations && (
          <div style={{ color: '#ff4757', fontSize: '0.9375rem', marginTop: 4 }}>{stepErrors.numIterations}</div>
        )}
      </div>

      {/* Discount */}
      <div className="form-group">
        <label>Discount</label>
        <div className="chart-style-toggle" style={{ justifyContent: 'flex-start' }}>
          <button className={discountMode === 'none' ? 'active' : ''} onClick={() => { setDiscountMode('none'); setDiscountValue(''); }}>
            None
          </button>
          <button className={discountMode === 'fixed' ? 'active' : ''} onClick={() => setDiscountMode('fixed')}>
            Fixed
          </button>
          <button className={discountMode === 'percentage' ? 'active' : ''} onClick={() => setDiscountMode('percentage')}>
            Percentage
          </button>
        </div>
        {discountMode === 'fixed' && (
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder="Discount amount in rupees"
            style={{ marginTop: 8 }}
          />
        )}
        {discountMode === 'percentage' && (
          <>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="Discount percentage (0-100)"
              style={{ marginTop: 8 }}
            />
            {stepErrors.discountValue && (
              <div style={{ color: '#ff4757', fontSize: '0.9375rem', marginTop: 4 }}>{stepErrors.discountValue}</div>
            )}
          </>
        )}
      </div>

      {/* Discount Validity */}
      {discountMode !== 'none' && (
        <div className="form-group">
          <label>Discount Validity</label>
          <input
            type="date"
            value={discountValidity}
            onChange={(e) => setDiscountValidity(e.target.value)}
          />
        </div>
      )}

      {/* Running cost summary */}
      <div className="wizard-cost-summary">
        <h4 style={{ color: '#fff', marginBottom: 12 }}>
          <i className="fas fa-calculator" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Cost Summary
        </h4>
        <div className="wizard-cost-row">
          <span>Question Costs</span>
          <span>{'$'} {formatDollars(pricingMode === 'fixed' ? Math.round(parseFloat(fixedPrice || 0) * 100) : questionCostCents)}</span>
        </div>
        {iterationCostCents > 0 && (
          <div className="wizard-cost-row">
            <span>+ Iterations ({numIterations} x {iterCostMode === 'fixed' ? `$${iterCostValue}` : `${iterCostValue}%`})</span>
            <span>{'$'} {formatDollars(iterationCostCents)}</span>
          </div>
        )}
        {discountCents > 0 && (
          <div className="wizard-cost-row discount">
            <span>- Discount ({discountMode === 'fixed' ? `$${discountValue}` : `${discountValue}%`})</span>
            <span>-{'$'} {formatDollars(discountCents)}</span>
          </div>
        )}
        <div className="wizard-cost-divider" />
        <div className="wizard-cost-row total">
          <span>TOTAL</span>
          <span>{'$'} {formatDollars(totalCostCents)}</span>
        </div>
      </div>
    </div>
  );

  // ── Screen 3: LLM Config ──
  const renderStep3 = () => (
    <div className="admin-form-page" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: "'Cinzel', serif" }}>
        <i className="fas fa-robot" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        LLM Configuration
      </h3>

      {/* Creator Model */}
      <div className="form-group">
        <label>Creator Model</label>
        <select value={creatorModel} onChange={(e) => setCreatorModel(e.target.value)}>
          <option value="">Select a model...</option>
          {availableModels.providers.map((provider) => (
            <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
              {(availableModels.models[provider] || []).map((model) => (
                <option key={`${provider}/${model}`} value={`${provider}/${model}`}>{model}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Reviewer Model */}
      <div className="form-group">
        <label>Reviewer Model</label>
        <select value={reviewerModel} onChange={(e) => setReviewerModel(e.target.value)}>
          <option value="">Select a model...</option>
          {availableModels.providers.map((provider) => (
            <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
              {(availableModels.models[provider] || []).map((model) => (
                <option key={`${provider}/${model}`} value={`${provider}/${model}`}>{model}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Review Iterations */}
      <div className="form-group">
        <label>Review Iterations</label>
        <input
          type="number"
          min="1"
          max="5"
          value={reviewIterations}
          onChange={(e) => setReviewIterations(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)))}
        />
      </div>

      {/* Iteration Cost Rise */}
      <div className="form-group">
        <label>Iteration Cost Rise</label>
        <div className="chart-style-toggle">
          <button className={iterCostMode === 'fixed' ? 'active' : ''} onClick={() => setIterCostMode('fixed')}>
            Fixed
          </button>
          <button className={iterCostMode === 'percentage' ? 'active' : ''} onClick={() => setIterCostMode('percentage')}>
            Percentage
          </button>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={iterCostValue}
          onChange={(e) => setIterCostValue(e.target.value)}
          placeholder={iterCostMode === 'fixed' ? 'Amount in rupees per iteration' : 'Percentage of base per iteration'}
          style={{ marginTop: 8 }}
        />
      </div>

      {/* Creator Prompt */}
      <div className="form-group">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Creator Prompt</span>
          <button
            type="button"
            className="btn-edit"
            style={{ padding: '4px 10px', fontSize: '0.875rem' }}
            onClick={() => setCreatorPrompt(promptDefaults.generator_prompt || '')}
          >
            <i className="fas fa-undo"></i> Reset to Default
          </button>
        </label>
        <textarea
          value={creatorPrompt}
          onChange={(e) => setCreatorPrompt(e.target.value)}
          placeholder="System prompt for the content generator LLM..."
          style={{ minHeight: 140, fontFamily: "'Courier New', monospace", fontSize: '0.9375rem' }}
        />
      </div>

      {/* Reviewer Prompt */}
      <div className="form-group">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Reviewer Prompt</span>
          <button
            type="button"
            className="btn-edit"
            style={{ padding: '4px 10px', fontSize: '0.875rem' }}
            onClick={() => setReviewerPrompt(promptDefaults.reviewer_prompt || '')}
          >
            <i className="fas fa-undo"></i> Reset to Default
          </button>
        </label>
        <textarea
          value={reviewerPrompt}
          onChange={(e) => setReviewerPrompt(e.target.value)}
          placeholder="System prompt for the cross-validation reviewer LLM..."
          style={{ minHeight: 140, fontFamily: "'Courier New', monospace", fontSize: '0.9375rem' }}
        />
      </div>

      {/* Total Cost Display */}
      <div className="wizard-cost-summary">
        <h4 style={{ color: '#fff', marginBottom: 12 }}>
          <i className="fas fa-receipt" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Total Cost Breakdown
        </h4>
        <div className="wizard-cost-row">
          <span>Question Costs</span>
          <span>{'$'} {formatDollars(pricingMode === 'fixed' ? Math.round(parseFloat(fixedPrice || 0) * 100) : questionCostCents)}</span>
        </div>
        {iterationCostCents > 0 && (
          <div className="wizard-cost-row">
            <span>+ Iterations ({numIterations} x {iterCostMode === 'fixed' ? `$${iterCostValue}` : `${iterCostValue}%`})</span>
            <span>{'$'} {formatDollars(iterationCostCents)}</span>
          </div>
        )}
        {discountCents > 0 && (
          <div className="wizard-cost-row discount">
            <span>- Discount ({discountMode === 'fixed' ? `$${discountValue}` : `${discountValue}%`})</span>
            <span>-{'$'} {formatDollars(discountCents)}</span>
          </div>
        )}
        <div className="wizard-cost-divider" />
        <div className="wizard-cost-row total">
          <span>TOTAL</span>
          <span>{'$'} {formatDollars(totalCostCents)}</span>
        </div>
      </div>
    </div>
  );

  // ── Loading state (edit mode) ──
  if (loading) {
    return (
      <PageShell activeNav="admin">
        <section className="admin-page">
          <div className="container">
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading report configuration...</p>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container" style={{ width: '96%', maxWidth: '100%' }}>
          {/* Breadcrumb */}
          <div className="admin-breadcrumb">
            <Link to="/admin/reports">Reports</Link>
            <span className="sep">/</span>
            <span>{isEditMode ? 'Edit Report Config' : 'Create Report Config'}</span>
          </div>

          {/* Header */}
          <div className="admin-header">
            <h1>
              <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-wand-magic-sparkles'}`}></i>{' '}
              {isEditMode ? 'Edit Report Config' : 'Report Wizard'}
            </h1>
            <p>{isEditMode ? 'Modify an existing report configuration' : 'Create a new report configuration in 3 steps'}</p>
          </div>

          {/* Stepper */}
          {renderStepper()}

          {/* Error banner */}
          {error && (
            <div className="api-error" style={{ marginBottom: 20 }}>
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          )}

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation buttons */}
          <div className="wizard-nav-buttons">
            {step > 1 && (
              <button className="btn-modal-cancel" onClick={goBack}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button className="btn-modal-save" onClick={goNext}>
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button className="btn-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save Report</>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
