import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

export default function AdminQuestionEditPage() {
  const { getOverride } = useStyles('admin-questions');
  const { questionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [formData, setFormData] = useState({ question_text: '', cost_amount: '', cost_currency: 'INR', prompt_text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const all = await api.get('/v1/admin/taxonomy/questions?include_deleted=true');
      const found = all.find((q) => q.id === questionId);
      if (found) {
        setQuestion(found);
        setFormData({
          question_text: found.question_text,
          cost_amount: found.cost_amount != null ? String(found.cost_amount) : '',
          cost_currency: found.cost_currency || 'INR',
          prompt_text: found.prompt_text || '',
        });
      } else {
        setError('Question not found.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => { setToast(null); navigate('/admin/questions'); }, 1500);
      return () => clearTimeout(t);
    }
  }, [toast, navigate]);

  const handleSave = async () => {
    if (!formData.question_text.trim()) { setError('Question text is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        question_text: formData.question_text.trim(),
        cost_amount: formData.cost_amount ? parseFloat(formData.cost_amount) : null,
        cost_currency: formData.cost_amount ? formData.cost_currency : null,
        prompt_text: formData.prompt_text.trim() || null,
      };
      await api.put(`/v1/admin/taxonomy/questions/${questionId}`, body);
      setToast({ type: 'success', msg: 'Question updated!' });
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
            <Link to="/admin/questions">Questions</Link>
            <span className="sep">/</span>
            <span>Edit {question?.question_id_display || ''}</span>
          </div>

          <div className="admin-header">
            <h1><i className="fas fa-edit"></i> Edit Question {question ? `— ${question.question_id_display}` : ''}</h1>
            <p>Update question text, cost, and prompt</p>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading question...</p></div>
          ) : (
            <div className="admin-form-page">
              {question && (
                <div className="form-group">
                  <label>Question ID</label>
                  <div className="question-id-display">{question.question_id_display}</div>
                </div>
              )}
              <div className="form-group">
                <label>Question Text * (max 250 chars)</label>
                <input type="text" value={formData.question_text} onChange={(e) => setFormData({ ...formData, question_text: e.target.value })} maxLength={250} />
                <div className={`char-count ${formData.question_text.length > 250 ? 'over-limit' : ''}`}>{formData.question_text.length}/250</div>
              </div>
              <div className="cost-row">
                <div className="form-group">
                  <label>Cost Amount</label>
                  <input type="number" step="0.01" min="0" value={formData.cost_amount} onChange={(e) => setFormData({ ...formData, cost_amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select value={formData.cost_currency} onChange={(e) => setFormData({ ...formData, cost_currency: e.target.value })}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Prompt Text (LLM)</label>
                <textarea value={formData.prompt_text} onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })} style={{ minHeight: 100 }} />
              </div>
              {error && <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>}
              <div className="admin-modal-actions">
                <button className="btn-modal-cancel" onClick={() => navigate('/admin/questions')}>Cancel</button>
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
