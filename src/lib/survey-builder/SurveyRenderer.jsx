/**
 * SurveyRenderer — Public-facing form renderer.
 * REUSABLE — zero app imports.
 *
 * Usage modes:
 *   1. Preview mode: <SurveyRenderer formData={form} isPreview />
 *   2. Live mode:    <SurveyRenderer slug="my-survey" apiFetch={fn} apiSubmit={fn} />
 */

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { COMPONENT_MAP } from './components';
import { validateResponses } from './utils';

export default function SurveyRenderer({
  formData = null,
  slug = null,
  apiFetch = null,
  apiSubmit = null,
  isPreview = false,
}) {
  const [form, setForm] = useState(formData);
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [startTime] = useState(Date.now());

  // Fetch form if slug provided
  useEffect(() => {
    if (formData) { setForm(formData); return; }
    if (!slug || !apiFetch) return;
    setLoading(true);
    apiFetch(slug)
      .then((data) => setForm(data))
      .catch((err) => setLoadError(err.message || 'Survey not found'))
      .finally(() => setLoading(false));
  }, [slug, apiFetch, formData]);

  // Sync if formData prop changes (preview mode)
  useEffect(() => {
    if (formData) setForm(formData);
  }, [formData]);

  function handleChange(questionId, value) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    setErrors([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isPreview || !apiSubmit) return;

    const validationErrors = validateResponses(form.questions || [], responses);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      await apiSubmit(slug, {
        responses,
        completion_time_seconds: elapsed,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors([err.message || 'Submission failed']);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="sb-renderer sb-renderer-loading">
        <i className="fas fa-spinner fa-spin" /> Loading survey...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="sb-renderer sb-renderer-error">
        <i className="fas fa-exclamation-triangle" />
        <p>{loadError}</p>
      </div>
    );
  }

  if (!form) return null;

  if (submitted) {
    const thankYou = form.settings?.thank_you_message || 'Thank you for your feedback!';
    return (
      <div className="sb-renderer sb-renderer-thanks">
        <i className="fas fa-check-circle" />
        <h2>Submitted!</h2>
        <p>{thankYou}</p>
      </div>
    );
  }

  const submitText = form.settings?.submit_text || 'Submit';

  return (
    <div className="sb-renderer">
      {/* Header */}
      {form.header_html && (
        <div className="sb-renderer-header" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.header_html) }} />
      )}

      {/* Title & Description */}
      <div className="sb-renderer-intro">
        <h2>{form.title}</h2>
        {form.description && <p>{form.description}</p>}
      </div>

      {/* Questions */}
      <form onSubmit={handleSubmit} className="sb-renderer-form">
        {(form.questions || []).map((q) => {
          const Component = COMPONENT_MAP[q.type];
          if (!Component) return null;

          const isDecorative = ['section_header', 'paragraph'].includes(q.type);

          return (
            <div key={q.id} className={`sb-renderer-question ${isDecorative ? 'sb-decorative' : ''}`}>
              {!isDecorative && (
                <label className="sb-renderer-label">
                  {q.label}
                  {q.required && <span className="sb-renderer-required">*</span>}
                </label>
              )}
              {!isDecorative && q.description && (
                <p className="sb-renderer-description">{q.description}</p>
              )}
              <Component
                question={q}
                value={responses[q.id]}
                onChange={(val) => handleChange(q.id, val)}
                disabled={isPreview}
              />
            </div>
          );
        })}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="sb-renderer-errors">
            {errors.map((err, i) => (
              <p key={i}><i className="fas fa-exclamation-circle" /> {err}</p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        {!isPreview && (
          <button type="submit" className="sb-renderer-submit" disabled={submitting}>
            {submitting ? (
              <><i className="fas fa-spinner fa-spin" /> Submitting...</>
            ) : (
              submitText
            )}
          </button>
        )}
        {isPreview && (
          <button type="button" className="sb-renderer-submit" disabled>
            {submitText} (Preview)
          </button>
        )}
      </form>

      {/* Footer */}
      {form.footer_html && (
        <div className="sb-renderer-footer" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.footer_html) }} />
      )}
    </div>
  );
}
