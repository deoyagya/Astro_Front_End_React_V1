import { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import DateInput from '../../components/form/DateInput';
import TimeSelectGroup from '../../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../../components/PlaceAutocomplete';
import '../../styles/admin.css';

/* ============================================================
   Pipeline Steps Definition
   ============================================================ */

const PIPELINE_STEPS = [
  { num: 0,  key: 'input',                label: 'Birth Details',    phase: 'Input',     icon: 'fa-user' },
  { num: 1,  key: 'planetary_calculations', label: 'Planetary Calc',  phase: 'Bundle',    icon: 'fa-globe' },
  { num: 2,  key: 'derived_flags',         label: 'Derived Flags',   phase: 'Bundle',    icon: 'fa-flag' },
  { num: 3,  key: 'd1_chart',             label: 'D1 Chart',        phase: 'Bundle',    icon: 'fa-chart-pie' },
  { num: 4,  key: 'divisional_charts',     label: 'Divisional Charts', phase: 'Bundle',  icon: 'fa-layer-group' },
  { num: 5,  key: 'dasha_computation',     label: 'Dasha',           phase: 'Bundle',    icon: 'fa-clock' },
  { num: 6,  key: 'planetary_aspects',     label: 'Aspects',         phase: 'Bundle',    icon: 'fa-arrows-alt' },
  { num: 7,  key: 'ashtakavarga',          label: 'Ashtakavarga',    phase: 'Bundle',    icon: 'fa-th' },
  { num: 8,  key: 'shadbala',             label: 'Shadbala',        phase: 'Bundle',    icon: 'fa-dumbbell' },
  { num: 9,  key: 'transit_analysis',      label: 'Transits',        phase: 'Bundle',    icon: 'fa-exchange-alt' },
  { num: 10, key: 'advanced_modules',      label: 'Advanced',        phase: 'Bundle',    icon: 'fa-cogs' },
  { num: 11, key: 'phase29_data',          label: 'Phase 29',        phase: 'Bundle',    icon: 'fa-database' },
  { num: 12, key: 'subdomain_rules',       label: 'Rules',           phase: 'RDL',       icon: 'fa-code-branch' },
  { num: 13, key: 'rule_evaluation',       label: 'Evaluation',      phase: 'RDL',       icon: 'fa-check-double' },
  { num: 14, key: 'verdict_trail',         label: 'Verdict Trail',   phase: 'Verdict',   icon: 'fa-route' },
  { num: 15, key: 'consolidated_pre_llm',  label: 'Pre-LLM',        phase: 'LLM Prep',  icon: 'fa-compress-alt' },
  { num: 16, key: 'strategy_routing',      label: 'Strategy',        phase: 'LLM',       icon: 'fa-robot' },
  { num: 17, key: 'llm_output',           label: 'Output',          phase: 'LLM',       icon: 'fa-magic' },
];

const PHASE_BADGE_CLASS = {
  'Input': '',
  'Bundle': 'bundle',
  'RDL': 'rdl',
  'Verdict': 'verdict',
  'LLM Prep': 'llm-prep',
  'LLM': 'llm',
};

/* ============================================================
   Helper: 12h to 24h conversion
   ============================================================ */

const to24Hour = (h, m, ap) => {
  let hour = parseInt(h, 10);
  if (ap === 'PM' && hour !== 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m}`;
};

/* ============================================================
   Helper: Count records in data
   ============================================================ */

const countRecords = (data) => {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === 'object') return Object.keys(data).length;
  return 1;
};

/* ============================================================
   Helper: Score color class
   ============================================================ */

const scoreColorClass = (score) => {
  if (score == null) return '';
  if (score < 30) return 'red';
  if (score < 60) return 'amber';
  return 'green';
};

/* ============================================================
   Helper: Confidence level
   ============================================================ */

const confidenceLevel = (conf) => {
  if (!conf) return 'low';
  if (typeof conf === 'string') return conf.toLowerCase();
  if (conf >= 0.7) return 'high';
  if (conf >= 0.4) return 'medium';
  return 'low';
};

/* ============================================================
   Sub-component: JsonTreeViewer
   ============================================================ */

function JsonTreeNode({ name, value, level, defaultExpanded }) {
  const isExpandable = value !== null && typeof value === 'object';
  const [expanded, setExpanded] = useState(level < defaultExpanded);

  if (value === null || value === undefined) {
    return (
      <div className="json-tree-row">
        {name !== undefined && (
          <>
            <span className="json-tree-key">{`"${name}"`}</span>
            <span className="json-tree-colon">:</span>
          </>
        )}
        <span className="json-tree-value null">{String(value)}</span>
      </div>
    );
  }

  if (!isExpandable) {
    const type = typeof value === 'string' ? 'string'
      : typeof value === 'number' ? 'number'
      : typeof value === 'boolean' ? 'boolean'
      : 'null';
    const display = typeof value === 'string' ? `"${value}"` : String(value);

    return (
      <div className="json-tree-row">
        {name !== undefined && (
          <>
            <span className="json-tree-key">{`"${name}"`}</span>
            <span className="json-tree-colon">:</span>
          </>
        )}
        <span className={`json-tree-value ${type}`}>{display}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const itemCount = entries.length;

  return (
    <div>
      <div className="json-tree-row">
        <span
          className="json-tree-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`}></i>
        </span>
        {name !== undefined && (
          <>
            <span className="json-tree-key">{isArray ? name : `"${name}"`}</span>
            <span className="json-tree-colon">:</span>
          </>
        )}
        <span className="json-tree-bracket">{openBracket}</span>
        {!expanded && (
          <span
            className="json-tree-summary"
            onClick={() => setExpanded(true)}
          >
            {` ${itemCount} ${isArray ? 'items' : 'keys'}... `}
          </span>
        )}
        {!expanded && <span className="json-tree-bracket">{closeBracket}</span>}
      </div>
      {expanded && (
        <div className="json-tree-node">
          {entries.map(([k, v]) => (
            <JsonTreeNode
              key={k}
              name={isArray ? undefined : k}
              value={v}
              level={level + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
          <div className="json-tree-row">
            <span className="json-tree-bracket">{closeBracket}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function JsonTreeViewer({ data, defaultExpanded = 1 }) {
  if (data === null || data === undefined) {
    return (
      <div className="json-tree">
        <span className="json-tree-value null">null</span>
      </div>
    );
  }

  return (
    <div className="json-tree">
      <JsonTreeNode value={data} level={0} defaultExpanded={defaultExpanded} />
    </div>
  );
}

/* ============================================================
   Sub-component: JsonEditor
   ============================================================ */

function JsonEditor({ value, onChange, onApply, onReset, applyLabel = 'Apply & Re-run', disabled = false }) {
  const [text, setText] = useState(value || '');
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setText(value || '');
    setValid(true);
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    try {
      JSON.parse(v);
      setValid(true);
    } catch {
      setValid(false);
    }
    onChange?.(v);
  };

  return (
    <div className="json-editor-wrap">
      <textarea
        className={`json-editor-textarea ${!valid ? 'json-editor-invalid' : ''}`}
        value={text}
        onChange={handleChange}
        spellCheck={false}
      />
      <div className={`json-editor-status ${valid ? 'valid' : 'invalid'}`}>
        <i className={`fas ${valid ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
        {valid ? 'Valid JSON' : 'Invalid JSON — fix syntax to apply'}
      </div>
      <div className="json-editor-actions">
        {onReset && (
          <button className="btn-modal-cancel" onClick={onReset} disabled={disabled}>
            <i className="fas fa-undo"></i> Reset
          </button>
        )}
        <button
          className="btn-rerun"
          onClick={() => {
            try {
              onApply?.(JSON.parse(text));
            } catch { /* invalid */ }
          }}
          disabled={!valid || disabled}
        >
          <i className="fas fa-play"></i> {applyLabel}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-component: PipelineStepper
   ============================================================ */

function PipelineStepper({ steps, currentStep, onStepClick }) {
  // Group steps by phase
  const phases = [];
  let lastPhase = null;
  for (const s of steps) {
    if (s.phase !== lastPhase) {
      phases.push({ phase: s.phase, steps: [s] });
      lastPhase = s.phase;
    } else {
      phases[phases.length - 1].steps.push(s);
    }
  }

  return (
    <div className="pipeline-stepper">
      {phases.map((pg) => {
        const hasActive = pg.steps.some((s) => s.num === currentStep);
        return (
          <div
            key={pg.phase}
            className={`pipeline-phase-group ${hasActive ? 'active' : ''}`}
          >
            <span className="pipeline-phase-group-label">{pg.phase}</span>
            <div className="pipeline-step-dots">
              {pg.steps.map((s) => {
                const isCurrent = s.num === currentStep;
                const isCompleted = s.num < currentStep;
                const cls = isCurrent ? 'active' : isCompleted ? 'completed' : '';
                return (
                  <span
                    key={s.num}
                    className={`pipeline-step-dot ${cls}`}
                    onClick={() => onStepClick(s.num)}
                    title={s.label}
                  >
                    <span className="pipeline-step-dot-tooltip">{s.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Main Component: AdminPipelineWizardPage
   ============================================================ */

export default function AdminPipelineWizardPage() {
  // ── State ──
  const [step, setStep] = useState(0);
  const [birthData, setBirthData] = useState({
    name: '',
    dob: '',
    hour: '',
    minute: '',
    ampm: 'AM',
    birthPlace: null,
  });
  const [subdomainId, setSubdomainId] = useState('');
  const [question, setQuestion] = useState('');
  const [interpMode, setInterpMode] = useState('static');
  const [subdomains, setSubdomains] = useState([]);
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editJson, setEditJson] = useState('');
  const [jsonValid, setJsonValid] = useState(true);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [rerunResults, setRerunResults] = useState({});

  // ── Toast auto-clear ──
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Load subdomains on mount ──
  useEffect(() => {
    const loadSubdomains = async () => {
      try {
        const res = await api.get('/v1/admin/pipeline-trace/subdomains');
        // Backend returns { subdomains: [{subdomain_id, name, rule_count, file}] }
        const list = (res?.subdomains || []).map((sd) => ({
          id: String(sd.subdomain_id),
          label: sd.name || `Subdomain ${sd.subdomain_id}`,
          rule_count: sd.rule_count,
        }));
        setSubdomains(list);
      } catch (err) {
        console.warn('Failed to load subdomains:', err);
        // Provide fallback subdomains for dev
        setSubdomains([
          { id: '101', label: 'Career Suitability' },
          { id: '103', label: 'Job Threat' },
          { id: '105', label: 'Career Growth' },
          { id: '201', label: 'Secret Affairs' },
          { id: '202', label: 'Timing of Marriage' },
          { id: '204', label: 'Live-in Relationships' },
          { id: '205', label: 'Attraction Patterns' },
          { id: '206', label: 'Emotional Compatibility' },
          { id: '301', label: 'Social Behavior' },
          { id: '302', label: 'Communication Style' },
          { id: '303', label: 'Behavioral Patterns' },
          { id: '304', label: 'Anger & Temperament' },
          { id: '305', label: 'Health & Fitness' },
          { id: '306', label: 'Financial Behavior' },
        ]);
      }
    };
    loadSubdomains();
  }, []);

  // ── Run pipeline trace ──
  const runPipelineTrace = useCallback(async () => {
    setError('');

    // Validate form
    if (!birthData.dob) { setError('Date of birth is required'); return; }
    if (!birthData.hour || !birthData.minute) { setError('Birth time is required'); return; }
    if (!birthData.birthPlace) { setError('Birth place is required'); return; }
    if (!subdomainId) { setError('Please select a subdomain'); return; }

    setLoading(true);
    try {
      const timeStr = to24Hour(birthData.hour, birthData.minute, birthData.ampm);
      const payload = {
        name: birthData.name || 'Pipeline Test',
        dob: birthData.dob,
        tob: timeStr,
        place_of_birth: birthData.birthPlace?.name || '',
        lat: birthData.birthPlace?.lat,
        lon: birthData.birthPlace?.lon,
        tz_id: birthData.birthPlace?.timezone || 'Asia/Kolkata',
        subdomain_id: parseInt(subdomainId, 10),
        user_question: question || undefined,
        interpretation_mode: interpMode,
        language: 'en',
      };

      const res = await api.post('/v1/admin/pipeline-trace', payload);
      setTraceData(res);
      setRerunResults({});
      setStep(1);
      setToast({ type: 'success', msg: 'Pipeline trace completed successfully' });
    } catch (err) {
      setError(err.message || 'Pipeline trace failed');
    } finally {
      setLoading(false);
    }
  }, [birthData, subdomainId, question, interpMode]);

  // ── Step navigation ──
  const goNext = useCallback(() => {
    if (step === 0) {
      runPipelineTrace();
      return;
    }
    if (step < 17) setStep(step + 1);
  }, [step, runPipelineTrace]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const goToStep = useCallback((n) => {
    if (n === 0 || (n <= (traceData ? 17 : 0))) {
      setStep(n);
      setEditMode(false);
    }
  }, [traceData]);

  // ── Re-run: rules ──
  const handleRerunRules = useCallback(async (modifiedContext) => {
    setRerunLoading(true);
    try {
      const res = await api.post('/v1/admin/pipeline-trace/rerun-rules', {
        subdomain_id: parseInt(subdomainId, 10),
        modified_context: modifiedContext,
      });
      setRerunResults((prev) => ({
        ...prev,
        rule_evaluation: res?.rule_evaluation,
        verdict_trail: res?.verdict_trail,
        consolidated_pre_llm: res?.consolidated_pre_llm,
      }));
      setEditMode(false);
      setToast({ type: 'success', msg: 'Rules re-evaluated successfully' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Re-run failed' });
    } finally {
      setRerunLoading(false);
    }
  }, [traceData, subdomainId]);

  // ── Re-run: LLM ──
  const handleRerunLLM = useCallback(async (modifiedRequest) => {
    setRerunLoading(true);
    try {
      const res = await api.post('/v1/admin/pipeline-trace/rerun-llm', {
        interpretation_request: modifiedRequest,
        interpretation_mode: interpMode,
      });
      setRerunResults((prev) => ({
        ...prev,
        llm_output: res?.llm_output,
        strategy_routing: res?.strategy_routing,
      }));
      setEditMode(false);
      setToast({ type: 'success', msg: 'LLM re-run completed' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'LLM re-run failed' });
    } finally {
      setRerunLoading(false);
    }
  }, [traceData, interpMode]);

  // ── Birth data field updaters ──
  const updateBirth = (field, value) => {
    setBirthData((prev) => ({ ...prev, [field]: value }));
  };

  /* ============================================================
     Render: Step 0 — Birth Data Input
     ============================================================ */

  const renderStep0 = () => (
    <div>
      <div className="pipeline-stage-header">
        <h2><i className="fas fa-user"></i> Birth Details & Configuration</h2>
      </div>
      <div className="pipeline-input-form">
        <div className="form-group">
          <label htmlFor="pw-name">Name (optional)</label>
          <input
            id="pw-name"
            type="text"
            placeholder="Enter name..."
            value={birthData.name}
            onChange={(e) => updateBirth('name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="pw-dob">Date of Birth *</label>
          <DateInput
            id="pw-dob"
            value={birthData.dob}
            onChange={(val) => updateBirth('dob', val)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="form-group">
          <label>Time of Birth *</label>
          <TimeSelectGroup
            hourId="pw-hour"
            minuteId="pw-minute"
            ampmId="pw-ampm"
            hourValue={birthData.hour}
            minuteValue={birthData.minute}
            ampmValue={birthData.ampm}
            onHourChange={(v) => updateBirth('hour', v)}
            onMinuteChange={(v) => updateBirth('minute', v)}
            onAmpmChange={(v) => updateBirth('ampm', v)}
          />
        </div>
        <div className="form-group">
          <label>Birth Place *</label>
          <PlaceAutocomplete
            id="pw-place"
            placeholder="Search city..."
            value={birthData.birthPlace?.name || ''}
            onSelect={(place) => updateBirth('birthPlace', place)}
          />
        </div>
        <div className="form-group full-width">
          <label htmlFor="pw-subdomain">Subdomain *</label>
          <select
            id="pw-subdomain"
            className="subdomain-selector"
            value={subdomainId}
            onChange={(e) => setSubdomainId(e.target.value)}
          >
            <option value="">-- Select Subdomain --</option>
            {subdomains.map((sd) => (
              <option key={sd.id} value={sd.id}>
                {sd.id} — {sd.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group full-width">
          <label htmlFor="pw-question">Question (optional — for semantic routing)</label>
          <input
            id="pw-question"
            type="text"
            placeholder="e.g., When will I get married?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <div className="form-group full-width">
          <label>Interpretation Mode</label>
          <div className="interp-mode-group">
            {['static', 'ai', 'ai_fallback'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`interp-mode-btn ${interpMode === mode ? 'active' : ''}`}
                onClick={() => setInterpMode(mode)}
              >
                {mode === 'static' && <><i className="fas fa-file-alt"></i> Static</>}
                {mode === 'ai' && <><i className="fas fa-robot"></i> AI Only</>}
                {mode === 'ai_fallback' && <><i className="fas fa-shield-alt"></i> AI + Fallback</>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ============================================================
     Render: Generic Stage Viewer
     ============================================================ */

  const renderStageView = (stageKey) => {
    const stepDef = PIPELINE_STEPS.find((s) => s.key === stageKey);
    const stageRaw = traceData?.stages?.[stageKey];
    const stageData = rerunResults[stageKey] || stageRaw?.data || stageRaw;
    const phaseBadge = PHASE_BADGE_CLASS[stepDef?.phase] || '';
    const duration = stageRaw?.meta?.duration_ms;
    const records = stageRaw?.meta?.record_count ?? countRecords(stageData);

    return (
      <div>
        <div className="pipeline-stage-header">
          <h2>
            <i className={`fas ${stepDef?.icon || 'fa-cube'}`}></i>
            {' '}{stepDef?.label || stageKey}
          </h2>
          {stepDef?.phase && (
            <span className={`pipeline-phase-badge ${phaseBadge}`}>
              {stepDef.phase}
            </span>
          )}
          <span className="record-count">
            {records} {records === 1 ? 'record' : 'records'}
          </span>
          {duration != null && (
            <span className="stage-duration">
              <i className="fas fa-stopwatch"></i> {duration}ms
            </span>
          )}
        </div>
        {stageData ? (
          <JsonTreeViewer data={stageData} defaultExpanded={1} />
        ) : (
          <div className="pipeline-no-data">
            <i className="fas fa-inbox"></i>
            <p>No data available for this stage</p>
          </div>
        )}
        {/* Edit & re-run for eligible steps */}
        {(step === 13 || step === 15) && stageData && !editMode && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button
              className="btn-rerun"
              onClick={() => {
                setEditJson(JSON.stringify(stageData, null, 2));
                setEditMode(true);
              }}
            >
              <i className="fas fa-edit"></i> Edit & Re-run
            </button>
          </div>
        )}
        {editMode && (step === 13 || step === 15) && (
          <JsonEditor
            value={editJson}
            onChange={(v) => {
              setEditJson(v);
              try { JSON.parse(v); setJsonValid(true); } catch { setJsonValid(false); }
            }}
            onApply={(parsed) => {
              if (step === 13) handleRerunRules(parsed);
              else handleRerunLLM(parsed);
            }}
            onReset={() => {
              setEditMode(false);
              setEditJson('');
            }}
            disabled={rerunLoading}
          />
        )}
      </div>
    );
  };

  /* ============================================================
     Render: Step 13 — Rule Evaluation (special)
     ============================================================ */

  const renderStep13 = () => {
    const stageRaw = traceData?.stages?.rule_evaluation;
    const evalData = rerunResults.rule_evaluation || stageRaw?.data || stageRaw;
    if (!evalData) return renderStageView('rule_evaluation');

    const score = evalData.score ?? evalData.total_score;
    const confidence = evalData.confidence;
    const triggeredRules = evalData.triggered_rules || evalData.rules_fired || [];
    const mitigationRules = evalData.mitigation_rules || [];
    const rawContext = evalData.raw_context || evalData.context || evalData;

    return (
      <div>
        <div className="pipeline-stage-header">
          <h2><i className="fas fa-check-double"></i> Rule Evaluation</h2>
          <span className="pipeline-phase-badge rdl">RDL</span>
          {stageRaw?.meta?.duration_ms != null && (
            <span className="stage-duration">
              <i className="fas fa-stopwatch"></i> {stageRaw.meta.duration_ms}ms
            </span>
          )}
        </div>

        {/* Score & Confidence row */}
        <div style={{ display: 'flex', gap: 30, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className={`score-display ${scoreColorClass(score)}`}>
              {score != null ? Math.round(score) : '--'}
            </div>
            <div className="score-display-label">Composite Score</div>
          </div>
          {confidence && (
            <span className={`confidence-badge ${confidenceLevel(confidence)}`}>
              <i className="fas fa-signal"></i> {typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : confidence} confidence
            </span>
          )}
          <span className="record-count" style={{ marginLeft: 'auto' }}>
            {triggeredRules.length} rules fired
          </span>
        </div>

        {/* Triggered rules table */}
        {triggeredRules.length > 0 && (
          <>
            <h3 style={{ color: '#b794ff', fontFamily: "'Cinzel', serif", fontSize: '0.95rem', marginBottom: 10 }}>
              <i className="fas fa-fire"></i> Triggered Rules
            </h3>
            <table className="rule-eval-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Tradition</th>
                </tr>
              </thead>
              <tbody>
                {triggeredRules.map((r, i) => (
                  <tr key={i} className="rule-fired">
                    <td>{r.rule_id || r.id || `R${i + 1}`}</td>
                    <td>{r.description || r.name || '—'}</td>
                    <td>{r.weight != null ? r.weight : '—'}</td>
                    <td>{r.tradition || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Mitigation rules */}
        {mitigationRules.length > 0 && (
          <>
            <h3 style={{ color: '#ffa502', fontFamily: "'Cinzel', serif", fontSize: '0.95rem', marginTop: 20, marginBottom: 10 }}>
              <i className="fas fa-shield-alt"></i> Mitigation Rules
            </h3>
            <table className="rule-eval-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Tradition</th>
                </tr>
              </thead>
              <tbody>
                {mitigationRules.map((r, i) => (
                  <tr key={i} className="rule-not-fired">
                    <td>{r.rule_id || r.id || `M${i + 1}`}</td>
                    <td>{r.description || r.name || '—'}</td>
                    <td>{r.weight != null ? r.weight : '—'}</td>
                    <td>{r.tradition || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Edit & re-run */}
        {!editMode && (
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button
              className="btn-rerun"
              onClick={() => {
                setEditJson(JSON.stringify(rawContext, null, 2));
                setEditMode(true);
              }}
            >
              <i className="fas fa-edit"></i> Edit Context & Re-run Rules
            </button>
          </div>
        )}
        {editMode && (
          <JsonEditor
            value={editJson}
            onChange={(v) => {
              setEditJson(v);
              try { JSON.parse(v); setJsonValid(true); } catch { setJsonValid(false); }
            }}
            onApply={(parsed) => handleRerunRules(parsed)}
            onReset={() => { setEditMode(false); setEditJson(''); }}
            applyLabel="Re-run Rules"
            disabled={rerunLoading}
          />
        )}

        {/* Full data tree */}
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer', color: '#a0a8b8', fontSize: '0.9375rem' }}>
            <i className="fas fa-code"></i> Full evaluation data
          </summary>
          <div style={{ marginTop: 8 }}>
            <JsonTreeViewer data={evalData} defaultExpanded={0} />
          </div>
        </details>
      </div>
    );
  };

  /* ============================================================
     Render: Step 14 — Verdict Trail (special)
     ============================================================ */

  const renderStep14 = () => {
    const stageRaw14 = traceData?.stages?.verdict_trail;
    const verdictData = rerunResults.verdict_trail || stageRaw14?.data || stageRaw14;
    if (!verdictData) return renderStageView('verdict_trail');

    const nodes = verdictData.nodes || verdictData.assessments || [];
    const overallVerdict = verdictData.overall || verdictData.overall_verdict;

    // Group nodes by section letter
    const sections = {};
    for (const node of nodes) {
      const sectionLetter = (node.node_id || node.id || '').charAt(0).toUpperCase() || '?';
      if (!sections[sectionLetter]) sections[sectionLetter] = [];
      sections[sectionLetter].push(node);
    }

    const sectionLabels = {
      A: 'Planet Strength & Dignity',
      B: 'House & Bhava Analysis',
      C: 'Dasha & Transit',
      D: 'Yoga & Special Combinations',
      E: 'Divisional Chart Confirmation',
    };

    const sentimentClass = (s) => {
      if (!s) return 'neutral';
      const low = s.toLowerCase();
      if (low === 'favorable' || low === 'positive' || low === 'strong') return 'favorable';
      if (low === 'unfavorable' || low === 'negative' || low === 'weak') return 'unfavorable';
      if (low === 'mixed' || low === 'moderate') return 'mixed';
      return 'neutral';
    };

    return (
      <div>
        <div className="pipeline-stage-header">
          <h2><i className="fas fa-route"></i> Verdict Trail</h2>
          <span className="pipeline-phase-badge verdict">Verdict</span>
          <span className="record-count">{nodes.length} assessments</span>
        </div>

        {/* Overall verdict */}
        {overallVerdict && (
          <div style={{
            background: 'rgba(123, 91, 255, 0.08)',
            border: '1px solid rgba(123, 91, 255, 0.2)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#b794ff', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                Overall Verdict
              </div>
              <div style={{ color: '#e0e0e0', fontSize: '1rem', fontWeight: 600 }}>
                {overallVerdict.summary || overallVerdict.verdict || JSON.stringify(overallVerdict)}
              </div>
            </div>
            {overallVerdict.sentiment && (
              <span className={`confidence-badge ${confidenceLevel(overallVerdict.confidence)}`}>
                {overallVerdict.sentiment}
              </span>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="verdict-timeline">
          {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([letter, sectionNodes]) => (
            <div key={letter}>
              <div className="verdict-section-label">
                {letter} — {sectionLabels[letter] || `Section ${letter}`}
              </div>
              {sectionNodes.map((node, i) => {
                const sentiment = sentimentClass(node.sentiment || node.verdict_sentiment);
                const statusLabel = node.status || node.result || 'evaluated';
                const statusCls = statusLabel === 'pass' || statusLabel === 'favorable' ? 'pass'
                  : statusLabel === 'fail' || statusLabel === 'unfavorable' ? 'fail' : 'skip';
                return (
                  <div key={i} className={`verdict-node ${sentiment}`}>
                    <div className="verdict-node-header">
                      <span className="verdict-node-id">{node.node_id || node.id}</span>
                      <span className="verdict-node-name">{node.name || node.label || node.node_id}</span>
                      <span className={`verdict-node-status ${statusCls}`}>{statusLabel}</span>
                    </div>
                    {(node.verdict || node.commentary) && (
                      <div className="verdict-node-verdict">
                        {node.verdict || node.commentary}
                      </div>
                    )}
                    {(node.evidence || node.details) && (
                      <ul className="verdict-node-evidence">
                        {(Array.isArray(node.evidence) ? node.evidence : Array.isArray(node.details) ? node.details : [node.evidence || node.details])
                          .filter(Boolean)
                          .map((ev, j) => (
                            <li key={j}>{typeof ev === 'string' ? ev : JSON.stringify(ev)}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Full data tree */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', color: '#a0a8b8', fontSize: '0.9375rem' }}>
            <i className="fas fa-code"></i> Full verdict data
          </summary>
          <div style={{ marginTop: 8 }}>
            <JsonTreeViewer data={verdictData} defaultExpanded={0} />
          </div>
        </details>
      </div>
    );
  };

  /* ============================================================
     Render: Step 15 — Pre-LLM Consolidation (special)
     ============================================================ */

  const renderStep15 = () => {
    const stageRaw15 = traceData?.stages?.consolidated_pre_llm;
    const preLlmData = rerunResults.consolidated_pre_llm || stageRaw15?.data || stageRaw15;
    if (!preLlmData) return renderStageView('consolidated_pre_llm');

    const score = preLlmData.score ?? preLlmData.total_score;
    const confidence = preLlmData.confidence;
    const rulesCount = preLlmData.rules_count ?? preLlmData.triggered_rules_count ?? 0;
    const rawRequest = preLlmData.raw_interpretation_request || preLlmData.interpretation_request || preLlmData;

    // Data layers checklist
    const dataLayers = [
      { key: 'planetary_data', label: 'Planetary Data' },
      { key: 'dasha_data', label: 'Dasha Data' },
      { key: 'ashtakavarga', label: 'Ashtakavarga' },
      { key: 'shadbala', label: 'Shadbala' },
      { key: 'yoga_data', label: 'Yoga Scan' },
      { key: 'remedy_data', label: 'Remedies' },
      { key: 'argala_data', label: 'Argala' },
      { key: 'evidence_trail', label: 'Evidence Trail' },
      { key: 'transit_data', label: 'Transit Data' },
    ];

    return (
      <div>
        <div className="pipeline-stage-header">
          <h2><i className="fas fa-compress-alt"></i> Pre-LLM Consolidation</h2>
          <span className="pipeline-phase-badge llm-prep">LLM Prep</span>
        </div>

        {/* Summary panel */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className={`score-display ${scoreColorClass(score)}`}>
              {score != null ? Math.round(score) : '--'}
            </div>
            <div className="score-display-label">Composite Score</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: '#c7cfdd', fontSize: '0.88rem', marginBottom: 8 }}>
              <strong style={{ color: '#e0e0e0' }}>{rulesCount}</strong> rules evaluated
              {confidence && (
                <> | <span className={`confidence-badge ${confidenceLevel(confidence)}`}>
                  {typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : confidence}
                </span></>
              )}
            </div>
            <div className="data-layers-grid">
              {dataLayers.map((dl) => {
                const present = preLlmData[dl.key] != null || preLlmData?.data_layers?.[dl.key] != null;
                return (
                  <div key={dl.key} className="data-layer-item">
                    <i className={`fas ${present ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {dl.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full data */}
        <JsonTreeViewer data={preLlmData} defaultExpanded={1} />

        {/* Edit & re-run LLM */}
        {!editMode && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button
              className="btn-rerun"
              onClick={() => {
                setEditJson(JSON.stringify(rawRequest, null, 2));
                setEditMode(true);
              }}
            >
              <i className="fas fa-edit"></i> Edit & Re-run LLM
            </button>
          </div>
        )}
        {editMode && (
          <JsonEditor
            value={editJson}
            onChange={(v) => {
              setEditJson(v);
              try { JSON.parse(v); setJsonValid(true); } catch { setJsonValid(false); }
            }}
            onApply={(parsed) => handleRerunLLM(parsed)}
            onReset={() => { setEditMode(false); setEditJson(''); }}
            applyLabel="Re-run LLM"
            disabled={rerunLoading}
          />
        )}
      </div>
    );
  };

  /* ============================================================
     Render: Step 17 — LLM Output (special)
     ============================================================ */

  const renderStep17 = () => {
    const stageRaw17 = traceData?.stages?.llm_output;
    const llmData = rerunResults.llm_output || stageRaw17?.data || stageRaw17;
    if (!llmData) return renderStageView('llm_output');

    const stageRaw16 = traceData?.stages?.strategy_routing;
    const strategyData = rerunResults.strategy_routing || stageRaw16?.data || stageRaw16;
    const headline = llmData.headline || llmData.title || llmData.summary_title || '';
    const interpretation = llmData.interpretation || llmData.text || llmData.narrative || '';
    const tone = llmData.tone || llmData.sentiment || '';
    const advice = llmData.advice || llmData.guidance || '';
    const remedies = llmData.remedies || llmData.remedy_list || [];
    const aiMeta = llmData.ai_metadata || llmData.meta || {};

    return (
      <div>
        <div className="pipeline-stage-header">
          <h2><i className="fas fa-magic"></i> LLM Output</h2>
          <span className="pipeline-phase-badge llm">LLM</span>
          {stageRaw17?.meta?.duration_ms != null && (
            <span className="stage-duration">
              <i className="fas fa-stopwatch"></i> {stageRaw17.meta.duration_ms}ms
            </span>
          )}
        </div>

        <div className="llm-split-view">
          {/* Left: input summary */}
          <div className="llm-panel">
            <h3><i className="fas fa-sign-in-alt"></i> Input Summary</h3>
            {strategyData && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#a0a8b8', fontSize: '0.875rem', marginBottom: 4 }}>Strategy</div>
                <div style={{ color: '#e0e0e0', fontWeight: 600 }}>
                  {strategyData.strategy || strategyData.mode || interpMode}
                </div>
              </div>
            )}
            {strategyData?.provider && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#a0a8b8', fontSize: '0.875rem', marginBottom: 4 }}>Provider</div>
                <div style={{ color: '#e0e0e0', fontWeight: 600 }}>
                  {strategyData.provider}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#a0a8b8', fontSize: '0.875rem', marginBottom: 8 }}>Strategy Routing Data</div>
              <JsonTreeViewer data={strategyData || { strategy: interpMode }} defaultExpanded={0} />
            </div>
          </div>

          {/* Right: output */}
          <div className="llm-panel">
            <h3><i className="fas fa-sign-out-alt"></i> Output</h3>
            {headline && <div className="llm-output-headline">{headline}</div>}
            {interpretation && <div className="llm-output-paragraph">{interpretation}</div>}
            {tone && (
              <div style={{ marginBottom: 12 }}>
                <span className="tone-badge"><i className="fas fa-theater-masks"></i> {tone}</span>
              </div>
            )}
            {advice && <div className="llm-output-advice">{advice}</div>}
            {Array.isArray(remedies) && remedies.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#b794ff', fontSize: '0.9375rem', fontWeight: 600, marginBottom: 6 }}>
                  Remedies
                </div>
                <ul className="llm-output-remedies">
                  {remedies.map((r, i) => (
                    <li key={i}>{typeof r === 'string' ? r : r.description || r.name || JSON.stringify(r)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* AI metadata */}
        {aiMeta && Object.keys(aiMeta).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: '#b794ff', fontFamily: "'Cinzel', serif", fontSize: '0.95rem', marginBottom: 10 }}>
              <i className="fas fa-microchip"></i> AI Metadata
            </h3>
            <div className="llm-meta-grid">
              {aiMeta.model && (
                <div className="llm-meta-item">
                  <span className="meta-label">Model</span>
                  <span className="meta-value">{aiMeta.model}</span>
                </div>
              )}
              {aiMeta.tokens != null && (
                <div className="llm-meta-item">
                  <span className="meta-label">Tokens</span>
                  <span className="meta-value">{aiMeta.tokens?.toLocaleString()}</span>
                </div>
              )}
              {(aiMeta.input_tokens != null || aiMeta.output_tokens != null) && (
                <>
                  <div className="llm-meta-item">
                    <span className="meta-label">Input Tokens</span>
                    <span className="meta-value">{aiMeta.input_tokens?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="llm-meta-item">
                    <span className="meta-label">Output Tokens</span>
                    <span className="meta-value">{aiMeta.output_tokens?.toLocaleString() || '—'}</span>
                  </div>
                </>
              )}
              {aiMeta.cost != null && (
                <div className="llm-meta-item">
                  <span className="meta-label">Cost</span>
                  <span className="meta-value">${typeof aiMeta.cost === 'number' ? aiMeta.cost.toFixed(4) : aiMeta.cost}</span>
                </div>
              )}
              {aiMeta.latency_ms != null && (
                <div className="llm-meta-item">
                  <span className="meta-label">Latency</span>
                  <span className="meta-value">{aiMeta.latency_ms}ms</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Re-run LLM button */}
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            className="btn-rerun"
            onClick={() => {
              const preLlm = rerunResults.consolidated_pre_llm || traceData?.stages?.consolidated_pre_llm;
              const rawReq = preLlm?.raw_interpretation_request || preLlm?.interpretation_request || preLlm || {};
              setEditJson(JSON.stringify(rawReq, null, 2));
              setEditMode(true);
            }}
          >
            <i className="fas fa-redo"></i> Re-run LLM
          </button>
        </div>
        {editMode && (
          <JsonEditor
            value={editJson}
            onChange={(v) => {
              setEditJson(v);
              try { JSON.parse(v); setJsonValid(true); } catch { setJsonValid(false); }
            }}
            onApply={(parsed) => handleRerunLLM(parsed)}
            onReset={() => { setEditMode(false); setEditJson(''); }}
            applyLabel="Re-run LLM"
            disabled={rerunLoading}
          />
        )}

        {/* Full raw output */}
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer', color: '#a0a8b8', fontSize: '0.9375rem' }}>
            <i className="fas fa-code"></i> Full LLM response data
          </summary>
          <div style={{ marginTop: 8 }}>
            <JsonTreeViewer data={llmData} defaultExpanded={0} />
          </div>
        </details>
      </div>
    );
  };

  /* ============================================================
     Main Render
     ============================================================ */

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        {/* Toast notification */}
        {toast && (
          <div className={`admin-toast ${toast.type}`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {' '}{toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="admin-header">
          <h1><i className="fas fa-flask"></i> Pipeline Wizard</h1>
          <p>17-stage prediction pipeline debug tool</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="obs-error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
            <button onClick={() => setError('')}>
              <i className="fas fa-times"></i> Dismiss
            </button>
          </div>
        )}

        {/* Stepper (only when we have trace data) */}
        {step > 0 && traceData && (
          <PipelineStepper
            steps={PIPELINE_STEPS}
            currentStep={step}
            onStepClick={goToStep}
          />
        )}

        {/* Stage content card */}
        <div className="pipeline-stage-card">
          {step === 0 ? renderStep0() :
           step === 13 ? renderStep13() :
           step === 14 ? renderStep14() :
           step === 15 ? renderStep15() :
           step === 17 ? renderStep17() :
           renderStageView(PIPELINE_STEPS[step]?.key)}
        </div>

        {/* Navigation buttons */}
        <div className="wizard-nav-buttons">
          {step > 0 && (
            <button className="btn-modal-cancel" onClick={goBack}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step === 0 ? (
            <button
              className="btn-modal-save"
              onClick={runPipelineTrace}
              disabled={loading}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Running Pipeline...</>
              ) : (
                <><i className="fas fa-play"></i> Run Pipeline</>
              )}
            </button>
          ) : step < 17 ? (
            <button className="btn-modal-save" onClick={goNext}>
              Next <i className="fas fa-arrow-right"></i>
            </button>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
