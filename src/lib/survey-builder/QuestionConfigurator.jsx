/**
 * QuestionConfigurator — Settings panel for the selected question.
 * REUSABLE — zero app imports.
 */

import { COMPONENT_TYPES } from './constants';

export default function QuestionConfigurator({ question, onChange }) {
  if (!question) {
    return (
      <div className="sb-configurator sb-configurator-empty">
        <i className="fas fa-mouse-pointer" />
        <p>Select a question to configure</p>
      </div>
    );
  }

  const typeInfo = COMPONENT_TYPES[question.type] || {};

  function update(key, value) {
    onChange({ ...question, [key]: value });
  }

  function updateValidation(key, value) {
    const v = { ...(question.validation || {}), [key]: value };
    onChange({ ...question, validation: v });
  }

  function updateOption(index, value) {
    const opts = [...(question.options || [])];
    opts[index] = value;
    onChange({ ...question, options: opts });
  }

  function addOption() {
    const opts = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
    onChange({ ...question, options: opts });
  }

  function removeOption(index) {
    const opts = [...(question.options || [])];
    opts.splice(index, 1);
    onChange({ ...question, options: opts });
  }

  return (
    <div className="sb-configurator">
      <h3 className="sb-configurator-title">
        <i className={`fas ${typeInfo.icon || 'fa-cog'}`} />
        {typeInfo.label || 'Configure'}
      </h3>

      {/* Label */}
      <div className="sb-config-field">
        <label>Label</label>
        <input
          type="text"
          value={question.label || ''}
          onChange={(e) => update('label', e.target.value)}
        />
      </div>

      {/* Description (not for decorative) */}
      {!typeInfo.isDecorative && (
        <div className="sb-config-field">
          <label>Description</label>
          <input
            type="text"
            value={question.description || ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Help text below the question"
          />
        </div>
      )}

      {/* Placeholder (text & textarea only) */}
      {['text', 'textarea'].includes(question.type) && (
        <div className="sb-config-field">
          <label>Placeholder</label>
          <input
            type="text"
            value={question.placeholder || ''}
            onChange={(e) => update('placeholder', e.target.value)}
          />
        </div>
      )}

      {/* Required toggle (not for decorative) */}
      {!typeInfo.isDecorative && (
        <div className="sb-config-field sb-config-toggle">
          <label>
            <input
              type="checkbox"
              checked={question.required || false}
              onChange={(e) => update('required', e.target.checked)}
            />
            Required
          </label>
        </div>
      )}

      {/* Validation: min/max for star_rating, slider, nps */}
      {['star_rating', 'slider', 'nps'].includes(question.type) && (
        <>
          <div className="sb-config-field sb-config-inline">
            <div>
              <label>Min</label>
              <input
                type="number"
                value={question.validation?.min ?? 0}
                onChange={(e) => updateValidation('min', Number(e.target.value))}
              />
            </div>
            <div>
              <label>Max</label>
              <input
                type="number"
                value={question.validation?.max ?? (question.type === 'nps' ? 10 : 5)}
                onChange={(e) => updateValidation('max', Number(e.target.value))}
              />
            </div>
          </div>
          {question.type === 'slider' && (
            <div className="sb-config-field">
              <label>Step</label>
              <input
                type="number"
                value={question.validation?.step ?? 1}
                onChange={(e) => updateValidation('step', Number(e.target.value))}
                min={1}
              />
            </div>
          )}
        </>
      )}

      {/* Options editor for radio, checkbox, dropdown */}
      {typeInfo.hasOptions && (
        <div className="sb-config-field">
          <label>Options</label>
          <div className="sb-options-list">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="sb-option-row">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                />
                <button
                  type="button"
                  className="sb-option-remove"
                  onClick={() => removeOption(i)}
                  title="Remove option"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
            <button type="button" className="sb-option-add" onClick={addOption}>
              <i className="fas fa-plus" /> Add Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
