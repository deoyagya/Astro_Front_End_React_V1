import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

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

export default function AdminLifeAreaFormPage() {
  const { themeId, areaId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(areaId);
  const backUrl = `/admin/themes/${themeId}/life-areas`;

  const [theme, setTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', rule_file: '',
    primary_houses: '', primary_planets: '',
    divisional_charts: [], display_order: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const themes = await api.get('/v1/admin/taxonomy/themes?include_inactive=true');
      setTheme(themes.find((t) => t.id === themeId) || null);

      if (isEdit) {
        const areas = await api.get(`/v1/admin/taxonomy/themes/${themeId}/life-areas?include_inactive=true`);
        const area = areas.find((a) => a.id === areaId);
        if (area) {
          setFormData({
            name: area.name,
            description: area.description || '',
            rule_file: area.rule_file || '',
            primary_houses: area.primary_houses ? area.primary_houses.join(', ') : '',
            primary_planets: area.primary_planets ? area.primary_planets.join(', ') : '',
            divisional_charts: area.divisional_charts || [],
            display_order: area.display_order,
          });
        } else {
          setError('Life area not found.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [themeId, areaId, isEdit]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => { setToast(null); navigate(backUrl); }, 1500);
      return () => clearTimeout(t);
    }
  }, [toast, navigate, backUrl]);

  const parseHouses = (str) => str ? str.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean) : null;
  const parsePlanets = (str) => str ? str.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const toggleChart = (chartValue) => {
    setFormData((prev) => {
      const selected = prev.divisional_charts || [];
      return {
        ...prev,
        divisional_charts: selected.includes(chartValue)
          ? selected.filter((c) => c !== chartValue)
          : [...selected, chartValue],
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        theme_id: themeId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        rule_file: formData.rule_file.trim() || null,
        primary_houses: parseHouses(formData.primary_houses),
        primary_planets: parsePlanets(formData.primary_planets),
        divisional_charts: formData.divisional_charts.length > 0 ? formData.divisional_charts : null,
        display_order: Number(formData.display_order) || 0,
      };
      if (isEdit) {
        const { theme_id: _, ...updateBody } = body;
        await api.put(`/v1/admin/taxonomy/life-areas/${areaId}`, updateBody);
        setToast({ type: 'success', msg: 'Life area updated!' });
      } else {
        await api.post('/v1/admin/taxonomy/life-areas', body);
        setToast({ type: 'success', msg: 'Life area created!' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <Link to="/admin/themes">Themes</Link>
            <span className="sep">/</span>
            <Link to={backUrl}>{theme?.name || '...'}</Link>
            <span className="sep">/</span>
            <span>{isEdit ? 'Edit' : 'Add'}</span>
          </div>

          <div className="admin-header">
            <h1><i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}`}></i> {isEdit ? 'Edit Life Area' : 'Add Life Area'}</h1>
            <p>{isEdit ? 'Update life area details' : `Add a new life area under "${theme?.name || '...'}"`}</p>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading...</p></div>
          ) : (
            <div className="admin-form-page">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Job Loss / Break / Layoff" maxLength={200} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
              </div>
              <div className="form-group">
                <label>Rule File Path</label>
                <input type="text" value={formData.rule_file} onChange={(e) => setFormData({ ...formData, rule_file: e.target.value })} placeholder="career/job_loss.json" />
              </div>
              <div className="form-group">
                <label>Primary Houses (comma-separated)</label>
                <input type="text" value={formData.primary_houses} onChange={(e) => setFormData({ ...formData, primary_houses: e.target.value })} placeholder="6, 10, 11" />
              </div>
              <div className="form-group">
                <label>Primary Planets (comma-separated)</label>
                <input type="text" value={formData.primary_planets} onChange={(e) => setFormData({ ...formData, primary_planets: e.target.value })} placeholder="Sun, Saturn, Rahu" />
              </div>
              <div className="form-group">
                <label>
                  Divisional Charts
                  {formData.divisional_charts.length > 0 && (
                    <span style={{ color: '#b794ff', fontWeight: 400 }}> ({formData.divisional_charts.length} selected)</span>
                  )}
                </label>
                <div className="chart-picker-grid">
                  {DIVISIONAL_CHARTS.map((chart) => (
                    <label
                      key={chart.value}
                      className={`chart-chip ${formData.divisional_charts.includes(chart.value) ? 'selected' : ''}`}
                      title={chart.label}
                    >
                      <input
                        type="checkbox"
                        checked={formData.divisional_charts.includes(chart.value)}
                        onChange={() => toggleChart(chart.value)}
                      />
                      <span className="chip-label">{chart.value}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
              </div>
              {error && <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>}
              <div className="admin-modal-actions">
                <button className="btn-modal-cancel" onClick={() => navigate(backUrl)}>Cancel</button>
                <button className="btn-modal-save" onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
