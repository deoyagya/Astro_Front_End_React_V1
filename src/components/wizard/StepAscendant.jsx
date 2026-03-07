/**
 * StepAscendant — 12-sign visual grid selector for Lagna (Ascendant).
 */
import { SIGN_NAMES } from '../../utils/jyotish';
import ChartVisualAid from './ChartVisualAid';

const SIGN_LIST = Object.entries(SIGN_NAMES).map(([num, name]) => ({ num: Number(num), name }));

export default function StepAscendant({ data, onChange, content, personLabel }) {
  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Ascendant (Lagna)</h2>
        <p>Select the rising sign from your birth chart. This is usually shown at the top of a North Indian chart.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-sign-grid">
        {SIGN_LIST.map((sign) => (
          <button
            key={sign.num}
            type="button"
            className={`wiz-sign-btn${data.asc_sign === sign.name ? ' selected' : ''}`}
            onClick={() => onChange({ ...data, asc_sign: sign.name })}
          >
            {sign.name}
          </button>
        ))}
      </div>
      {data.asc_sign && (
        <div style={{ marginTop: '0.75rem', textAlign: 'center', color: '#7b5bff', fontSize: '0.9rem' }}>
          <i className="fas fa-check-circle"></i> {data.asc_sign} Rising
        </div>
      )}
    </div>
  );
}
