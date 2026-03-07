/**
 * WizardResumeModal — "You have an unfinished session" resume prompt.
 */
const CATEGORY_LABELS = {
  A: 'Chart Reading',
  B: 'Compatibility Match',
  C: 'Family Harmony',
  D: 'Auspicious Timing',
  E: 'Quick Answer',
  F: 'Annual Forecast',
};

export default function WizardResumeModal({ session, onResume, onDiscard, onNewSession }) {
  if (!session) return null;

  const label = CATEGORY_LABELS[session.consultation_category] || session.consultation_category;
  const pct = Math.round((session.current_step / session.total_steps) * 100);

  return (
    <div className="wiz-resume-overlay">
      <div className="wiz-resume-modal">
        <h3><i className="fas fa-undo"></i> Unfinished Session</h3>
        <p>
          You have an in-progress <strong>{label}</strong> session
          ({pct}% complete, step {session.current_step} of {session.total_steps}).
        </p>
        <div className="wiz-resume-actions">
          <button className="wiz-btn wiz-btn-next" onClick={() => onResume(session.session_id)}>
            <i className="fas fa-play"></i> Resume
          </button>
          <button className="wiz-btn wiz-btn-prev" onClick={onNewSession}>
            <i className="fas fa-plus"></i> New Session
          </button>
          <button className="wiz-btn wiz-btn-danger" onClick={() => onDiscard(session.session_id)}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
