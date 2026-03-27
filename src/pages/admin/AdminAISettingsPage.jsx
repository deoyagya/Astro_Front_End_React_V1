import { useCallback, useEffect, useState } from 'react';
import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';

const SLOT_ORDER = ['generator', 'reviewer', 'cv_producer', 'cv_reviewer'];

const slotDescriptions = {
  generator: 'Primary narrative/content model used by the app runtime.',
  reviewer: 'Validation/review model used alongside the generator when configured.',
  cv_producer: 'Cross-validation producer slot for specialist two-pass flows.',
  cv_reviewer: 'Cross-validation reviewer slot for specialist two-pass flows.',
};

function normalizeDraft(payload) {
  const slots = payload?.slots || [];
  const draft = {};
  slots.forEach((slot) => {
    draft[slot.slot_key] = {
      slot_key: slot.slot_key,
      provider: slot.provider || 'gemini',
      model: slot.model || '',
      api_key: '',
      clear_api_key: false,
      label: slot.label,
      key_preview: slot.key_preview || '',
      key_source: slot.key_source || 'none',
      has_api_key: !!slot.has_api_key,
      updated_at: slot.updated_at || null,
    };
  });
  return draft;
}

function getModelOptions(payload, provider, currentModel) {
  const options = [...(payload?.model_options?.[provider] || [])];
  if (currentModel && !options.includes(currentModel)) {
    options.unshift(currentModel);
  }
  return options;
}

function statusTone(source) {
  if (source === 'database') return '#2ed573';
  if (source === 'environment') return '#ffa502';
  return '#8b949e';
}

export default function AdminAISettingsPage() {
  const [payload, setPayload] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingSlot, setTestingSlot] = useState('');
  const [testResults, setTestResults] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/ai-settings');
      setPayload(data);
      setDraft(normalizeDraft(data));
    } catch (err) {
      setError(err.message || 'Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleDraftChange = (slotKey, patch) => {
    setDraft((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        ...patch,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const slots = SLOT_ORDER.map((slotKey) => {
        const slot = draft[slotKey];
        return {
          slot_key: slot.slot_key,
          provider: slot.provider,
          model: slot.model,
          api_key: slot.api_key || undefined,
          clear_api_key: !!slot.clear_api_key,
        };
      });
      const data = await api.put('/v1/admin/ai-settings', { slots });
      setPayload(data);
      setDraft(normalizeDraft(data));
      setTestResults({});
      setSuccess('AI settings saved and applied to the current runtime.');
    } catch (err) {
      setError(err.message || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (slotKey) => {
    const slot = draft[slotKey];
    setTestingSlot(slotKey);
    setError('');
    setSuccess('');
    try {
      const result = await api.post('/v1/admin/ai-settings/test-connection', {
        slot_key: slotKey,
        provider: slot.provider,
        model: slot.model,
        api_key: slot.clear_api_key ? '' : (slot.api_key || undefined),
      });
      setTestResults((prev) => ({ ...prev, [slotKey]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [slotKey]: { success: false, error: err.message || 'Connection test failed.' },
      }));
    } finally {
      setTestingSlot('');
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1><i className="fas fa-key" style={{ marginRight: 10 }}></i>AI Settings</h1>
            <p>
              Configure admin-managed LLM keys and models for runtime slots. Keys are stored in
              <code style={{ marginLeft: 6, color: '#f472b6' }}>{payload?.storage_table || 'ai_settings'}</code>
              {' '}and only shown as masked previews.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <button className="btn-admin-add" type="button" onClick={fetchSettings} disabled={loading || saving}>
              <i className="fas fa-rotate"></i> Refresh
            </button>
            <button className="btn-admin-add" type="button" onClick={handleSave} disabled={loading || saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Settings</>}
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            color: '#c7cfdd',
          }}
        >
          API keys are never shown in full. Enter a new key only when you want to replace the stored one; leave the
          field blank to keep the current key. Use the per-slot connection test to verify the selected provider, model,
          and key before or after saving.
        </div>

        {success && (
          <div className="admin-toast success" style={{ position: 'static', marginBottom: 20 }}>
            {success}
          </div>
        )}
        {error && (
          <div className="admin-toast error" style={{ position: 'static', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading AI settings...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {SLOT_ORDER.map((slotKey) => {
              const slot = draft[slotKey];
              if (!slot) return null;
              const models = getModelOptions(payload, slot.provider, slot.model);
              const testResult = testResults[slotKey];

              return (
                <div
                  key={slotKey}
                  style={{
                    background: 'rgba(26,31,46,0.92)',
                    border: '1px solid #2a2f3e',
                    borderRadius: 18,
                    padding: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                    <div>
                      <h3 style={{ color: '#fff', marginBottom: 8 }}>{slot.label}</h3>
                      <p style={{ margin: 0, color: '#a9b3c7' }}>{slotDescriptions[slotKey]}</p>
                    </div>
                    <div
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: `1px solid ${statusTone(slot.key_source)}`,
                        color: statusTone(slot.key_source),
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {slot.key_source === 'database' ? 'Using database key' : slot.key_source === 'environment' ? 'Using env fallback' : 'No key saved'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                    <div>
                      <label style={{ display: 'block', color: '#dce3f0', marginBottom: 8, fontWeight: 600 }}>Provider</label>
                      <select
                        value={slot.provider}
                        onChange={(e) => {
                          const nextProvider = e.target.value;
                          const nextModels = getModelOptions(payload, nextProvider, '');
                          handleDraftChange(slotKey, {
                            provider: nextProvider,
                            model: nextModels[0] || '',
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid #2a2f3e',
                          background: 'rgba(40,44,60,0.8)',
                          color: '#fff',
                        }}
                      >
                        {(payload?.provider_options || []).map((provider) => (
                          <option key={provider} value={provider}>{provider}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#dce3f0', marginBottom: 8, fontWeight: 600 }}>Model</label>
                      <select
                        value={slot.model}
                        onChange={(e) => handleDraftChange(slotKey, { model: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid #2a2f3e',
                          background: 'rgba(40,44,60,0.8)',
                          color: '#fff',
                        }}
                      >
                        {models.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label style={{ display: 'block', color: '#dce3f0', marginBottom: 8, fontWeight: 600 }}>API key</label>
                    <input
                      type="password"
                      value={slot.api_key}
                      onChange={(e) => handleDraftChange(slotKey, { api_key: e.target.value, clear_api_key: false })}
                      placeholder={slot.key_preview ? `Saved: ${slot.key_preview}` : 'Paste API key'}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #2a2f3e',
                        background: 'rgba(40,44,60,0.8)',
                        color: '#fff',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 10, color: '#9aa4b8', fontSize: '0.9rem' }}>
                      <span>
                        {slot.key_preview ? `Current preview: ${slot.key_preview}` : 'No key stored for this slot yet.'}
                      </span>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={slot.clear_api_key}
                          onChange={(e) => handleDraftChange(slotKey, { clear_api_key: e.target.checked, api_key: '' })}
                        />
                        Remove saved key on next save
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ color: '#8b949e', fontSize: '0.9rem' }}>
                      {slot.updated_at ? `Last updated: ${new Date(slot.updated_at).toLocaleString()}` : 'Using the default runtime configuration.'}
                    </div>
                    <button className="btn-admin-add" type="button" onClick={() => handleTest(slotKey)} disabled={testingSlot === slotKey || saving}>
                      {testingSlot === slotKey ? <><i className="fas fa-spinner fa-spin"></i> Testing...</> : <><i className="fas fa-plug"></i> Test Connection</>}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 14,
                        borderRadius: 12,
                        border: `1px solid ${testResult.success ? '#2ed573' : '#ff6b6b'}`,
                        background: testResult.success ? 'rgba(46,213,115,0.08)' : 'rgba(255,107,107,0.08)',
                        color: testResult.success ? '#c8f7da' : '#ffd2d2',
                      }}
                    >
                      <strong>{testResult.success ? 'Connection succeeded.' : 'Connection failed.'}</strong>
                      <div style={{ marginTop: 6, fontSize: '0.95rem' }}>
                        Provider: {testResult.provider || slot.provider} | Model: {testResult.model || slot.model}
                        {typeof testResult.latency_ms === 'number' ? ` | Latency: ${testResult.latency_ms} ms` : ''}
                      </div>
                      {testResult.response_preview && (
                        <div style={{ marginTop: 6, fontSize: '0.95rem' }}>Preview: {testResult.response_preview}</div>
                      )}
                      {testResult.error && (
                        <div style={{ marginTop: 6, fontSize: '0.95rem' }}>{testResult.error}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
