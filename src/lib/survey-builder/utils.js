/**
 * Survey Builder Utilities — REUSABLE (zero app imports).
 */

let _counter = 0;

export function generateQuestionId() {
  _counter += 1;
  return `q_${Date.now().toString(36)}_${_counter}`;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'survey';
}

/**
 * Validate responses against question schema.
 * Returns array of error strings (empty = valid).
 */
export function validateResponses(questions, responses) {
  const errors = [];

  for (const q of questions) {
    if (q.type === 'section_header' || q.type === 'paragraph') continue;

    const answer = responses[q.id];

    if (q.required) {
      if (answer == null || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
        errors.push(`"${q.label}" is required`);
        continue;
      }
    }

    if (answer == null || answer === '') continue;

    // Numeric range check
    if (['star_rating', 'nps', 'slider'].includes(q.type)) {
      const num = Number(answer);
      if (isNaN(num)) {
        errors.push(`"${q.label}" must be a number`);
        continue;
      }
      const { min, max } = q.validation || {};
      if (min != null && num < min) errors.push(`"${q.label}" must be at least ${min}`);
      if (max != null && num > max) errors.push(`"${q.label}" must be at most ${max}`);
    }

    if (q.type === 'checkbox' && !Array.isArray(answer)) {
      errors.push(`"${q.label}" must be a list`);
    }
  }

  return errors;
}
