/**
 * ChartModal — Full-screen modal for viewing D1 and divisional charts.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   onClose      — callback to close modal
 *   chartBundle  — full chart/create API response (with vargas)
 */

import { useEffect } from 'react';
import VedicChart from './chart/VedicChart';

export default function ChartModal({ isOpen, onClose, chartBundle }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !chartBundle) return null;

  return (
    <div className="chart-modal-overlay" onClick={onClose}>
      <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chart-modal-header">
          <div className="chart-modal-title">
            <i className="fas fa-chart-pie"></i>
            <h2>Vedic Chart</h2>
          </div>
          <button className="chart-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Chart via unified VedicChart component */}
        <div className="chart-modal-body">
          <VedicChart
            chartBundle={chartBundle}
            showControls={true}
            showChartSelector={true}
            showStyleToggle={true}
            showAscendant={true}
          />
        </div>
      </div>
    </div>
  );
}
