import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminQuestionsPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [rulesJson, setRulesJson] = useState('');
  const [promptText, setPromptText] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costCurrency, setCostCurrency] = useState('INR');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [createdId, setCreatedId] = useState(null);

  // Inline create modals
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

  const loadThemes = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/taxonomy/themes');
      setThemes(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  const loadLifeAreas = useCallback(async (themeId) => {
    if (!themeId) { setLifeAreas([]); return; }
    try {
      const data = await api.get(`/v1/admin/taxonomy/themes/${themeId}/life-areas`);
      setLifeAreas(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    setSelectedArea('');
    loadLifeAreas(themeId);
  };

  const handleValidateRules = async () => {
    setValidationResult(null);
    try {
      const parsed = JSON.parse(rulesJson);
      const result = await api.post('/v1/admin/taxonomy/validate-rules', { rules_json: parsed });
      setValidationResult(result);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationResult({ valid: false, errors: ['Invalid JSON syntax: ' + err.message], warnings: [] });
      } else {
        setValidationResult({ valid: false, errors: [err.message], warnings: [] });
      }
    }
  };

  const handleSave = async () => {
    if (!selectedArea) { setError('Please select a Life Area.'); return; }
    if (!questionText.trim()) { setError('Question text is required.'); return; }
    if (questionText.length > 250) { setError('Question text exceeds 250 characters.'); return; }

    setSaving(true);
    setError('');
    try {
      const body = {
        life_area_id: selectedArea,
        question_text: questionText.trim(),
        rules_json: rulesJson.trim() ? JSON.parse(rulesJson) : null,
        prompt_text: promptText.trim() || null,
        cost_amount: costAmount ? parseFloat(costAmount) : null,
        cost_currency: costAmount ? costCurrency : null,
      };
      const result = await api.post('/v1/admin/taxonomy/questions', body);
      setCreatedId(result.question_id_display);
      setToast({ type: 'success', msg: `Question ${result.question_id_display} created!` });
      // Reset form
      setQuestionText('');
      setRulesJson('');
      setPromptText('');
      setCostAmount('');
      setValidationResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;
    try {
      const result = await api.post('/v1/admin/taxonomy/themes', { name: newThemeName.trim() });
      setShowThemeModal(false);
      setNewThemeName('');
      await loadThemes();
      setSelectedTheme(result.id);
      loadLifeAreas(result.id);
      setToast({ type: 'success', msg: 'Theme created!' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  const handleCreateArea = async () => {
    if (!newAreaName.trim() || !selectedTheme) return;
    try {
      const result = await api.post('/v1/admin/taxonomy/life-areas', { theme_id: selectedTheme, name: newAreaName.trim() });
      setShowAreaModal(false);
      setNewAreaName('');
      await loadLifeAreas(selectedTheme);
      setSelectedArea(result.id);
      setToast({ type: 'success', msg: 'Life area created!' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <a href="/admin/themes" onClick={(e) => { e.preventDefault(); navigate('/admin/themes'); }}>Themes</a>
            <span className="sep">/</span>
            <a href="/admin/questions/list" onClick={(e) => { e.preventDefault(); navigate('/admin/questions'); }}>Questions</a>
            <span className="sep">/</span>
            <span>Add New</span>
          </div>

          <div className="admin-header">
            <h1><i className="fas fa-plus-circle"></i> Add Question</h1>
            <p>Create a new prediction question linked to a life area</p>
          </div>

          <div className="admin-modal-content" style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Core Theme Selector */}
            <div className="form-group">
              <label>Core Theme *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="filter-select" style={{ flex: 1 }} value={selectedTheme} onChange={(e) => handleThemeChange(e.target.value)}>
                  <option value="">Select theme...</option>
                  {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="btn-admin-add" style={{ whiteSpace: 'nowrap' }} onClick={() => setShowThemeModal(true)}>
                  <i className="fas fa-plus"></i> Create
                </button>
              </div>
            </div>

            {/* Life Area Selector */}
            <div className="form-group">
              <label>Life Area *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="filter-select" style={{ flex: 1 }} value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} disabled={!selectedTheme}>
                  <option value="">Select life area...</option>
                  {lifeAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button className="btn-admin-add" style={{ whiteSpace: 'nowrap' }} onClick={() => setShowAreaModal(true)} disabled={!selectedTheme}>
                  <i className="fas fa-plus"></i> Create
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="form-group">
              <label>Question Text * (max 250 chars)</label>
              <input type="text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="e.g., Will I get a promotion this year?" maxLength={250} />
              <div className={`char-count ${questionText.length > 250 ? 'over-limit' : ''}`}>{questionText.length}/250</div>
            </div>

            {/* Rules JSON */}
            <div className="form-group">
              <label>Rules JSON (RDL Condition Tree)</label>
              <textarea
                className={`json-editor-area ${validationResult ? (validationResult.valid ? 'valid' : 'invalid') : ''}`}
                value={rulesJson}
                onChange={(e) => { setRulesJson(e.target.value); setValidationResult(null); }}
                placeholder='{"type": "AND", "sub_rules": [...]}'
              />
              <button
                className="btn-admin-add"
                style={{ marginTop: 8 }}
                onClick={handleValidateRules}
                disabled={!rulesJson.trim()}
              >
                <i className="fas fa-check-circle"></i> Validate JSON for Compliance
              </button>
              {validationResult && (
                <div className={`validation-result ${validationResult.valid ? 'success' : 'error'}`}>
                  {validationResult.valid ? (
                    <><i className="fas fa-check-circle"></i> Valid! {validationResult.warnings?.length > 0 && `(${validationResult.warnings.length} warnings)`}</>
                  ) : (
                    <><i className="fas fa-times-circle"></i> Validation failed</>
                  )}
                  {validationResult.errors?.length > 0 && (
                    <ul>{validationResult.errors.map((e, i) => <li key={i}><i className="fas fa-times"></i> {e}</li>)}</ul>
                  )}
                  {validationResult.warnings?.length > 0 && (
                    <ul>{validationResult.warnings.map((w, i) => <li key={i}><i className="fas fa-exclamation-triangle"></i> {w}</li>)}</ul>
                  )}
                  {validationResult.fixed_json && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ color: '#2ed573', fontSize: '0.85rem' }}>Auto-fixed compliant version:</label>
                      <textarea className="json-editor-area valid" readOnly value={JSON.stringify(validationResult.fixed_json, null, 2)} style={{ marginTop: 5 }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cost */}
            <div className="cost-row">
              <div className="form-group">
                <label>Cost Amount</label>
                <input type="number" step="0.01" min="0" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} placeholder="99.50" />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select value={costCurrency} onChange={(e) => setCostCurrency(e.target.value)}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Question ID */}
            <div className="form-group">
              <label>Question ID</label>
              <div className="question-id-display">
                {createdId || 'Will be auto-assigned on save (e.g., Q-100-025)'}
              </div>
            </div>

            {/* Prompt Text */}
            <div className="form-group">
              <label>Prompt Text (LLM)</label>
              <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Analyze the 10th house lord placement for career guidance..." style={{ minHeight: 100 }} />
            </div>

            {error && <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>}

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => navigate('/admin/questions')}>Cancel</button>
              <button className="btn-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Question</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Theme Modal */}
      {showThemeModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowThemeModal(false); }}>
          <div className="admin-modal-content" style={{ maxWidth: 400 }}>
            <h2>Create Theme</h2>
            <div className="form-group">
              <label>Theme Name</label>
              <input type="text" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} placeholder="e.g., Health & Wellness" />
            </div>
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowThemeModal(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={handleCreateTheme}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Area Modal */}
      {showAreaModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowAreaModal(false); }}>
          <div className="admin-modal-content" style={{ maxWidth: 400 }}>
            <h2>Create Life Area</h2>
            <div className="form-group">
              <label>Life Area Name</label>
              <input type="text" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} placeholder="e.g., Mental Wellness" />
            </div>
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowAreaModal(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={handleCreateArea}>Create</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
