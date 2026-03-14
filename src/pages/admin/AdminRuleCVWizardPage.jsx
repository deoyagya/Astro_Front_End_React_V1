/**
 * AdminRuleCVWizardPage — Phase 41
 * 6-step wizard for cross-validating astrology rules through
 * the Producer (Claude) / Reviewer (Gemini) pipeline.
 *
 * Steps: Context → Rules → Prompt → Review & Submit → Results → Baseline
 */

import React, { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import { sanitizeGeo } from '../../hooks/useBirthData';
import DateInput from '../../components/form/DateInput';
import TimeSelectGroup from '../../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../../components/PlaceAutocomplete';
import '../../styles/admin.css';
import '../../styles/rule-cv-wizard.css';
import { useStyles } from '../../context/StyleContext';

/* ============================================================
   Constants
   ============================================================ */

const WIZARD_STEPS = [
  { num: 0, key: 'context',  label: 'Select Context',   icon: 'fa-sitemap' },
  { num: 1, key: 'rules',    label: 'Enter Rules',      icon: 'fa-code-branch' },
  { num: 2, key: 'prompt',   label: 'Select Prompt',    icon: 'fa-robot' },
  { num: 3, key: 'review',   label: 'Review & Submit',  icon: 'fa-clipboard-check' },
  { num: 4, key: 'results',  label: 'Review Results',   icon: 'fa-chart-line' },
  { num: 5, key: 'baseline', label: 'Baseline',         icon: 'fa-check-double' },
];

const QUERY_TYPES = ['CAREER', 'MARRIAGE', 'JOB_LOSS', 'DIVORCE_WINDOW', 'MUHURTA'];

const QUERY_TYPE_LABELS = {
  CAREER: 'Career',
  MARRIAGE: 'Marriage',
  JOB_LOSS: 'Job Loss',
  DIVORCE_WINDOW: 'Divorce',
  MUHURTA: 'Muhurta',
};

const REC_TYPE_CONFIG = {
  ADD_RULES_IN_CONFIG:        { label: 'Add Rules',       css: 'add-rules',        icon: 'fa-plus-circle' },
  CODE_CHANGES_INCLUDE_RULES: { label: 'Code Changes',    css: 'code-changes',     icon: 'fa-code' },
  INCORRECT_VALUES_CALCULATED:{ label: 'Incorrect Values', css: 'incorrect-values', icon: 'fa-exclamation-triangle' },
};

const SEVERITY_CSS = {
  CRITICAL: 'critical',
  HIGH:     'high',
  MEDIUM:   'medium',
  LOW:      'low',
  INFO:     'info',
};

const GATE_CONFIG = {
  PASS:            { label: 'PASS',            css: 'pass',            icon: 'fa-check-circle' },
  PASS_WITH_NOTES: { label: 'PASS WITH NOTES', css: 'pass-with-notes', icon: 'fa-exclamation-circle' },
  FAIL:            { label: 'FAIL',            css: 'fail',            icon: 'fa-times-circle' },
  DEADLOCKED:      { label: 'DEADLOCKED',      css: 'deadlocked',     icon: 'fa-lock' },
};

/* ============================================================
   Helpers
   ============================================================ */

const to24Hour = (h, m, ap) => {
  let hour = parseInt(h, 10);
  if (ap === 'PM' && hour !== 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m}`;
};

const alignmentClass = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const autoDetectQueryType = (themeName) => {
  if (!themeName) return null;
  const lower = themeName.toLowerCase();
  if (lower.includes('muhurta')) return 'MUHURTA';
  if (lower.includes('career') || lower.includes('profession')) return 'CAREER';
  if (lower.includes('marriage') || lower.includes('compatibility')) return 'MARRIAGE';
  if (lower.includes('job') && lower.includes('loss')) return 'JOB_LOSS';
  if (lower.includes('divorce') || lower.includes('separation')) return 'DIVORCE_WINDOW';
  return null;
};

/* ============================================================
   Sub-component: CVWizardStepper
   ============================================================ */

function CVWizardStepper({ steps, currentStep, onStepClick, furthestStep }) {
  return (
    <div className="cv-wizard-stepper">
      {steps.map((s, i) => {
        const isActive = s.num === currentStep;
        const isCompleted = s.num < currentStep;
        const isClickable = s.num <= furthestStep;
        return (
          <React.Fragment key={s.num}>
            {i > 0 && (
              <div className={`cv-wizard-step-connector ${s.num <= currentStep ? 'completed' : ''}`} />
            )}
            <div
              className={`cv-wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick(s.num)}
              title={s.label}
            >
              <div className="cv-wizard-step-circle">
                {isCompleted ? <i className="fas fa-check" /> : s.num + 1}
              </div>
              <span className="cv-wizard-step-label">{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ============================================================
   Sub-component: JsonTreeViewer (from PipelineWizard)
   ============================================================ */

function JsonTreeNode({ name, value, level, defaultExpanded }) {
  const isExpandable = value !== null && typeof value === 'object';
  const [expanded, setExpanded] = useState(level < defaultExpanded);

  if (value === null || value === undefined) {
    return (
      <div className="json-tree-row">
        {name !== undefined && (
          <><span className="json-tree-key">{`"${name}"`}</span><span className="json-tree-colon">:</span></>
        )}
        <span className="json-tree-value null">{String(value)}</span>
      </div>
    );
  }

  if (!isExpandable) {
    const type = typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'null';
    const display = typeof value === 'string' ? `"${value}"` : String(value);
    return (
      <div className="json-tree-row">
        {name !== undefined && (
          <><span className="json-tree-key">{`"${name}"`}</span><span className="json-tree-colon">:</span></>
        )}
        <span className={`json-tree-value ${type}`}>{display}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  return (
    <div>
      <div className="json-tree-row">
        <span className="json-tree-toggle" onClick={() => setExpanded(!expanded)}>
          <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`}></i>
        </span>
        {name !== undefined && (
          <><span className="json-tree-key">{isArray ? name : `"${name}"`}</span><span className="json-tree-colon">:</span></>
        )}
        <span className="json-tree-bracket">{openBracket}</span>
        {!expanded && (
          <span className="json-tree-summary" onClick={() => setExpanded(true)}>
            {` ${entries.length} ${isArray ? 'items' : 'keys'}... `}
          </span>
        )}
        {!expanded && <span className="json-tree-bracket">{closeBracket}</span>}
      </div>
      {expanded && (
        <div className="json-tree-node">
          {entries.map(([k, v]) => (
            <JsonTreeNode key={k} name={isArray ? undefined : k} value={v} level={level + 1} defaultExpanded={defaultExpanded} />
          ))}
          <div className="json-tree-row"><span className="json-tree-bracket">{closeBracket}</span></div>
        </div>
      )}
    </div>
  );
}

function JsonTreeViewer({ data, defaultExpanded = 1 }) {
  if (data === null || data === undefined) {
    return <div className="json-tree"><span className="json-tree-value null">null</span></div>;
  }
  return (
    <div className="json-tree">
      <JsonTreeNode value={data} level={0} defaultExpanded={defaultExpanded} />
    </div>
  );
}

/* ============================================================
   Sub-component: JsonEditor (from PipelineWizard)
   ============================================================ */

function JsonEditor({ value, onChange, onApply, onReset, applyLabel = 'Apply', disabled = false, rows = 18 }) {
  const [text, setText] = useState(value || '');
  const [valid, setValid] = useState(true);

  useEffect(() => { setText(value || ''); setValid(true); }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    try { JSON.parse(v); setValid(true); } catch { setValid(false); }
    onChange?.(v);
  };

  return (
    <div className="json-editor-wrap">
      <textarea
        className={`json-editor-textarea ${!valid ? 'json-editor-invalid' : ''}`}
        value={text}
        onChange={handleChange}
        spellCheck={false}
        rows={rows}
      />
      <div className={`json-editor-status ${valid ? 'valid' : 'invalid'}`}>
        <i className={`fas ${valid ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
        {valid ? 'Valid JSON' : 'Invalid JSON — fix syntax to apply'}
      </div>
      {(onApply || onReset) && (
        <div className="json-editor-actions">
          {onReset && (
            <button className="btn-modal-cancel" onClick={onReset} disabled={disabled}>
              <i className="fas fa-undo"></i> Reset
            </button>
          )}
          {onApply && (
            <button
              className="btn-rerun"
              onClick={() => { try { onApply?.(JSON.parse(text)); } catch { /* invalid */ } }}
              disabled={!valid || disabled}
            >
              <i className="fas fa-play"></i> {applyLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Main Component
   ============================================================ */

export default function AdminRuleCVWizardPage() {
  const { getStyle, getOverride } = useStyles('admin-rule-cv');
  // -------- Wizard state --------
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);

  // -------- Step 0: Context --------
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [lifeAreas, setLifeAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [useCustomQuestion, setUseCustomQuestion] = useState(false);
  const [queryType, setQueryType] = useState('CAREER');
  const [birthData, setBirthData] = useState({
    name: '', dob: '', hour: '', minute: '', ampm: 'AM', birthPlace: null,
  });

  // -------- Step 1: Rules --------
  const [rulesJson, setRulesJson] = useState('[\n  \n]');
  const [rulesValid, setRulesValid] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [conditionTypes, setConditionTypes] = useState(null);
  const [enums, setEnums] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState({});

  // -------- Step 2: Prompt --------
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // -------- Step 3: Review --------
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunning, setDryRunning] = useState(false);

  // -------- Step 4: Results --------
  const [cvResult, setCvResult] = useState(null);
  const [cvRunning, setCvRunning] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState({});

  // -------- Step 5: Baseline --------
  const [baselineStatus, setBaselineStatus] = useState(null);

  // -------- Shared --------
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // -------- Toast auto-dismiss --------
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // -------- Data Loading --------

  // Load themes on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/v1/admin/taxonomy/themes');
        setThemes(Array.isArray(data) ? data : []);
      } catch (err) { setError(err.message); }
    };
    load();
  }, []);

  // Load condition types + enums on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [types, enumData] = await Promise.all([
          api.get('/v1/admin/rules/condition-types'),
          api.get('/v1/admin/rules/enums'),
        ]);
        setConditionTypes(types);
        setEnums(enumData);
      } catch { /* non-critical */ }
    };
    load();
  }, []);

  // Cascade: theme → life areas
  useEffect(() => {
    if (!selectedThemeId) { setLifeAreas([]); setSelectedAreaId(''); return; }
    const load = async () => {
      try {
        const data = await api.get(`/v1/admin/taxonomy/themes/${selectedThemeId}/life-areas`);
        setLifeAreas(Array.isArray(data) ? data : []);
        setSelectedAreaId('');
        setSelectedQuestionId('');
      } catch (err) { setError(err.message); }
    };
    load();
    // Auto-detect query type
    const theme = themes.find(t => t.id === selectedThemeId);
    const detected = autoDetectQueryType(theme?.name);
    if (detected) setQueryType(detected);
  }, [selectedThemeId, themes]);

  // Cascade: life area → questions
  useEffect(() => {
    if (!selectedAreaId) { setQuestions([]); setSelectedQuestionId(''); return; }
    const load = async () => {
      try {
        const data = await api.get(`/v1/admin/taxonomy/questions?life_area_id=${selectedAreaId}`);
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) { setError(err.message); }
    };
    load();
  }, [selectedAreaId]);

  // Load prompts when entering step 2
  const loadPrompts = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/prompts?category=user_template');
      setPrompts(Array.isArray(data) ? data : []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (step === 2 && prompts.length === 0) loadPrompts();
  }, [step, prompts.length, loadPrompts]);

  // -------- Derived --------
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  const selectedTheme = themes.find(t => t.id === selectedThemeId);
  const selectedArea = lifeAreas.find(a => a.id === selectedAreaId);

  // -------- Handlers --------

  const handleQuestionChange = (qid) => {
    if (qid === '__custom__') {
      setSelectedQuestionId('');
      setUseCustomQuestion(true);
    } else {
      setSelectedQuestionId(qid);
      setUseCustomQuestion(false);
      const q = questions.find(x => x.id === qid);
      if (q?.rules_json) {
        setRulesJson(JSON.stringify(q.rules_json, null, 2));
      }
    }
  };

  const handleValidateRules = async () => {
    setValidating(true);
    try {
      const parsed = JSON.parse(rulesJson);
      const result = await api.post('/v1/admin/rules/validate', {
        rule_id: 'cv_wizard_temp',
        weight: 0.5,
        condition: Array.isArray(parsed) ? { type: 'AND', sub_rules: parsed } : parsed,
      });
      setValidationResult(result);
      setToast({ type: result.valid ? 'success' : 'error', msg: result.valid ? 'Rules are valid ✓' : 'Validation errors found' });
    } catch (err) {
      setValidationResult({ valid: false, errors: [err.message] });
      setToast({ type: 'error', msg: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleDryRun = async () => {
    setDryRunning(true);
    try {
      const timeStr = to24Hour(birthData.hour, birthData.minute, birthData.ampm);
      const payload = {
        query_type: queryType,
        name: birthData.name || 'CV Test Subject',
        dob: birthData.dob,
        tob: timeStr,
        ...sanitizeGeo(birthData.birthPlace),
        max_rounds: 2,
        user_question: useCustomQuestion ? customQuestion : (selectedQuestion?.question_text || ''),
      };
      const result = await api.post('/v1/cross-validate/dry-run', payload);
      setDryRunResult(result);
      setToast({ type: 'success', msg: 'Dry run passed — ready to submit' });
    } catch (err) {
      setDryRunResult({ valid: false, error: err.message });
      setToast({ type: 'error', msg: err.message });
    } finally {
      setDryRunning(false);
    }
  };

  const handleSubmitCV = async () => {
    setCvRunning(true);
    setError('');
    try {
      const timeStr = to24Hour(birthData.hour, birthData.minute, birthData.ampm);
      const payload = {
        query_type: queryType,
        name: birthData.name || 'CV Test Subject',
        dob: birthData.dob,
        tob: timeStr,
        ...sanitizeGeo(birthData.birthPlace),
        max_rounds: 2,
        user_question: useCustomQuestion ? customQuestion : (selectedQuestion?.question_text || ''),
      };
      const result = await api.postLong('/v1/cross-validate/run', payload, 120_000);
      setCvResult(result);
      // Expand all rounds by default
      const rounds = result?.case_file?.evaluation_ledger || [];
      const expanded = {};
      rounds.forEach((_, i) => { expanded[i] = true; });
      setExpandedRounds(expanded);
      setStep(4);
      setFurthestStep(Math.max(furthestStep, 4));
      setToast({ type: 'success', msg: 'Cross-validation complete' });
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', msg: err.message });
    } finally {
      setCvRunning(false);
    }
  };

  const handleBaselineRules = async () => {
    setBaselineStatus('saving');
    try {
      // If we have a selected question with a life area, update the question's rules
      if (selectedQuestion && selectedAreaId) {
        const parsed = JSON.parse(rulesJson);
        await api.put(`/v1/admin/taxonomy/questions/${selectedQuestion.id}`, {
          rules_json: parsed,
        });
      }
      setBaselineStatus('saved');
      setToast({ type: 'success', msg: 'Rules baselined successfully' });
    } catch (err) {
      setBaselineStatus('error');
      setToast({ type: 'error', msg: err.message });
    }
  };

  // -------- Navigation --------

  const goToStep = (n) => { if (n <= furthestStep) setStep(n); };
  const goNext = () => {
    if (step < 5) {
      const next = step + 1;
      setStep(next);
      setFurthestStep(Math.max(furthestStep, next));
    }
  };
  const goBack = () => { if (step > 0) setStep(step - 1); };

  const canProceed = (stepNum) => {
    switch (stepNum) {
      case 0: return selectedThemeId && selectedAreaId
        && (selectedQuestionId || (useCustomQuestion && customQuestion.trim()))
        && birthData.dob && birthData.hour && birthData.minute && birthData.birthPlace;
      case 1: return rulesValid && rulesJson.trim().length > 5;
      case 2: return selectedPromptId || (useCustomPrompt && customPrompt.trim());
      case 3: return dryRunResult?.valid;
      case 4: return cvResult != null;
      default: return true;
    }
  };

  // -------- Step Renders --------

  const renderStep0 = () => (
    <div className="pipeline-input-form">
      <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
        <i className="fas fa-sitemap" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        Select Context & Birth Data
      </h2>

      {/* Theme */}
      <div className="form-group">
        <label>Theme *</label>
        <select className="filter-select" value={selectedThemeId} onChange={e => setSelectedThemeId(e.target.value)} style={{ width: '100%' }}>
          <option value="">— Select Theme —</option>
          {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Life Area */}
      <div className="form-group">
        <label>Life Area *</label>
        <select className="filter-select" value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)}
          disabled={!selectedThemeId} style={{ width: '100%' }}>
          <option value="">— Select Life Area —</option>
          {lifeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Question */}
      <div className="form-group">
        <label>Question *</label>
        <select className="filter-select"
          value={useCustomQuestion ? '__custom__' : selectedQuestionId}
          onChange={e => handleQuestionChange(e.target.value)}
          disabled={!selectedAreaId} style={{ width: '100%' }}>
          <option value="">— Select Question —</option>
          {questions.map(q => (
            <option key={q.id} value={q.id}>
              {q.question_id_display ? `${q.question_id_display}: ` : ''}{q.question_text}
            </option>
          ))}
          <option value="__custom__">✏️ Enter Custom Question</option>
        </select>
        {useCustomQuestion && (
          <input type="text" placeholder="Enter your custom question..."
            value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
            style={{ marginTop: 8, width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2f3e',
              background: 'rgba(40,44,60,0.8)', color: '#e0e0e0', fontSize: '0.9rem' }}
          />
        )}
      </div>

      {/* Query Type */}
      <div className="form-group">
        <label>Query Type (for CV Pipeline) *</label>
        <div className="cv-query-type-group">
          {QUERY_TYPES.map(qt => (
            <button key={qt}
              className={`cv-query-type-btn ${queryType === qt ? 'active' : ''}`}
              onClick={() => setQueryType(qt)}>
              {QUERY_TYPE_LABELS[qt]}
            </button>
          ))}
        </div>
      </div>

      <hr className="cv-separator" />

      {/* Birth Data */}
      <h3 style={{ margin: '0 0 14px', color: '#b794ff', fontSize: '0.95rem' }}>
        <i className="fas fa-user" style={{ marginRight: 8 }}></i> Birth Data
      </h3>

      <div className="form-group">
        <label>Name</label>
        <input type="text" placeholder="Name (optional)" value={birthData.name}
          onChange={e => setBirthData(prev => ({ ...prev, name: e.target.value }))}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2f3e',
            background: 'rgba(40,44,60,0.8)', color: '#e0e0e0', fontSize: '0.9rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
          <label>Date of Birth *</label>
          <DateInput value={birthData.dob} onChange={v => setBirthData(prev => ({ ...prev, dob: v }))} />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
          <label>Time of Birth *</label>
          <TimeSelectGroup
            hour={birthData.hour} minute={birthData.minute} ampm={birthData.ampm}
            onChange={(h, m, ap) => setBirthData(prev => ({ ...prev, hour: h, minute: m, ampm: ap }))}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Place of Birth *</label>
        <PlaceAutocomplete
          value={birthData.birthPlace?.display || ''}
          onChange={() => {}}
          onLocationSelect={loc => setBirthData(prev => ({ ...prev, birthPlace: loc }))}
        />
        {birthData.birthPlace && (
          <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginTop: 4 }}>
            Lat: {birthData.birthPlace.lat?.toFixed(4)}, Lon: {birthData.birthPlace.lon?.toFixed(4)}
            {birthData.birthPlace.timezone && ` — TZ: ${birthData.birthPlace.timezone}`}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
        <i className="fas fa-code-branch" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        Enter Rules (JSON)
      </h2>

      <div className="cv-rules-layout">
        {/* Left: Editor */}
        <div className="cv-rules-editor">
          <JsonEditor
            value={rulesJson}
            onChange={v => {
              setRulesJson(v);
              try { JSON.parse(v); setRulesValid(true); } catch { setRulesValid(false); }
            }}
            rows={20}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn-admin-add" onClick={handleValidateRules} disabled={!rulesValid || validating}>
              {validating ? <><i className="fas fa-spinner fa-spin"></i> Validating...</> : <><i className="fas fa-check-double"></i> Validate Rules</>}
            </button>
            {selectedQuestion?.rules_json && (
              <button className="btn-modal-cancel" onClick={() => setRulesJson(JSON.stringify(selectedQuestion.rules_json, null, 2))}>
                <i className="fas fa-download"></i> Load from Question
              </button>
            )}
          </div>

          {/* Validation result */}
          {validationResult && (
            <div className={`cv-validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
              <i className={`fas ${validationResult.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              {' '}{validationResult.valid ? 'All rules are valid' : 'Validation issues found'}
              {validationResult.errors?.length > 0 && (
                <ul className="cv-validation-errors">
                  {validationResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              {validationResult.warnings?.length > 0 && (
                <ul className="cv-validation-errors" style={{ color: '#ffa502' }}>
                  {validationResult.warnings.map((w, i) => <li key={i} style={{ color: '#ffa502' }}>{w}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right: Sidebar reference */}
        <div className="cv-sidebar">
          <div style={{ fontWeight: 600, color: '#b794ff', marginBottom: 10, fontSize: '0.9375rem' }}>
            <i className="fas fa-book"></i> Condition Types Reference
          </div>
          {conditionTypes?.categories && Object.entries(conditionTypes.categories).map(([cat, types]) => (
            <div key={cat} className="cv-sidebar-section">
              <button className="cv-sidebar-toggle" onClick={() => setSidebarOpen(prev => ({ ...prev, [cat]: !prev[cat] }))}>
                <i className={`fas fa-chevron-${sidebarOpen[cat] ? 'down' : 'right'}`}></i>
                {cat} ({types.length})
              </button>
              {sidebarOpen[cat] && (
                <div className="cv-sidebar-items">
                  {types.map(t => (
                    <span key={t} className="cv-sidebar-chip" title={`Click to copy: ${t}`}
                      onClick={() => { navigator.clipboard?.writeText(`"type": "${t}"`); setToast({ type: 'success', msg: `Copied: ${t}` }); }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {enums && (
            <>
              <hr className="cv-separator" />
              <div style={{ fontWeight: 600, color: '#b794ff', marginBottom: 10, fontSize: '0.9375rem' }}>
                <i className="fas fa-list"></i> Enums Reference
              </div>
              {['planets', 'houses', 'dignities', 'charts', 'dasha_levels'].map(key => (
                enums[key] && (
                  <div key={key} className="cv-sidebar-section">
                    <button className="cv-sidebar-toggle" onClick={() => setSidebarOpen(prev => ({ ...prev, [`enum_${key}`]: !prev[`enum_${key}`] }))}>
                      <i className={`fas fa-chevron-${sidebarOpen[`enum_${key}`] ? 'down' : 'right'}`}></i>
                      {key}
                    </button>
                    {sidebarOpen[`enum_${key}`] && (
                      <div className="cv-sidebar-items">
                        {(Array.isArray(enums[key]) ? enums[key] : []).map(v => (
                          <span key={typeof v === 'object' ? v.name || v.id : v} className="cv-sidebar-chip">
                            {typeof v === 'object' ? v.name || v.id : v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="pipeline-input-form">
      <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
        <i className="fas fa-robot" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        Select Prompt
      </h2>

      <div className="cv-prompt-toggle">
        <button className={!useCustomPrompt ? 'active' : ''} onClick={() => setUseCustomPrompt(false)}>
          <i className="fas fa-list"></i> Use Existing Prompt
        </button>
        <button className={useCustomPrompt ? 'active' : ''} onClick={() => setUseCustomPrompt(true)}>
          <i className="fas fa-pen"></i> Custom Prompt
        </button>
      </div>

      {!useCustomPrompt ? (
        <>
          <div className="form-group">
            <label>Select Prompt Template</label>
            <select className="filter-select" value={selectedPromptId} onChange={e => setSelectedPromptId(e.target.value)} style={{ width: '100%' }}>
              <option value="">— Select Prompt —</option>
              {prompts.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.prompt_type}] {p.display_name} (v{p.version})
                </option>
              ))}
            </select>
          </div>
          {selectedPrompt && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 6 }}>Prompt Preview:</div>
              <div className="cv-prompt-preview">{selectedPrompt.content}</div>
              {selectedPrompt.template_vars?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.875rem', color: '#a0a8b8' }}>
                  <strong>Variables:</strong> {selectedPrompt.template_vars.map(v => `{${v}}`).join(', ')}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="form-group">
          <label>Custom Prompt Text</label>
          <textarea
            className="json-editor-textarea"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt template here..."
            rows={12}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
        <i className="fas fa-clipboard-check" style={{ color: '#9d7bff', marginRight: 8 }}></i>
        Review & Submit
      </h2>

      {/* Summary cards */}
      <div className="cv-summary-cards">
        <div className="cv-summary-card">
          <h3><i className="fas fa-sitemap"></i> Context</h3>
          <p><span className="label">Theme:</span> {selectedTheme?.name || '—'}</p>
          <p><span className="label">Life Area:</span> {selectedArea?.name || '—'}</p>
          <p><span className="label">Question:</span> {useCustomQuestion ? customQuestion : (selectedQuestion?.question_text || '—')}</p>
          <p><span className="label">Query Type:</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(123,91,255,0.15)', color: '#b794ff', fontSize: '0.875rem', fontWeight: 600, marginLeft: 4 }}>
              {queryType}
            </span>
          </p>
        </div>

        <div className="cv-summary-card">
          <h3><i className="fas fa-user"></i> Birth Data</h3>
          <p><span className="label">Name:</span> {birthData.name || '—'}</p>
          <p><span className="label">DOB:</span> {birthData.dob || '—'}</p>
          <p><span className="label">TOB:</span> {birthData.hour && birthData.minute ? `${birthData.hour}:${birthData.minute} ${birthData.ampm}` : '—'}</p>
          <p><span className="label">Place:</span> {birthData.birthPlace?.display || '—'}</p>
        </div>

        <div className="cv-summary-card">
          <h3><i className="fas fa-code-branch"></i> Rules</h3>
          <p><span className="label">JSON Length:</span> {rulesJson.length} characters</p>
          {(() => { try { const parsed = JSON.parse(rulesJson); return <p><span className="label">Structure:</span> {Array.isArray(parsed) ? `${parsed.length} rules` : 'Object'}</p>; } catch { return <p style={{ color: '#ff4757' }}>Invalid JSON</p>; } })()}
        </div>

        <div className="cv-summary-card">
          <h3><i className="fas fa-robot"></i> Prompt</h3>
          <p><span className="label">Source:</span> {useCustomPrompt ? 'Custom prompt' : (selectedPrompt?.display_name || '—')}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn-admin-add" onClick={handleDryRun} disabled={dryRunning}>
          {dryRunning ? <><i className="fas fa-spinner fa-spin"></i> Running dry run...</> : <><i className="fas fa-vial"></i> Dry Run</>}
        </button>

        {dryRunResult && (
          <span style={{
            padding: '4px 12px', borderRadius: 6, fontSize: '0.875rem', fontWeight: 600,
            background: dryRunResult.valid ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)',
            color: dryRunResult.valid ? '#2ed573' : '#ff4757',
          }}>
            <i className={`fas ${dryRunResult.valid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            {' '}{dryRunResult.valid ? `Valid — ${dryRunResult.rule_count} rules, chart data: ${dryRunResult.chart_data_available ? 'yes' : 'no'}` : `Failed: ${dryRunResult.error || 'Unknown error'}`}
          </span>
        )}
      </div>

      {/* CV Running indicator */}
      {cvRunning && (
        <div className="cv-running-indicator">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Running Cross-Validation Pipeline...</p>
          <p style={{ fontSize: '0.875rem' }}>Producer (Claude) and Reviewer (Gemini) are analyzing your rules. This may take 30-120 seconds.</p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    if (!cvResult) {
      return <div className="admin-empty"><i className="fas fa-chart-line"></i><p>No results yet. Go back and submit.</p></div>;
    }

    const cf = cvResult.case_file || {};
    const ledger = cf.evaluation_ledger || [];
    const state = cf.current_state || {};
    const meta = cf.case_metadata || {};
    const gateKey = state.gate_decision || 'FAIL';
    const gate = GATE_CONFIG[gateKey] || GATE_CONFIG.FAIL;

    return (
      <div>
        <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
          <i className="fas fa-chart-line" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Cross-Validation Results
        </h2>

        {/* Top bar */}
        <div className="cv-result-topbar">
          <div>
            <span className={`cv-gate-decision ${gate.css}`}>
              <i className={`fas ${gate.icon}`}></i> {gate.label}
            </span>
          </div>

          <div className="cv-result-stat" style={{ flex: 1, minWidth: 200 }}>
            <div className="stat-label">Alignment Score</div>
            <div className="cv-alignment-bar">
              <div className={`cv-alignment-fill ${alignmentClass(state.final_alignment_score || 0)}`}
                style={{ width: `${Math.min(state.final_alignment_score || 0, 100)}%` }} />
              <div className="cv-alignment-label">{(state.final_alignment_score || 0).toFixed(0)}/100</div>
            </div>
          </div>

          <div className="cv-result-stat">
            <div className="stat-label">Rounds</div>
            <div className="stat-value">{meta.total_rounds_used || ledger.length}</div>
          </div>

          <div className="cv-result-stat">
            <div className="stat-label">Cost</div>
            <div className="stat-value">${(meta.total_cost_usd || cvResult.total_cost_usd || 0).toFixed(4)}</div>
          </div>

          {state.is_deadlocked && (
            <div className="cv-result-stat">
              <div className="stat-label">Status</div>
              <div className="stat-value" style={{ color: '#9b59b6' }}><i className="fas fa-lock"></i> Deadlocked</div>
            </div>
          )}
        </div>

        {/* Round cards */}
        {ledger.map((round, idx) => {
          const isExpanded = expandedRounds[idx];
          const po = round.producer_output || {};
          const rf = round.reviewer_feedback || {};
          const delta = round.delta_from_previous;

          return (
            <div key={idx} className="cv-round-card">
              <div className={`cv-round-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedRounds(prev => ({ ...prev, [idx]: !prev[idx] }))}>
                <h3>
                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                  Round {round.round || idx + 1}
                  {rf.verdict && (
                    <span className={`cv-verdict-badge ${rf.verdict?.toLowerCase()}`}>
                      {rf.verdict}
                    </span>
                  )}
                  {rf.alignment_score != null && (
                    <span style={{ fontSize: '0.875rem', color: '#a0a8b8', fontWeight: 400 }}>
                      — Alignment: {rf.alignment_score?.toFixed(0)}%
                    </span>
                  )}
                </h3>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ color: '#a0a8b8' }}></i>
              </div>

              {isExpanded && (
                <div className="cv-round-body">
                  {/* Producer Output */}
                  <div className="cv-round-section">
                    <div className="cv-round-section-title">
                      <i className="fas fa-wand-magic-sparkles"></i> Producer Analysis
                      <span className="model-badge">{po.provider || 'unknown'} / {po.model || '?'}</span>
                    </div>

                    {po.proposed_analysis && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 6 }}>Proposed Analysis:</div>
                        <JsonTreeViewer data={po.proposed_analysis} defaultExpanded={1} />
                      </div>
                    )}

                    {po.calculation_logic && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 6 }}>Calculation Logic:</div>
                        <div className="cv-prompt-preview" style={{ maxHeight: 150 }}>{po.calculation_logic}</div>
                      </div>
                    )}

                    {po.confidence_pct != null && (
                      <div style={{ fontSize: '0.9375rem', color: '#e0e0e0' }}>
                        <strong>Confidence:</strong> {po.confidence_pct?.toFixed(0)}%
                      </div>
                    )}

                    <div className="cv-cost-grid">
                      <div className="cv-cost-item"><div className="cost-label">Cost</div><div className="cost-value">${(po.cost_usd || 0).toFixed(4)}</div></div>
                      <div className="cv-cost-item"><div className="cost-label">Tokens</div><div className="cost-value">{po.tokens_used || 0}</div></div>
                      <div className="cv-cost-item"><div className="cost-label">Latency</div><div className="cost-value">{((po.latency_ms || 0) / 1000).toFixed(1)}s</div></div>
                    </div>
                  </div>

                  <hr className="cv-separator" />

                  {/* Reviewer Feedback */}
                  <div className="cv-round-section">
                    <div className="cv-round-section-title">
                      <i className="fas fa-magnifying-glass-chart"></i> Reviewer Feedback
                      <span className="model-badge">{rf.provider || 'unknown'} / {rf.model || '?'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#a0a8b8' }}>Alignment: </span>
                        <strong style={{ color: '#e0e0e0' }}>{rf.alignment_score?.toFixed(0) || '?'}%</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#a0a8b8' }}>Verdict: </span>
                        {rf.verdict && <span className={`cv-verdict-badge ${rf.verdict.toLowerCase()}`}>{rf.verdict}</span>}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: '#a0a8b8' }}>Rules Missed: </span>
                        <strong style={{ color: rf.rules_missed ? '#ff4757' : '#2ed573' }}>
                          {rf.rules_missed ? 'Yes' : 'No'}
                        </strong>
                      </div>
                    </div>

                    {/* Missed rules */}
                    {rf.rules_missed_list?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 6 }}>Missed Rules:</div>
                        <div className="cv-missed-rules">
                          {rf.rules_missed_list.map((r, i) => (
                            <span key={i} className="cv-missed-rule-chip">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {rf.recommendations?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 8 }}>
                          Recommendations ({rf.recommendations.length}):
                        </div>
                        <div className="cv-rec-list">
                          {rf.recommendations.map((rec, i) => {
                            const recType = REC_TYPE_CONFIG[rec.type] || { label: rec.type, css: '', icon: 'fa-info-circle' };
                            const sevCss = SEVERITY_CSS[rec.severity] || 'info';
                            return (
                              <div key={i} className={`cv-rec-card ${recType.css}`}>
                                <div className="cv-rec-card-header">
                                  <span className={`cv-rec-type-badge ${recType.css}`}>
                                    <i className={`fas ${recType.icon}`}></i> {recType.label}
                                  </span>
                                  <span className={`cv-severity ${sevCss}`}>{rec.severity}</span>
                                  {rec.rec_id && <span style={{ fontSize: '0.875rem', color: '#a0a8b8' }}>{rec.rec_id}</span>}
                                </div>
                                <div className="cv-rec-field"><span className="field-label">Finding:</span> {rec.finding}</div>
                                <div className="cv-rec-field"><span className="field-label">Expected Fix:</span> {rec.expected_fix}</div>
                                {rec.acceptance_criteria && (
                                  <div className="cv-rec-field"><span className="field-label">Acceptance:</span> {rec.acceptance_criteria}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Questions to producer */}
                    {rf.questions_to_producer?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 6 }}>Questions to Producer:</div>
                        <ul className="cv-questions-list">
                          {rf.questions_to_producer.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="cv-cost-grid">
                      <div className="cv-cost-item"><div className="cost-label">Cost</div><div className="cost-value">${(rf.cost_usd || 0).toFixed(4)}</div></div>
                      <div className="cv-cost-item"><div className="cost-label">Tokens</div><div className="cost-value">{rf.tokens_used || 0}</div></div>
                      <div className="cv-cost-item"><div className="cost-label">Latency</div><div className="cost-value">{((rf.latency_ms || 0) / 1000).toFixed(1)}s</div></div>
                    </div>
                  </div>

                  {/* Delta (round 2+) */}
                  {delta && (
                    <>
                      <hr className="cv-separator" />
                      <div className="cv-round-section">
                        <div className="cv-round-section-title">
                          <i className="fas fa-code-compare"></i> Delta from Previous Round
                        </div>
                        <div className="cv-delta-grid">
                          <div className="cv-delta-item">
                            <span className="delta-label">Rules Added:</span>
                            <span className="delta-up">{delta.rules_added?.length || 0}</span>
                          </div>
                          <div className="cv-delta-item">
                            <span className="delta-label">Rules Removed:</span>
                            <span className="delta-down">{delta.rules_removed?.length || 0}</span>
                          </div>
                          <div className="cv-delta-item">
                            <span className="delta-label">Rules Changed:</span>
                            <span>{delta.rules_changed?.length || 0}</span>
                          </div>
                          {delta.confidence_change != null && (
                            <div className="cv-delta-item">
                              <span className="delta-label">Confidence:</span>
                              <span className={delta.confidence_change >= 0 ? 'delta-up' : 'delta-down'}>
                                {delta.confidence_change >= 0 ? '+' : ''}{delta.confidence_change?.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Summary */}
        {cvResult.summary && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginBottom: 8 }}>Pipeline Summary:</div>
            <div className="cv-summary-text">{cvResult.summary}</div>
          </div>
        )}
      </div>
    );
  };

  const renderStep5 = () => {
    if (!cvResult) {
      return <div className="admin-empty"><i className="fas fa-check-double"></i><p>No results to baseline.</p></div>;
    }

    const gateKey = cvResult.case_file?.current_state?.gate_decision || 'FAIL';
    const gate = GATE_CONFIG[gateKey] || GATE_CONFIG.FAIL;
    const lastRound = (cvResult.case_file?.evaluation_ledger || []).slice(-1)[0];
    const lastRecs = lastRound?.reviewer_feedback?.recommendations || [];

    return (
      <div>
        <h2 style={{ margin: '0 0 20px', color: '#e0e0e0', fontSize: '1.1rem' }}>
          <i className="fas fa-check-double" style={{ color: '#9d7bff', marginRight: 8 }}></i>
          Baseline Rules
        </h2>

        {/* Banner based on gate decision */}
        <div className={`cv-baseline-banner ${gate.css}`}>
          <i className={`fas ${gate.icon}`} style={{ fontSize: '1.2rem' }}></i>
          {gateKey === 'PASS' && 'All checks passed. Rules are ready for baselining.'}
          {gateKey === 'PASS_WITH_NOTES' && 'Passed with notes. Review outstanding items before baselining.'}
          {gateKey === 'FAIL' && 'Validation failed. Please review and fix the issues before baselining.'}
          {gateKey === 'DEADLOCKED' && 'Producer and Reviewer could not reach agreement. Human review required.'}
        </div>

        {/* Show outstanding recommendations for non-PASS */}
        {gateKey !== 'PASS' && lastRecs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.88rem', color: '#e0e0e0', marginBottom: 10, fontWeight: 600 }}>
              Outstanding Recommendations ({lastRecs.length}):
            </div>
            <div className="cv-rec-list">
              {lastRecs.map((rec, i) => {
                const recType = REC_TYPE_CONFIG[rec.type] || { label: rec.type, css: '', icon: 'fa-info-circle' };
                const sevCss = SEVERITY_CSS[rec.severity] || 'info';
                return (
                  <div key={i} className={`cv-rec-card ${recType.css}`}>
                    <div className="cv-rec-card-header">
                      <span className={`cv-rec-type-badge ${recType.css}`}><i className={`fas ${recType.icon}`}></i> {recType.label}</span>
                      <span className={`cv-severity ${sevCss}`}>{rec.severity}</span>
                    </div>
                    <div className="cv-rec-field"><span className="field-label">Finding:</span> {rec.finding}</div>
                    <div className="cv-rec-field"><span className="field-label">Expected Fix:</span> {rec.expected_fix}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="cv-baseline-actions">
          {(gateKey === 'PASS' || gateKey === 'PASS_WITH_NOTES') && (
            <button className="btn-modal-save" onClick={handleBaselineRules}
              disabled={baselineStatus === 'saving' || baselineStatus === 'saved'}>
              {baselineStatus === 'saving' ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                : baselineStatus === 'saved' ? <><i className="fas fa-check"></i> Saved!</>
                : <><i className="fas fa-download"></i> Save Rules as Baseline</>}
            </button>
          )}

          {gateKey === 'FAIL' && (
            <>
              <button className="btn-modal-cancel" onClick={() => { setStep(1); }}>
                <i className="fas fa-edit"></i> Edit Rules & Re-run
              </button>
              <button className="btn-delete" onClick={handleBaselineRules}
                disabled={baselineStatus === 'saving' || baselineStatus === 'saved'}>
                <i className="fas fa-exclamation-triangle"></i> Force Baseline (Override)
              </button>
            </>
          )}

          {gateKey === 'DEADLOCKED' && (
            <>
              <button className="btn-modal-save" onClick={handleBaselineRules}
                disabled={baselineStatus === 'saving' || baselineStatus === 'saved'}>
                <i className="fas fa-gavel"></i> Accept & Baseline (Human Override)
              </button>
              <button className="btn-modal-cancel" onClick={() => { setStep(1); }}>
                <i className="fas fa-edit"></i> Edit Rules & Re-run
              </button>
            </>
          )}
        </div>

        {baselineStatus === 'saved' && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573', fontSize: '0.88rem' }}>
            <i className="fas fa-check-circle"></i> Rules have been saved as baseline to the selected question.
          </div>
        )}
        {baselineStatus === 'error' && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', fontSize: '0.88rem' }}>
            <i className="fas fa-exclamation-triangle"></i> Failed to save baseline. Please try again.
          </div>
        )}
      </div>
    );
  };

  // -------- Main Render --------

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          {/* Toast */}
          {toast && (
            <div className={`admin-toast ${toast.type}`}>
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {' '}{toast.msg}
            </div>
          )}

          {/* Header */}
          <div className="admin-header">
            <h1><i className="fas fa-balance-scale" style={{ color: '#9d7bff' }}></i> Rule Cross-Validation Wizard</h1>
            <p>Validate and baseline rules through the Producer (Claude) / Reviewer (Gemini) pipeline</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
              color: '#ff4757', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fas fa-exclamation-triangle"></i>
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* Stepper */}
          <CVWizardStepper
            steps={WIZARD_STEPS}
            currentStep={step}
            onStepClick={goToStep}
            furthestStep={furthestStep}
          />

          {/* Content */}
          <div className="pipeline-stage-card">
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Navigation */}
          <div className="cv-wizard-nav">
            {step > 0 && (
              <button className="btn-modal-cancel" onClick={goBack}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            )}
            <div style={{ flex: 1 }} />

            {step < 3 && (
              <button className="btn-modal-save" onClick={goNext} disabled={!canProceed(step)}>
                Next <i className="fas fa-arrow-right"></i>
              </button>
            )}

            {step === 3 && !cvRunning && (
              <button className="btn-modal-save" onClick={handleSubmitCV}
                disabled={!dryRunResult?.valid || cvRunning}>
                <i className="fas fa-play"></i> Run Cross-Validation
              </button>
            )}
            {step === 3 && cvRunning && (
              <button className="btn-modal-save" disabled>
                <i className="fas fa-spinner fa-spin"></i> Running Pipeline...
              </button>
            )}

            {step === 4 && cvResult && (
              <button className="btn-modal-save" onClick={() => { setStep(5); setFurthestStep(Math.max(furthestStep, 5)); }}>
                Proceed to Baseline <i className="fas fa-arrow-right"></i>
              </button>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
