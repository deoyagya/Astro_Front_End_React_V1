/**
 * SurveyStats — Statistics dashboard for survey responses.
 * REUSABLE — zero app imports.
 */

export default function SurveyStats({ stats }) {
  if (!stats) {
    return (
      <div className="sb-stats sb-stats-empty">
        <i className="fas fa-chart-bar" />
        <p>No statistics available</p>
      </div>
    );
  }

  const { total_submissions, question_stats } = stats;

  return (
    <div className="sb-stats">
      <div className="sb-stats-summary">
        <div className="sb-stats-card">
          <span className="sb-stats-number">{total_submissions}</span>
          <span className="sb-stats-label">Total Responses</span>
        </div>
      </div>

      {question_stats && Object.entries(question_stats).map(([qid, qs]) => (
        <div key={qid} className="sb-stats-question">
          <h4>{qs.label} <span className="sb-stats-type">{qs.type}</span></h4>
          <p className="sb-stats-count">{qs.response_count} responses</p>

          {/* Average for numeric types */}
          {qs.average != null && (
            <div className="sb-stats-average">
              <span className="sb-stats-avg-num">{qs.average}</span>
              <span className="sb-stats-avg-label">average</span>
            </div>
          )}

          {/* Distribution bar chart */}
          {qs.distribution && Object.keys(qs.distribution).length > 0 && (
            <div className="sb-stats-dist">
              {Object.entries(qs.distribution)
                .sort((a, b) => b[1] - a[1])
                .map(([choice, count]) => {
                  const pct = qs.response_count > 0
                    ? Math.round((count / qs.response_count) * 100)
                    : 0;
                  return (
                    <div key={choice} className="sb-stats-bar-row">
                      <span className="sb-stats-bar-label">{choice}</span>
                      <div className="sb-stats-bar-track">
                        <div className="sb-stats-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="sb-stats-bar-count">{count} ({pct}%)</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
