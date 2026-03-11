/**
 * Survey Builder Constants — REUSABLE (zero app imports).
 *
 * Component type registry and default settings for the form builder.
 */

export const COMPONENT_TYPES = {
  text:           { label: 'Text Input',     icon: 'fa-font',           hasOptions: false },
  textarea:       { label: 'Text Area',      icon: 'fa-align-left',     hasOptions: false },
  star_rating:    { label: 'Star Rating',    icon: 'fa-star',           hasOptions: false },
  slider:         { label: 'Slider',         icon: 'fa-sliders-h',      hasOptions: false },
  radio:          { label: 'Radio Buttons',  icon: 'fa-dot-circle',     hasOptions: true },
  checkbox:       { label: 'Checkboxes',     icon: 'fa-check-square',   hasOptions: true },
  dropdown:       { label: 'Dropdown',       icon: 'fa-caret-down',     hasOptions: true },
  nps:            { label: 'NPS Score',      icon: 'fa-tachometer-alt', hasOptions: false },
  section_header: { label: 'Section Header', icon: 'fa-heading',        hasOptions: false, isDecorative: true },
  paragraph:      { label: 'Paragraph',      icon: 'fa-paragraph',      hasOptions: false, isDecorative: true },
};

export const COMPONENT_TYPE_LIST = Object.entries(COMPONENT_TYPES).map(
  ([key, val]) => ({ key, ...val })
);

export const DEFAULT_QUESTION = {
  text:           { label: 'Text Question',   placeholder: 'Enter your answer', required: false },
  textarea:       { label: 'Long Text',       placeholder: 'Write your response...', required: false },
  star_rating:    { label: 'Rate us',         required: false, validation: { min: 1, max: 5 } },
  slider:         { label: 'Scale',           required: false, validation: { min: 0, max: 100, step: 1 } },
  radio:          { label: 'Choose one',      required: false, options: ['Option 1', 'Option 2', 'Option 3'] },
  checkbox:       { label: 'Select all',      required: false, options: ['Option A', 'Option B', 'Option C'] },
  dropdown:       { label: 'Select',          required: false, options: ['Choice 1', 'Choice 2', 'Choice 3'] },
  nps:            { label: 'How likely to recommend?', required: false, validation: { min: 0, max: 10 } },
  section_header: { label: 'Section Title' },
  paragraph:      { label: 'Instructions or additional information here.' },
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  submit_text: 'Submit',
  thank_you_message: 'Thank you for your feedback!',
  show_progress: false,
};
