/**
 * WizardNavigation — Prev / Next / Save & Exit / Submit buttons.
 */
export default function WizardNavigation({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  isSubmitting,
  canProceed = true,
  onPrev,
  onNext,
  onSave,
  onSubmit,
  onAbandon,
}) {
  return (
    <div className="wiz-nav">
      <div className="wiz-nav-left">
        {!isFirstStep && (
          <button className="wiz-btn wiz-btn-prev" onClick={onPrev} disabled={isSubmitting}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
        )}
        {onSave && (
          <button className="wiz-btn wiz-btn-save" onClick={onSave} disabled={isSubmitting}>
            <i className="fas fa-save"></i> Save &amp; Exit
          </button>
        )}
        {onAbandon && (
          <button className="wiz-btn wiz-btn-danger" onClick={onAbandon} disabled={isSubmitting}>
            <i className="fas fa-trash-alt"></i> Discard
          </button>
        )}
      </div>
      <div className="wiz-nav-right">
        {isLastStep ? (
          <button
            className="wiz-btn wiz-btn-submit"
            onClick={onSubmit}
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? (
              <><i className="fas fa-spinner fa-spin"></i> Analyzing...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Submit for Reading</>
            )}
          </button>
        ) : (
          <button
            className="wiz-btn wiz-btn-next"
            onClick={onNext}
            disabled={isSubmitting || !canProceed}
          >
            Next <i className="fas fa-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
}
