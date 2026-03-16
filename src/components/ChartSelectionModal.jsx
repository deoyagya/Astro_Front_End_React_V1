import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import usePaymentGateway from '../hooks/usePaymentGateway';
import EmbeddedCheckoutModal from './EmbeddedCheckoutModal';
import RazorpayCheckoutModal from './RazorpayCheckoutModal';
import '../styles/chart-selection-modal.css';

export default function ChartSelectionModal({
  isOpen,
  onClose,
  reportSlug,
  reportName,
  reportPrice,
  reportIcon,
}) {
  const gw = usePaymentGateway();
  const [charts, setCharts] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [chartError, setChartError] = useState('');
  const [selectedChartIds, setSelectedChartIds] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState(null);

  const loadCharts = useCallback(async () => {
    setLoadingCharts(true);
    setChartError('');
    try {
      const response = await api.get('/v1/charts/saved?limit=50');
      setCharts(response.charts || []);
    } catch (err) {
      setChartError(err.message || 'Failed to load saved charts.');
    } finally {
      setLoadingCharts(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedChartIds([]);
      setOrderError('');
      setClientSecret('');
      setRazorpayOrder(null);
      return;
    }
    loadCharts();
  }, [isOpen, loadCharts]);

  const toggleChart = useCallback((chartId) => {
    setSelectedChartIds((current) => (
      current.includes(chartId)
        ? current.filter((id) => id !== chartId)
        : [...current, chartId]
    ));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedChartIds((current) => (
      current.length === charts.length ? [] : charts.map((chart) => chart.id)
    ));
  }, [charts]);

  const totalCharts = selectedChartIds.length;
  const totalCents = totalCharts * reportPrice;
  const unitDisplay = useMemo(() => `$${(reportPrice / 100).toFixed(2)}`, [reportPrice]);
  const totalDisplay = useMemo(() => `$${(totalCents / 100).toFixed(2)}`, [totalCents]);

  const handleProceedToPay = useCallback(async () => {
    if (!selectedChartIds.length) {
      setOrderError('Please select at least one saved chart.');
      return;
    }

    setCreatingOrder(true);
    setOrderError('');

    try {
      const items = selectedChartIds.map((chartId) => {
        const selectedChart = charts.find((chart) => chart.id === chartId);
        const chartName = selectedChart?.birth_data?.name || 'Saved Chart';
        return {
          id: reportSlug,
          name: `${reportName} - ${chartName}`,
          price: reportPrice,
          chart_id: chartId,
        };
      });

      localStorage.setItem('cart', JSON.stringify(items));
      localStorage.setItem('cart_ids', JSON.stringify(items.map((item) => item.id)));

      const orderData = await api.postLong('/v1/payment/create-order', {
        amount: totalCents,
        currency: gw.currency || 'USD',
        gateway: gw.gateway || undefined,
        items,
        receipt: `astroyagya_order_${Date.now()}`,
      });

      if (orderData.gateway === 'razorpay' && orderData.order_id) {
        setRazorpayOrder(orderData);
        return;
      }

      if (orderData.client_secret) {
        setClientSecret(orderData.client_secret);
        return;
      }

      setOrderError('Unable to start checkout. Please try again.');
    } catch (err) {
      setOrderError(err.message || 'Unable to process your order right now.');
    } finally {
      setCreatingOrder(false);
    }
  }, [charts, gw.currency, gw.gateway, reportName, reportPrice, reportSlug, selectedChartIds, totalCents]);

  const handleClose = useCallback(() => {
    if (!creatingOrder) onClose();
  }, [creatingOrder, onClose]);

  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) handleClose();
  }, [handleClose]);

  if (!isOpen) return null;

  if (clientSecret) {
    return (
      <EmbeddedCheckoutModal
        clientSecret={clientSecret}
        onClose={() => {
          setClientSecret('');
          onClose();
        }}
      />
    );
  }

  if (razorpayOrder) {
    return (
      <RazorpayCheckoutModal
        orderId={razorpayOrder.order_id}
        amount={razorpayOrder.amount}
        currency={razorpayOrder.currency}
        razorpayKeyId={razorpayOrder.razorpay_key_id}
        onSuccess={(result) => {
          setRazorpayOrder(null);
          if (result.verified) {
            window.location.href = '/checkout/return?payment=success&gateway=razorpay';
          } else {
            setOrderError('Payment verification failed. Please contact support.');
          }
        }}
        onClose={() => setRazorpayOrder(null)}
      />
    );
  }

  return (
    <div className="csm-overlay" onClick={handleOverlayClick}>
      <div className="csm-modal" role="dialog" aria-modal="true" aria-labelledby="chart-selection-heading">
        <div className="csm-header">
          <div className="csm-header-info">
            <i className={`fas ${reportIcon}`} aria-hidden="true"></i>
            <div>
              <h3 id="chart-selection-heading">Select Saved Charts</h3>
              <p className="csm-report-name">{reportName} · {unitDisplay} per chart</p>
            </div>
          </div>
          <button className="csm-close-btn" onClick={handleClose} aria-label="Close">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="csm-body">
          {loadingCharts ? (
            <div className="csm-loading">
              <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
              <p>Loading your saved charts...</p>
            </div>
          ) : chartError ? (
            <div className="csm-error">
              <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
              <p>{chartError}</p>
              <button className="csm-btn-retry" onClick={loadCharts}>
                Retry
              </button>
            </div>
          ) : charts.length === 0 ? (
            <div className="csm-empty">
              <i className="fas fa-chart-pie" aria-hidden="true"></i>
              <h4>No Saved Charts Yet</h4>
              <p>Generate at least one chart before ordering this report.</p>
              <Link className="csm-btn-generate" to="/my-data" onClick={onClose}>
                Generate a Chart
              </Link>
            </div>
          ) : (
            <>
              <div className="csm-select-all">
                <label className="csm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={charts.length > 0 && selectedChartIds.length === charts.length}
                    onChange={toggleSelectAll}
                  />
                  <span>Select all ({charts.length})</span>
                </label>
              </div>

              <div className="csm-chart-list">
                {charts.map((chart) => {
                  const birthData = chart.birth_data || {};
                  const isSelected = selectedChartIds.includes(chart.id);
                  const genderIcon = birthData.gender === 'female' ? 'fa-venus' : 'fa-mars';

                  return (
                    <div
                      key={chart.id}
                      role="button"
                      tabIndex={0}
                      className={`csm-chart-item ${isSelected ? 'csm-selected' : ''}`}
                      onClick={() => toggleChart(chart.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleChart(chart.id);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <div className="csm-chart-avatar">
                        <i className={`fas ${genderIcon}`} aria-hidden="true"></i>
                      </div>
                      <div className="csm-chart-details">
                        <h4>{birthData.name || 'Unnamed Chart'}</h4>
                        <p>
                          <span><i className="fas fa-calendar-alt" aria-hidden="true"></i>{birthData.dob || '---'}</span>
                          <span><i className="fas fa-clock" aria-hidden="true"></i>{birthData.tob || '---'}</span>
                        </p>
                        <p className="csm-chart-place">
                          <i className="fas fa-map-marker-alt" aria-hidden="true"></i>{birthData.place_of_birth || '---'}
                        </p>
                      </div>
                      <div className="csm-chart-price">{unitDisplay}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {charts.length > 0 && !loadingCharts && !chartError && (
          <div className="csm-footer">
            {orderError ? <div className="csm-order-error">{orderError}</div> : null}
            <div className="csm-footer-summary">
              <div className="csm-summary-text">
                <span className="csm-count">{totalCharts} chart{totalCharts === 1 ? '' : 's'} selected</span>
                <span className="csm-total">Total: <strong>{totalDisplay}</strong></span>
              </div>
              <button
                className="csm-btn-pay"
                onClick={handleProceedToPay}
                disabled={!selectedChartIds.length || creatingOrder}
              >
                {creatingOrder ? 'Processing...' : `Proceed to Pay · ${totalDisplay}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
