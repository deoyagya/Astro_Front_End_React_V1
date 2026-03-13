/**
 * ChartWizardPage — Main wizard page.
 * Dispatches to the correct step component based on category + step number.
 */
import '../styles/wizard.css';
import PageShell from '../components/PageShell';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

import WizardStepper from '../components/wizard/WizardStepper';
import WizardNavigation from '../components/wizard/WizardNavigation';
import WizardResumeModal from '../components/wizard/WizardResumeModal';
import CategorySelector from '../components/wizard/CategorySelector';
import StepQuestion from '../components/wizard/StepQuestion';
import StepBirthDetails from '../components/wizard/StepBirthDetails';
import StepAscendant from '../components/wizard/StepAscendant';
import StepPlanetsD1 from '../components/wizard/StepPlanetsD1';
import StepPlanetConditions from '../components/wizard/StepPlanetConditions';
import StepMoonNakshatra from '../components/wizard/StepMoonNakshatra';
import StepDivisionalChart from '../components/wizard/StepDivisionalChart';
import StepDasha from '../components/wizard/StepDasha';
import StepTransits from '../components/wizard/StepTransits';
import StepEventConfig from '../components/wizard/StepEventConfig';
import StepPrashnaQuestion from '../components/wizard/StepPrashnaQuestion';
import StepAnnualChart from '../components/wizard/StepAnnualChart';
import StepMunthaLord from '../components/wizard/StepMunthaLord';
import StepReview from '../components/wizard/StepReview';
import RuleValidationBadge from '../components/wizard/RuleValidationBadge';


/**
 * Maps step_key → React component for step rendering.
 * Person-indexed keys like "p0_birth" alias to their base form.
 */
const STEP_COMPONENTS = {
  cat_select: 'category',
  question: 'question',
  event_question: 'event_config',
  prashna_question: 'prashna_question',
  birth: 'birth',
  opt_birth: 'birth',
  ascendant: 'ascendant',
  planets_d1: 'planets_d1',
  conditions: 'conditions',
  nakshatra: 'nakshatra',
  opt_nakshatra: 'nakshatra',
  divisional: 'divisional',
  dasha: 'dasha',
  both_dasha: 'dasha',
  transits: 'transits',
  event_location: 'event_config',
  prashna_location: 'prashna_question',
  annual_year: 'annual_year',
  annual_chart: 'annual_chart',
  muntha_lord: 'muntha_lord',
  review: 'review',
  // Person-indexed aliases resolved dynamically
};

function resolveStepType(stepKey) {
  if (STEP_COMPONENTS[stepKey]) return STEP_COMPONENTS[stepKey];
  // Person-indexed: p0_birth, p1_ascendant, etc.
  const match = stepKey.match(/^p\d+_(.+)$/);
  if (match) return STEP_COMPONENTS[match[1]] || match[1];
  return stepKey;
}

function getPersonLabel(stepKey, category) {
  const match = stepKey.match(/^p(\d+)_/);
  if (!match) return null;
  const idx = Number(match[1]);
  if (category === 'B') {
    return idx === 0 ? 'Person 1' : 'Person 2';
  }
  return `Person ${idx + 1}`;
}

export default function ChartWizardPage() {
  const { user } = useAuth();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [category, setCategory] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepConfig, setStepConfig] = useState(null);
  const [stepData, setStepData] = useState({});       // accumulated step_data
  const [currentFormData, setCurrentFormData] = useState({});
  const [rulesStatus, setRulesStatus] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [stepContent, setStepContent] = useState(null);

  // UI state
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeSession, setResumeSession] = useState(null);
  const [showResume, setShowResume] = useState(false);

  const [allInProgress, setAllInProgress] = useState([]);

  // Fetch in-progress sessions and show resume popup if any exist
  const checkInProgressSessions = useCallback(async () => {
    try {
      const sessions = await api.get('/v1/wizard/sessions?status=in_progress');
      if (Array.isArray(sessions) && sessions.length > 0) {
        setAllInProgress(sessions);
        setResumeSession(sessions[0]);
        setShowResume(true);
      } else {
        setAllInProgress([]);
        setResumeSession(null);
        setShowResume(false);
      }
    } catch { /* ignore */ }
  }, []);

  // Check for in-progress sessions on mount
  useEffect(() => { checkInProgressSessions(); }, [checkInProgressSessions]);

  // Fetch step content when step changes
  useEffect(() => {
    if (!sessionId || currentStep === 0) return;
    api.get(`/v1/wizard/${sessionId}/step/${currentStep}/content`)
      .then(setStepContent)
      .catch(() => setStepContent(null));
  }, [sessionId, currentStep]);

  // --- Category selection (Step 0) ---
  const handleCategorySelect = useCallback(async (cat) => {
    setError(null);
    setCategory(cat);
    try {
      const result = await api.post('/v1/wizard/start', { consultation_category: cat });
      setSessionId(result.session_id);
      setTotalSteps(result.total_steps);
      setStepData({});
      setCurrentFormData({});
      // Save step 0 (category) and advance to step 1 to get the correct step 1 config
      const step0Result = await api.put(
        `/v1/wizard/${result.session_id}/step/0`,
        { step_data: { category: cat } },
      );
      setCurrentStep(step0Result.current_step);
      setStepConfig(step0Result.next_step_config);
      setRulesStatus(step0Result.rules_status);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // --- Resume existing session ---
  const handleResume = useCallback(async (sid) => {
    setShowResume(false);
    setError(null);
    try {
      const detail = await api.get(`/v1/wizard/${sid}`);
      setSessionId(detail.session_id);
      setCategory(detail.consultation_category);
      setTotalSteps(detail.total_steps);
      setCurrentStep(detail.current_step);
      setStepConfig(detail.step_config);
      setStepData(detail.step_data || {});
      setRulesStatus(detail.rules_validated);
      setInterpretation(detail.interpretation_result);
      // Load current step's saved data if any
      const savedKey = `step_${detail.current_step}`;
      setCurrentFormData(detail.step_data?.[savedKey] || {});
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // --- Discard ALL in-progress sessions ---
  const handleDiscard = useCallback(async () => {
    // Fetch fresh list to avoid stale closure issues, then abandon all
    try {
      const sessions = await api.get('/v1/wizard/sessions?status=in_progress');
      if (Array.isArray(sessions)) {
        await Promise.allSettled(
          sessions.map((s) => api.del(`/v1/wizard/${s.session_id}`).catch(() => {})),
        );
      }
    } catch { /* ignore */ }
    setAllInProgress([]);
    setResumeSession(null);
    setShowResume(false);
  }, []);

  // --- Save step & advance ---
  const handleNext = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const result = await api.put(
        `/v1/wizard/${sessionId}/step/${currentStep}`,
        { step_data: currentFormData },
      );
      if (!result.valid && result.errors?.length > 0) {
        setError(result.errors.join(', '));
        return;
      }
      // Store step data locally
      setStepData((prev) => ({ ...prev, [`step_${currentStep}`]: currentFormData }));
      setCurrentStep(result.current_step);
      setStepConfig(result.next_step_config);
      setRulesStatus(result.rules_status);
      // Load saved data for next step if resuming
      const nextKey = `step_${result.current_step}`;
      setCurrentFormData(stepData[nextKey] || {});
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId, currentStep, currentFormData, stepData]);

  // --- Go back ---
  const handlePrev = useCallback(() => {
    if (currentStep <= 1) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    setCurrentFormData(stepData[`step_${prevStep}`] || {});
    setError(null);
  }, [currentStep, stepData]);

  // --- Save & exit ---
  const handleSave = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.put(
        `/v1/wizard/${sessionId}/step/${currentStep}`,
        { step_data: currentFormData },
      );
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId, currentStep, currentFormData]);

  // --- Submit for interpretation ---
  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      // Save current step first
      await api.put(
        `/v1/wizard/${sessionId}/step/${currentStep}`,
        { step_data: currentFormData },
      );
      // Then submit
      const result = await api.postLong(`/v1/wizard/${sessionId}/submit`, {});
      setInterpretation(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, currentStep, currentFormData]);

  // --- Abandon session ---
  const handleAbandon = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.del(`/v1/wizard/${sessionId}`);
      // Reset to start
      setSessionId(null);
      setCategory(null);
      setCurrentStep(0);
      setStepData({});
      setCurrentFormData({});
      setInterpretation(null);
      setRulesStatus(null);
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId]);

  // --- Render the correct step component ---
  const renderStep = () => {
    if (currentStep === 0 || !category) {
      return <CategorySelector onSelect={handleCategorySelect} selectedCategory={category} />;
    }

    const stepKey = stepConfig?.step_key || '';
    const stepType = resolveStepType(stepKey);
    const personLabel = getPersonLabel(stepKey, category);

    const commonProps = {
      data: currentFormData,
      onChange: setCurrentFormData,
      content: stepContent,
      personLabel,
    };

    switch (stepType) {
      case 'category':
        return <CategorySelector onSelect={handleCategorySelect} selectedCategory={category} />;
      case 'question':
        return <StepQuestion {...commonProps} />;
      case 'birth':
        return <StepBirthDetails {...commonProps} />;
      case 'ascendant':
        return <StepAscendant {...commonProps} />;
      case 'planets_d1':
        return <StepPlanetsD1 {...commonProps} />;
      case 'conditions':
        return <StepPlanetConditions {...commonProps} />;
      case 'nakshatra':
        return <StepMoonNakshatra {...commonProps} />;
      case 'divisional':
      case 'navamsa':
        return <StepDivisionalChart {...commonProps} chartType={stepConfig?.chart_type || 'D9'} />;
      case 'dasha':
        return <StepDasha {...commonProps} />;
      case 'transits':
        return <StepTransits {...commonProps} />;
      case 'event_config':
        return <StepEventConfig {...commonProps} />;
      case 'prashna_question':
        return <StepPrashnaQuestion {...commonProps} />;
      case 'annual_year':
        return (
          <div className="wiz-step">
            <div className="wiz-step-header">
              <h2>Select Year for Annual Forecast</h2>
              <p>Which year do you want the Varshaphal (solar return) analysis for?</p>
            </div>
            <div className="wiz-field">
              <label className="wiz-label">Year <span className="required">*</span></label>
              <input
                type="number"
                className="wiz-input"
                placeholder="e.g., 2026"
                min={1950}
                max={2100}
                value={currentFormData.year || ''}
                onChange={(e) => setCurrentFormData({ ...currentFormData, year: Number(e.target.value) })}
              />
            </div>
          </div>
        );
      case 'annual_chart':
        return <StepAnnualChart {...commonProps} />;
      case 'muntha_lord':
        return <StepMunthaLord {...commonProps} />;
      case 'review':
        return (
          <StepReview
            stepData={stepData}
            rulesStatus={rulesStatus}
            interpretation={interpretation}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <div className="wiz-step">
            <div className="wiz-step-header">
              <h2>Step {currentStep}</h2>
              <p>Step type: {stepKey}</p>
            </div>
          </div>
        );
    }
  };

  const isReviewStep = stepConfig?.step_key === 'review' || resolveStepType(stepConfig?.step_key || '') === 'review';

  return (
    <PageShell active="wizard">
      <div className="wiz-page">
        <h1 className="wiz-page-title">
          <i className="fas fa-magic"></i> Chart Reading Wizard
        </h1>
        <p className="wiz-page-subtitle">
          Enter your chart data step by step — we'll build your reading as you go.
        </p>

        {showResume && (
          <WizardResumeModal
            session={resumeSession}
            onResume={handleResume}
            onDiscard={handleDiscard}
            onNewSession={() => setShowResume(false)}
          />
        )}

        {sessionId && totalSteps > 0 && (
          <WizardStepper
            totalSteps={totalSteps}
            currentStep={currentStep}
            onStepClick={(step) => {
              if (step < currentStep) {
                setCurrentStep(step);
                setCurrentFormData(stepData[`step_${step}`] || {});
              }
            }}
          />
        )}

        {error && <div className="wiz-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        {rulesStatus && currentStep > 1 && !isReviewStep && (
          <RuleValidationBadge rulesStatus={rulesStatus} />
        )}

        {renderStep()}

        {sessionId && currentStep > 0 && (
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            isFirstStep={currentStep <= 1}
            isLastStep={isReviewStep}
            isSubmitting={isSubmitting}
            canProceed={true}
            onPrev={handlePrev}
            onNext={handleNext}
            onSave={handleSave}
            onSubmit={handleSubmit}
            onAbandon={handleAbandon}
          />
        )}
      </div>
    </PageShell>
  );
}
