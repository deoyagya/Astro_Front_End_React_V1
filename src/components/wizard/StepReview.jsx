/**
 * StepReview — Summary of all entered data + submit button + interpretation display.
 */
import RuleValidationBadge from './RuleValidationBadge';

export default function StepReview({ stepData, rulesStatus, interpretation, isSubmitting }) {
  // stepData is the accumulated step_data from the session

  const renderEntry = (label, value) => {
    if (!value) return null;
    return (
      <>
        <div className="wiz-review-label">{label}</div>
        <div className="wiz-review-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
      </>
    );
  };

  // Extract key data from step entries
  const entries = [];
  if (stepData) {
    Object.entries(stepData).forEach(([stepKey, data]) => {
      if (!data || typeof data !== 'object') return;
      const stepNum = stepKey.replace('step_', '');
      Object.entries(data).forEach(([field, val]) => {
        if (val && field !== 'category') {
          entries.push({ label: `Step ${stepNum}: ${field}`, value: val });
        }
      });
    });
  }

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>Review &amp; Submit</h2>
        <p>Review your chart data before submitting for AI interpretation.</p>
      </div>

      <RuleValidationBadge rulesStatus={rulesStatus} />

      {entries.length > 0 && (
        <div className="wiz-review-section">
          <h3><i className="fas fa-clipboard-list"></i> Data Summary</h3>
          <div className="wiz-review-grid">
            {entries.slice(0, 30).map((e, i) => (
              <React.Fragment key={i}>
                {renderEntry(e.label, e.value)}
              </React.Fragment>
            ))}
          </div>
          {entries.length > 30 && (
            <div className="wiz-hint" style={{ marginTop: '0.5rem' }}>
              + {entries.length - 30} more fields
            </div>
          )}
        </div>
      )}

      {isSubmitting && (
        <div className="wiz-processing">
          <div className="wiz-processing-spinner"></div>
          <div className="wiz-processing-text">
            Analyzing your chart data... This may take 20-30 seconds.
          </div>
        </div>
      )}

      {interpretation && !isSubmitting && (
        <div className="wiz-interpretation">
          <h3><i className="fas fa-star"></i> Your Reading</h3>
          {interpretation.interpretation && (
            <div className="wiz-interpretation-text">{interpretation.interpretation}</div>
          )}
          {interpretation.summary && (
            <div className="wiz-interpretation-text">{interpretation.summary}</div>
          )}
          {interpretation.error && (
            <div className="wiz-error">{interpretation.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
