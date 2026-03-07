/**
 * RuleValidationBadge — Displays rule match/pending badges after step save.
 */
export default function RuleValidationBadge({ rulesStatus }) {
  if (!rulesStatus) return null;

  const { rules_evaluable = 0, rules_matched = 0, rules_pending = 0 } = rulesStatus;
  if (rules_evaluable === 0) return null;

  return (
    <div className="wiz-rule-badges">
      {rules_matched > 0 && (
        <span className="wiz-rule-badge matched">
          <i className="fas fa-check-circle"></i> {rules_matched} rule{rules_matched !== 1 ? 's' : ''} matched
        </span>
      )}
      {rules_pending > 0 && (
        <span className="wiz-rule-badge pending">
          <i className="fas fa-hourglass-half"></i> {rules_pending} pending
        </span>
      )}
    </div>
  );
}
