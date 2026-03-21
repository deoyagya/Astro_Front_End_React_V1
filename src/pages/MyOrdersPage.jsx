/**
 * MyOrdersPage — Shows the user's order history with details,
 * payment status, amount, and invoice download option.
 */

import { useCallback, useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import '../styles/my-orders.css';

const STATUS_MAP = {
  paid: { label: 'Paid', className: 'mo-status-paid', icon: 'fa-check-circle' },
  pending: { label: 'Pending', className: 'mo-status-pending', icon: 'fa-clock' },
  failed: { label: 'Failed', className: 'mo-status-failed', icon: 'fa-times-circle' },
  refunded: { label: 'Refunded', className: 'mo-status-refunded', icon: 'fa-undo' },
  processing: { label: 'Processing', className: 'mo-status-processing', icon: 'fa-spinner fa-spin' },
};

const TYPE_MAP = {
  report: { label: 'Report', icon: 'fa-file-alt', color: '#9d7bff' },
  question: { label: 'Questions', icon: 'fa-question-circle', color: '#f5c542' },
  muhurta: { label: 'Muhurta', icon: 'fa-calendar-check', color: '#48c78e' },
  subscription: { label: 'Subscription', icon: 'fa-crown', color: '#ff6b35' },
  credit_pack: { label: 'Credits', icon: 'fa-coins', color: '#3b82f6' },
};

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(cents, currency = 'USD') {
  if (cents == null) return '—';
  const sym = currency === 'INR' ? '\u20B9' : '$';
  return `${sym}${(cents / 100).toFixed(2)}`;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all'); // all | paid | pending | failed
  const [expandedId, setExpandedId] = useState(null);
  const [questionResults, setQuestionResults] = useState({});
  const [recheckingId, setRecheckingId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const [reportOrders, questionOrders] = await Promise.all([
        api.get('/v1/payment/orders?limit=100'),
        api.get('/v1/questions/my-orders?limit=100').catch(() => ({ orders: [] })),
      ]);

      const merged = new Map();
      for (const o of reportOrders) {
        merged.set(o.id, { ...o, _source: 'payment' });
      }
      for (const o of (questionOrders.orders || [])) {
        if (!merged.has(o.order_id)) {
          merged.set(o.order_id, {
            id: o.order_id,
            receipt: o.receipt,
            status: o.status,
            amount: o.total_cents,
            currency: o.currency || 'USD',
            order_type: 'question',
            items: [],
            created_at: o.created_at,
            question_count: o.question_count,
            completed_count: o.completed_count,
            _source: 'question',
          });
        }
      }

      const sorted = [...merged.values()].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRecheckPayment = useCallback(async (order) => {
    if (!order?.gateway_order_id) return;
    setRecheckingId(order.id);
    setError('');
    setNotice('');
    try {
      const data = await api.get(`/v1/payment/session-status?session_id=${order.gateway_order_id}`);
      await loadOrders();
      if (data?.payment_status === 'paid' || data?.status === 'complete') {
        setNotice('Payment confirmed. Report generation has started. Check My Reports shortly.');
      } else {
        setNotice('Payment is still pending with the gateway.');
      }
    } catch (err) {
      setError(err.message || 'Unable to recheck this payment right now.');
    } finally {
      setRecheckingId(null);
    }
  }, [loadOrders]);

  // Filter
  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  // Toggle expand / fetch question results
  const toggleExpand = async (orderId, orderType) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);

    if (orderType === 'question' && !questionResults[orderId]) {
      try {
        const res = await api.get(`/v1/questions/answers/${orderId}`);
        setQuestionResults((prev) => ({ ...prev, [orderId]: res }));
      } catch {
        // silently fail
      }
    }
  };

  // Download invoice as text
  const downloadInvoice = (order) => {
    const type = TYPE_MAP[order.order_type] || TYPE_MAP.report;
    const lines = [
      '═══════════════════════════════════════',
      '            ASTRO YAGYA INVOICE        ',
      '═══════════════════════════════════════',
      '',
      `Invoice #:    ${order.receipt || order.id.slice(0, 8).toUpperCase()}`,
      `Date:         ${formatDate(order.created_at)}`,
      `Order Type:   ${type.label}`,
      `Status:       ${(STATUS_MAP[order.status]?.label || order.status).toUpperCase()}`,
      `Payment:      ${order.payment_provider || 'Stripe'}`,
      '',
      '───────────────────────────────────────',
      '  ITEMS',
      '───────────────────────────────────────',
    ];

    if (order.items?.length > 0) {
      order.items.forEach((item, i) => {
        lines.push(`  ${i + 1}. ${item.report_name || 'Item'}  —  ${formatAmount(item.price, order.currency)}`);
      });
    } else if (order.order_type === 'question') {
      lines.push(`  ${order.question_count || '?'} question(s) @ $5.00 each`);
    } else {
      lines.push('  1 x Order');
    }

    lines.push('');
    lines.push('───────────────────────────────────────');
    lines.push(`  TOTAL:  ${formatAmount(order.amount, order.currency)}`);
    lines.push('═══════════════════════════════════════');
    lines.push('');
    lines.push('Thank you for your purchase!');
    lines.push('Astro Yagya — Charts · Dashas · Guidance');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.receipt || order.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <PageShell activeNav="">
        <div className="mo-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading orders...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="">
      <div className="mo-page">
        <div className="mo-header">
          <h1><i className="fas fa-receipt"></i> My Orders</h1>
          <p>View your order history, payment status, and download invoices.</p>
        </div>

        {error && (
          <div className="mo-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {notice && (
          <div className="mo-error" style={{ background: 'rgba(72, 199, 142, 0.12)', borderColor: 'rgba(72, 199, 142, 0.35)', color: '#9ff0c2' }}>
            <i className="fas fa-info-circle"></i> {notice}
          </div>
        )}

        {/* Filter tabs */}
        <div className="mo-filters">
          {['all', 'paid', 'pending', 'failed'].map((f) => (
            <button
              key={f}
              className={`mo-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STATUS_MAP[f]?.label || f}
              <span className="mo-filter-count">
                {f === 'all' ? orders.length : orders.filter((o) => o.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <div className="mo-empty">
            <i className="fas fa-shopping-bag"></i>
            <h3>No orders found</h3>
            <p>{filter !== 'all' ? 'Try changing the filter above.' : 'Your order history will appear here after your first purchase.'}</p>
          </div>
        ) : (
          <div className="mo-list">
            {filtered.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || { label: order.status, className: '', icon: 'fa-circle' };
              const typeInfo = TYPE_MAP[order.order_type] || TYPE_MAP.report;
              const isExpanded = expandedId === order.id;
              const qResults = questionResults[order.id];

              return (
                <div key={order.id} className={`mo-card ${isExpanded ? 'mo-card-expanded' : ''}`}>
                  <div className="mo-card-main" onClick={() => toggleExpand(order.id, order.order_type)}>
                    {/* Type icon */}
                    <div className="mo-card-type" style={{ color: typeInfo.color }}>
                      <i className={`fas ${typeInfo.icon}`}></i>
                    </div>

                    {/* Details */}
                    <div className="mo-card-details">
                      <div className="mo-card-title">
                        <span className="mo-card-type-label" style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                        <span className="mo-card-receipt">#{order.receipt || order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="mo-card-meta">
                        <span><i className="far fa-clock"></i> {formatDate(order.created_at)}</span>
                        {order.items?.length > 0 && (
                          <span><i className="fas fa-list"></i> {order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        )}
                        {order.order_type === 'question' && order.question_count && (
                          <span><i className="fas fa-question"></i> {order.question_count} question{order.question_count !== 1 ? 's' : ''}</span>
                        )}
                        {order.payment_provider && (
                          <span className="mo-card-provider">
                            <i className={`fab fa-${order.payment_provider === 'razorpay' ? 'cc-visa' : 'stripe-s'}`}></i>
                            {order.payment_provider}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="mo-card-amount">
                      {formatAmount(order.amount, order.currency)}
                    </div>

                    {/* Status badge */}
                    <div className={`mo-card-status ${statusInfo.className}`}>
                      <i className={`fas ${statusInfo.icon}`}></i>
                      <span>{statusInfo.label}</span>
                    </div>

                    {/* Expand arrow */}
                    <div className="mo-card-expand">
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mo-card-body">
                      {/* Report items */}
                      {order.items?.length > 0 && (
                        <div className="mo-items-table">
                          <div className="mo-items-header">
                            <span>Item</span>
                            <span>Price</span>
                          </div>
                          {order.items.map((item) => (
                            <div key={item.id} className="mo-items-row">
                              <span>{item.report_name || 'Report'}</span>
                              <span>{formatAmount(item.price, order.currency)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question order results */}
                      {order.order_type === 'question' && qResults && (
                        <div className="mo-question-results">
                          <div className="mo-qr-summary">
                            <span className="mo-qr-stat">
                              <i className="fas fa-check-circle" style={{ color: '#48c78e' }}></i>
                              {qResults.summary?.completed || 0} completed
                            </span>
                            <span className="mo-qr-stat">
                              <i className="fas fa-spinner" style={{ color: '#f5c542' }}></i>
                              {qResults.summary?.processing || 0} processing
                            </span>
                            <span className="mo-qr-stat">
                              <i className="fas fa-times-circle" style={{ color: '#f87171' }}></i>
                              {qResults.summary?.failed || 0} failed
                            </span>
                          </div>
                          {qResults.questions?.map((q, i) => (
                            <div key={q.id || i} className="mo-qr-item">
                              <div className="mo-qr-question">
                                <span className="mo-qr-area">{q.life_area || q.theme}</span>
                                <span className="mo-qr-text">{q.question_text}</span>
                              </div>
                              <div className={`mo-qr-status ${q.status === 'completed' ? 'mo-qr-done' : q.status === 'failed' ? 'mo-qr-fail' : ''}`}>
                                {q.status}
                              </div>
                              {q.status === 'completed' && q.ai_interpretation && (
                                <div className="mo-qr-answer">
                                  {q.prediction_summary && (
                                    <div className="mo-qr-score">{q.prediction_summary}</div>
                                  )}
                                  <p>{q.ai_interpretation}</p>
                                </div>
                              )}
                              {q.status === 'failed' && q.error && (
                                <div className="mo-qr-error">{q.error}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {order.order_type === 'question' && !qResults && (
                        <div className="mo-qr-loading">
                          <i className="fas fa-spinner fa-spin"></i> Loading question results...
                        </div>
                      )}

                      {/* Order metadata */}
                      <div className="mo-card-meta-row">
                        <span className="mo-meta-label">Order ID</span>
                        <span className="mo-meta-value">{order.id}</span>
                      </div>
                      {order.gateway_payment_id && (
                        <div className="mo-card-meta-row">
                          <span className="mo-meta-label">Payment ID</span>
                          <span className="mo-meta-value">{order.gateway_payment_id}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mo-card-actions">
                        {order.status === 'paid' && (
                          <button className="mo-action-btn" onClick={() => downloadInvoice(order)}>
                            <i className="fas fa-download"></i> Download Invoice
                          </button>
                        )}
                        {order.status === 'pending' && order.payment_provider === 'stripe' && order.gateway_order_id && (
                          <button
                            className="mo-action-btn"
                            onClick={() => handleRecheckPayment(order)}
                            disabled={recheckingId === order.id}
                          >
                            <i className={`fas ${recheckingId === order.id ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`}></i>{' '}
                            {recheckingId === order.id ? 'Rechecking...' : 'Recheck Payment'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
