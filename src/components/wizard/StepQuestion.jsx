/**
 * StepQuestion — Theme -> Life Area -> Question cascading selection.
 * Used by Categories A, B, C, F.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import ChartVisualAid from './ChartVisualAid';

export default function StepQuestion({ data, onChange, content }) {
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Fetch themes on mount
  useEffect(() => {
    api.get('/v1/taxonomy/themes').then(setThemes).catch(() => {});
  }, []);

  // Fetch life areas when theme changes
  useEffect(() => {
    if (!data.theme_id) { setLifeAreas([]); setQuestions([]); return; }
    api.get(`/v1/taxonomy/themes/${data.theme_id}/life-areas`)
      .then(setLifeAreas)
      .catch(() => setLifeAreas([]));
  }, [data.theme_id]);

  // Fetch questions when life area changes
  useEffect(() => {
    if (!data.life_area_id) { setQuestions([]); return; }
    api.get(`/v1/taxonomy/life-areas/${data.life_area_id}/questions`)
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, [data.life_area_id]);

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    // Clear dependents on cascade change
    if (field === 'theme_id') {
      updated.life_area_id = '';
      updated.question_id = '';
      updated.custom_question = '';
    }
    if (field === 'life_area_id') {
      updated.question_id = '';
      updated.custom_question = '';
    }
    onChange(updated);
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>What would you like to know?</h2>
        <p>Select a topic and question, or type your own.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Topic <span className="required">*</span></label>
        <select
          className="wiz-select"
          value={data.theme_id || ''}
          onChange={(e) => handleChange('theme_id', e.target.value)}
        >
          <option value="">Select a topic...</option>
          {themes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {data.theme_id && (
        <div className="wiz-field">
          <label className="wiz-label">Life Area <span className="required">*</span></label>
          <select
            className="wiz-select"
            value={data.life_area_id || ''}
            onChange={(e) => handleChange('life_area_id', e.target.value)}
          >
            <option value="">Select a life area...</option>
            {lifeAreas.map((la) => (
              <option key={la.id} value={la.id}>{la.name}</option>
            ))}
          </select>
        </div>
      )}

      {data.life_area_id && questions.length > 0 && (
        <div className="wiz-field">
          <label className="wiz-label">Suggested Question</label>
          <select
            className="wiz-select"
            value={data.question_id || ''}
            onChange={(e) => handleChange('question_id', e.target.value)}
          >
            <option value="">Choose a question or type your own below...</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>{q.text}</option>
            ))}
          </select>
        </div>
      )}

      <div className="wiz-field">
        <label className="wiz-label">Your Question</label>
        <textarea
          className="wiz-textarea"
          placeholder="Type your specific question here..."
          value={data.custom_question || ''}
          onChange={(e) => handleChange('custom_question', e.target.value)}
          rows={3}
        />
        <div className="wiz-hint">Be as specific as possible for a more accurate reading.</div>
      </div>
    </div>
  );
}
