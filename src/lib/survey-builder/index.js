/**
 * Survey Builder — Reusable Library (zero app imports).
 *
 * Usage:
 *   import { SurveyBuilder, SurveyRenderer, SurveyStats } from './lib/survey-builder';
 */

export { default as SurveyBuilder } from './SurveyBuilder';
export { default as SurveyRenderer } from './SurveyRenderer';
export { default as SurveyStats } from './SurveyStats';
export { COMPONENT_TYPES, COMPONENT_TYPE_LIST, DEFAULT_SETTINGS } from './constants';
export { validateResponses, slugify, generateQuestionId } from './utils';
