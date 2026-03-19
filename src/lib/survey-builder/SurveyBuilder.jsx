/**
 * SurveyBuilder — Main drag-and-drop form builder.
 * REUSABLE — zero app imports. All API functions injected via props.
 *
 * Props:
 *   apiCreate(data)       — POST new survey
 *   apiUpdate(id, data)   — PUT update survey
 *   apiGet(id)            — GET survey by ID
 *   apiPublish(id)        — POST publish survey
 *   formId                — UUID string (null for create mode)
 *   onSaved(form)         — callback after save
 *   onPublished(form)     — callback after publish
 */

import { useState, useReducer, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ComponentCabinet from './ComponentCabinet';
import DropZone from './DropZone';
import QuestionConfigurator from './QuestionConfigurator';
import SurveyRenderer from './SurveyRenderer';
import { DEFAULT_QUESTION, DEFAULT_SETTINGS, COMPONENT_TYPES } from './constants';
import { generateQuestionId, slugify } from './utils';

/* ---- Reducer ---- */
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FORM':
      return { ...state, ...action.payload };
    case 'SET_META':
      return { ...state, [action.key]: action.value };
    case 'ADD_QUESTION': {
      const newQ = {
        id: generateQuestionId(),
        type: action.questionType,
        ...(DEFAULT_QUESTION[action.questionType] || { label: 'Question' }),
        description: '',
        display_order: state.questions.length,
      };
      return { ...state, questions: [...state.questions, newQ] };
    }
    case 'REMOVE_QUESTION':
      return { ...state, questions: state.questions.filter((q) => q.id !== action.id) };
    case 'REORDER':
      return { ...state, questions: action.questions };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.question.id ? action.question : q
        ),
      };
    default:
      return state;
  }
}

const INITIAL_STATE = {
  title: '',
  slug: '',
  description: '',
  header_html: '',
  footer_html: '',
  questions: [],
  settings: { ...DEFAULT_SETTINGS },
};

export default function SurveyBuilder({
  apiCreate, apiUpdate, apiGet, apiPublish,
  formId = null, onSaved, onPublished,
}) {
  const [form, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedFormId, setSavedFormId] = useState(formId);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(formId));

  // Load existing form in edit mode
  useEffect(() => {
    if (!formId || !apiGet) return;
    setLoading(true);
    apiGet(formId)
      .then((data) => {
        dispatch({ type: 'SET_FORM', payload: {
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          header_html: data.header_html || '',
          footer_html: data.footer_html || '',
          questions: data.questions || [],
          settings: data.settings || { ...DEFAULT_SETTINGS },
        }});
        setSavedFormId(data.id);
        setSlugTouched(Boolean(data.slug));
      })
      .catch(() => showToast('Failed to load survey'))
      .finally(() => setLoading(false));
  }, [formId, apiGet]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  useEffect(() => {
    if (slugTouched) return;
    dispatch({ type: 'SET_META', key: 'slug', value: slugify(form.title || '') });
  }, [form.title, slugTouched]);

  /* ---- Drag Handlers ---- */
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    // From cabinet → dropzone
    if (active.data?.current?.fromCabinet && over.id === 'dropzone') {
      dispatch({ type: 'ADD_QUESTION', questionType: active.data.current.type });
      return;
    }

    // Reorder within dropzone
    if (!active.data?.current?.fromCabinet && over.id !== active.id) {
      const oldIdx = form.questions.findIndex((q) => q.id === active.id);
      const newIdx = form.questions.findIndex((q) => q.id === over.id);
      if (oldIdx >= 0 && newIdx >= 0) {
        dispatch({ type: 'REORDER', questions: arrayMove(form.questions, oldIdx, newIdx) });
      }
    }
  }

  /* ---- Save ---- */
  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      showToast('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        description: form.description,
        header_html: form.header_html,
        footer_html: form.footer_html,
        questions: form.questions,
        settings: form.settings,
      };
      let result;
      if (savedFormId) {
        result = await apiUpdate(savedFormId, payload);
      } else {
        result = await apiCreate(payload);
        if (result.id) setSavedFormId(result.id);
        if (result.slug) dispatch({ type: 'SET_META', key: 'slug', value: result.slug });
      }
      showToast('Survey saved');
      onSaved?.(result);
    } catch {
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  }, [form, savedFormId, apiCreate, apiUpdate, onSaved]);

  /* ---- Publish ---- */
  const handlePublish = useCallback(async () => {
    if (!savedFormId) {
      showToast('Save first before publishing');
      return;
    }
    setPublishing(true);
    try {
      const result = await apiPublish(savedFormId);
      showToast('Survey is now live!');
      onPublished?.(result);
    } catch {
      showToast('Publish failed');
    } finally {
      setPublishing(false);
    }
  }, [savedFormId, apiPublish, onPublished]);

  const selectedQuestion = form.questions.find((q) => q.id === selectedId) || null;

  if (loading) {
    return (
      <div className="sb-builder sb-loading">
        <i className="fas fa-spinner fa-spin" /> Loading survey...
      </div>
    );
  }

  return (
    <div className="sb-builder">
      {/* Header Bar */}
      <div className="sb-builder-header">
        <div className="sb-builder-title-group">
          <input
            className="sb-title-input"
            type="text"
            placeholder="Survey Title"
            aria-label="Survey Title"
            value={form.title}
            onChange={(e) => dispatch({ type: 'SET_META', key: 'title', value: e.target.value })}
          />
          <input
            className="sb-slug-input"
            type="text"
            placeholder="url-slug (auto-generated)"
            aria-label="Survey Slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              dispatch({ type: 'SET_META', key: 'slug', value: e.target.value });
            }}
          />
        </div>
        <div className="sb-builder-actions">
          <button className="sb-btn sb-btn-secondary" onClick={() => setShowPreview(true)}>
            <i className="fas fa-eye" /> Preview
          </button>
          <button className="sb-btn sb-btn-primary" onClick={handleSave} disabled={saving}>
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="sb-btn sb-btn-success" onClick={handlePublish} disabled={publishing || !savedFormId}>
            <i className={`fas ${publishing ? 'fa-spinner fa-spin' : 'fa-rocket'}`} />
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Description & Header/Footer */}
      <div className="sb-meta-fields">
        <input
          className="sb-meta-input"
          type="text"
          placeholder="Description (optional)"
          aria-label="Survey Description"
          value={form.description}
          onChange={(e) => dispatch({ type: 'SET_META', key: 'description', value: e.target.value })}
        />
        <div className="sb-settings-grid">
          <div className="sb-settings-card">
            <h4 className="sb-settings-title">
              <i className="fas fa-sliders-h" /> Form Experience
            </h4>
            <div className="sb-settings-fields">
              <label className="sb-settings-field">
                <span>Submit Button Text</span>
                <input
                  type="text"
                  placeholder="Submit"
                  aria-label="Submit Button Text"
                  value={form.settings?.submit_text || ''}
                  onChange={(e) => dispatch({
                    type: 'SET_META',
                    key: 'settings',
                    value: { ...form.settings, submit_text: e.target.value },
                  })}
                />
              </label>
              <label className="sb-settings-field">
                <span>Thank You Message</span>
                <textarea
                  rows={3}
                  placeholder="Thank you for your feedback!"
                  aria-label="Thank You Message"
                  value={form.settings?.thank_you_message || ''}
                  onChange={(e) => dispatch({
                    type: 'SET_META',
                    key: 'settings',
                    value: { ...form.settings, thank_you_message: e.target.value },
                  })}
                />
              </label>
              <label className="sb-settings-toggle">
                <input
                  type="checkbox"
                  aria-label="Show Progress Indicator"
                  checked={Boolean(form.settings?.show_progress)}
                  onChange={(e) => dispatch({
                    type: 'SET_META',
                    key: 'settings',
                    value: { ...form.settings, show_progress: e.target.checked },
                  })}
                />
                <span>Show progress indicator on the public survey</span>
              </label>
            </div>
          </div>

          <div className="sb-settings-card">
            <h4 className="sb-settings-title">
              <i className="fas fa-window-maximize" /> Intro and Outro Content
            </h4>
            <div className="sb-settings-fields">
              <label className="sb-settings-field">
                <span>Header HTML</span>
                <textarea
                  rows={5}
                  placeholder="<p>Welcome message shown above the survey</p>"
                  aria-label="Header HTML"
                  value={form.header_html || ''}
                  onChange={(e) => dispatch({ type: 'SET_META', key: 'header_html', value: e.target.value })}
                />
              </label>
              <label className="sb-settings-field">
                <span>Footer HTML</span>
                <textarea
                  rows={5}
                  placeholder="<p>Closing note shown below the survey</p>"
                  aria-label="Footer HTML"
                  value={form.footer_html || ''}
                  onChange={(e) => dispatch({ type: 'SET_META', key: 'footer_html', value: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
        <div className="sb-builder-body">
          <ComponentCabinet />
          <DropZone
            questions={form.questions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={(id) => {
              dispatch({ type: 'REMOVE_QUESTION', id });
              if (selectedId === id) setSelectedId(null);
            }}
          />
          <QuestionConfigurator
            question={selectedQuestion}
            onChange={(q) => dispatch({ type: 'UPDATE_QUESTION', question: q })}
          />
        </div>
      </DndContext>

      {/* Toast */}
      {toast && <div className="sb-toast">{toast}</div>}

      {/* Preview Modal */}
      {showPreview && (
        <div className="sb-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="sb-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-preview-header">
              <h3><i className="fas fa-eye" /> Preview</h3>
              <button onClick={() => setShowPreview(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="sb-preview-body">
              <SurveyRenderer formData={form} isPreview={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
