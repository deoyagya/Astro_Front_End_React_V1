import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminQuestionListPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchText, setSearchText] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
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

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTheme) params.set('theme_id', selectedTheme);
      if (selectedArea) params.set('life_area_id', selectedArea);
      if (includeDeleted) params.set('include_deleted', 'true');
      if (searchText.trim()) params.set('search', searchText.trim());
      const data = await api.get(`/v1/admin/taxonomy/questions?${params}`);
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTheme, selectedArea, includeDeleted, searchText]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    setSelectedArea('');
    loadLifeAreas(themeId);
  };

  const handleDelete = async (q) => {
    try {
      await api.del(`/v1/admin/taxonomy/questions/${q.id}`);
      setConfirmDelete(null);
      setToast({ type: 'success', msg: `Question ${q.question_id_display} deleted!` });
      loadQuestions();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setConfirmDelete(null);
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <a href="/admin/themes" onClick={(e) => { e.preventDefault(); navigate('/admin/themes'); }}>Themes</a>
            <span className="sep">/</span>
            <span>Questions</span>
          </div>

          <div className="admin-header">
            <h1><i className="fas fa-question-circle"></i> Questions</h1>
            <p>View, edit, and manage prediction questions</p>
          </div>

          <div className="admin-toolbar">
            <select className="filter-select" value={selectedTheme} onChange={(e) => handleThemeChange(e.target.value)}>
              <option value="">All Themes</option>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="filter-select" value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} disabled={!selectedTheme}>
              <option value="">All Life Areas</option>
              {lifeAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input className="search-input" type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search questions..." />
            <label style={{ color: '#c7cfdd', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
              Show deleted
            </label>
            <button className="btn-admin-add" onClick={() => navigate('/admin/questions/add')}>
              <i className="fas fa-plus"></i> Add Question
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading questions...</p></div>
          ) : questions.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-question-circle"></i><p>No questions found. Try different filters or add a new question.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Q-ID</th>
                  <th>Question</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className={!q.is_active ? 'deleted-row' : ''}>
                    <td style={{ fontWeight: 600, color: '#b794ff', whiteSpace: 'nowrap' }}>{q.question_id_display}</td>
                    <td>
                      {q.question_text}
                      {q.rules_json && <span style={{ color: '#2ed573', marginLeft: 8, fontSize: '0.875rem' }}><i className="fas fa-code"></i> RDL</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {q.cost_amount != null ? `${q.cost_amount} ${q.cost_currency || ''}` : '—'}
                    </td>
                    <td>
                      {q.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-deleted">Deleted</span>
                      }
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        {q.is_active && (
                          <button className="btn-delete" onClick={() => setConfirmDelete(q)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ color: '#a0a8b8', fontSize: '0.9375rem', marginTop: 10 }}>{questions.length} question(s) found</p>
        </div>
      </section>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 450 }}>
            <h2>Delete Question</h2>
            <div className="confirm-warning">
              <p><strong>Logical delete:</strong> Question &quot;{confirmDelete.question_id_display}&quot; will be marked as deleted. Existing reports referencing this question are preserved.</p>
            </div>
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-delete" style={{ padding: '10px 20px', fontSize: '0.95rem' }} onClick={() => handleDelete(confirmDelete)}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
