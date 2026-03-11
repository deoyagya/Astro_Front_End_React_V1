import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import { useStyles } from '../../context/StyleContext';
import '../../styles/admin.css';

const TABS = [
  { key: 'subscriptions', label: 'Subscriptions', icon: 'fa-sync-alt' },
  { key: 'purchases', label: 'One-Off Purchases', icon: 'fa-shopping-cart' },
];

const ORDER_STATUSES = ['', 'pending', 'paid', 'failed', 'refunded', 'cancelled', 'delivered'];
const SUB_STATUSES = ['', 'created', 'authenticated', 'active', 'pending', 'past_due', 'halted', 'paused', 'cancelled', 'expired', 'completed'];

/* ── Helpers ─────────────────────────────────────────────── */

function formatUSD(cents) {
  if (cents == null) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function truncateId(id) {
  if (!id) return '—';
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

/** Status aliases map statuses that share styling to a canonical badge key. */
const STATUS_BADGE_ALIAS = {
  active: 'paid', authenticated: 'paid',
  created: 'pending', past_due: 'pending',
  halted: 'failed',
  paused: 'refunded',
  expired: 'cancelled', completed: 'cancelled',
};

function statusBadge(status, getStyle) {
  const canonical = STATUS_BADGE_ALIAS[status] || status;
  const style = getStyle ? getStyle(`statusBadge_${canonical}`) : {};
  // Fallback for statuses not in registry
  const fallback = Object.keys(style).length === 0
    ? { backgroundColor: '#6b7280', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700 }
    : {};
  return (
    <span style={{
      ...fallback,
      ...style,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

function defaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

/* ── Toast ─────────────────────────────────────────────── */

function Toast({ message, type, onDismiss }) {
  if (!message) return null;
  const bg = type === 'error' ? '#ef4444' : '#22c55e';
  return (
    <div className="admin-toast" style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999, background: bg,
      color: '#fff', padding: '12px 20px', borderRadius: 8, maxWidth: 400,
      boxShadow: '0 4px 20px rgba(0,0,0,.3)', cursor: 'pointer', fontSize: '0.9rem',
    }} onClick={onDismiss}>
      {message}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export default function AdminOrderManagementPage() {
  const { getStyle } = useStyles('admin-orders');
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  }, []);

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <h1 style={getStyle('pageTitle')}><i className="fas fa-receipt" /> Order Management</h1>

        {/* Tab Bar */}
        <div className="admin-tabs" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...getStyle(activeTab === t.key ? 'tabBtn_active' : 'tabBtn_inactive'),
                border: 'none', cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <i className={`fas ${t.icon}`} style={{ marginRight: 6 }} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'subscriptions' && <SubscriptionsTab showToast={showToast} getStyle={getStyle} />}
        {activeTab === 'purchases' && <PurchasesTab showToast={showToast} getStyle={getStyle} />}

        <Toast {...toast} onDismiss={() => setToast({ message: '', type: 'success' })} />
      </div>
    </PageShell>
  );
}

/* ════════════════════════════════════════════════════════════
   Subscriptions Tab
   ════════════════════════════════════════════════════════════ */

function SubscriptionsTab({ showToast, getStyle }) {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  // Cancel modal
  const [cancelSub, setCancelSub] = useState(null);
  const [cancelImmediate, setCancelImmediate] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', `${dateFrom}T00:00:00`);
      if (dateTo) params.append('date_to', `${dateTo}T23:59:59`);
      params.append('limit', String(limit));
      params.append('offset', String(page * limit));
      const data = await api.get(`/v1/admin/orders/subscriptions?${params}`);
      setSubs(data.subscriptions || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, page, showToast]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleCancel = async () => {
    if (!cancelSub) return;
    setCancelling(true);
    try {
      await api.post(`/v1/admin/orders/subscriptions/${cancelSub.id}/cancel`, {
        reason: cancelReason || 'Cancelled by admin',
        immediate: cancelImmediate,
      });
      showToast('Subscription cancelled');
      setCancelSub(null);
      setCancelReason('');
      fetchSubs();
    } catch (err) {
      showToast(err.message || 'Cancel failed', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ color: '#9b95aa', fontSize: '0.85rem' }}>From:</label>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          style={dateInputStyle} />
        <label style={{ color: '#9b95aa', fontSize: '0.85rem' }}>To:</label>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          style={dateInputStyle} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          style={selectStyle}>
          <option value="">All Statuses</option>
          {SUB_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchSubs} style={refreshBtnStyle}>
          <i className="fas fa-sync-alt" /> Refresh
        </button>
        <span style={{ color: '#9b95aa', fontSize: '0.85rem', marginLeft: 'auto' }}>
          {total} subscription{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9b95aa' }}>
          <i className="fas fa-spinner fa-spin" /> Loading...
        </div>
      ) : subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9b95aa' }}>No subscriptions found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={getStyle('tableHeader')}>Customer</th>
                <th style={getStyle('tableHeader')}>Plan</th>
                <th style={getStyle('tableHeader')}>Cycle</th>
                <th style={getStyle('tableHeader')}>Status</th>
                <th style={getStyle('tableHeader')}>Period</th>
                <th style={getStyle('tableHeader')}>Created</th>
                <th style={getStyle('tableHeader')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} style={trStyle}>
                  <td style={getStyle('tableCell')}>
                    <div style={{ fontWeight: 600 }}>{s.user_name || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9b95aa' }}>{s.user_email || '—'}</div>
                  </td>
                  <td style={getStyle('tableCell')}>{s.plan_name || s.plan_slug || '—'}</td>
                  <td style={getStyle('tableCell')}>{s.billing_cycle}</td>
                  <td style={getStyle('tableCell')}>{statusBadge(s.status, getStyle)}</td>
                  <td style={getStyle('tableCell')}>
                    <div style={{ fontSize: '0.82rem' }}>
                      {formatDate(s.current_period_start)} — {formatDate(s.current_period_end)}
                    </div>
                  </td>
                  <td style={getStyle('tableCell')}>{formatDate(s.created_at)}</td>
                  <td style={getStyle('tableCell')}>
                    {!['cancelled', 'expired', 'completed'].includes(s.status) && (
                      <button onClick={() => setCancelSub(s)} style={actionBtnStyle('#ef4444')}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)} style={pageBtnStyle}>Prev</button>
          <span style={{ color: '#9b95aa', padding: '8px 12px' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={pageBtnStyle}>Next</button>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {cancelSub && (
        <Modal onClose={() => setCancelSub(null)} title="Cancel Subscription">
          <p style={{ color: '#e8e2f4', marginBottom: 12 }}>
            Cancel subscription for <strong>{cancelSub.user_email}</strong> ({cancelSub.plan_name})?
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Cancellation type</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ color: '#e8e2f4', cursor: 'pointer' }}>
                <input type="radio" checked={cancelImmediate} onChange={() => setCancelImmediate(true)} />
                {' '}Immediate
              </label>
              <label style={{ color: '#e8e2f4', cursor: 'pointer' }}>
                <input type="radio" checked={!cancelImmediate} onChange={() => setCancelImmediate(false)} />
                {' '}At period end
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason (optional)</label>
            <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setCancelSub(null)} style={modalCancelBtnStyle}>Back</button>
            <button onClick={handleCancel} disabled={cancelling} style={modalActionBtnStyle('#ef4444')}>
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   One-Off Purchases Tab
   ════════════════════════════════════════════════════════════ */

function PurchasesTab({ showToast, getStyle }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  // Modals
  const [detailOrder, setDetailOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('requested_by_customer');
  const [refunding, setRefunding] = useState(false);
  const [deliverOrder, setDeliverOrder] = useState(null);
  const [deliverNotes, setDeliverNotes] = useState('');
  const [delivering, setDelivering] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFrom) params.append('date_from', `${dateFrom}T00:00:00`);
      if (dateTo) params.append('date_to', `${dateTo}T23:59:59`);
      params.append('limit', String(limit));
      params.append('offset', String(page * limit));
      const data = await api.get(`/v1/admin/orders/one-off?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, page, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleRefund = async () => {
    if (!refundOrder) return;
    setRefunding(true);
    try {
      const body = { reason: refundReason };
      if (refundAmount) body.amount_cents = parseInt(refundAmount, 10);
      await api.post(`/v1/admin/orders/${refundOrder.id}/refund`, body);
      showToast('Refund processed');
      setRefundOrder(null);
      setRefundAmount('');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Refund failed', 'error');
    } finally {
      setRefunding(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliverOrder) return;
    setDelivering(true);
    try {
      await api.post(`/v1/admin/orders/${deliverOrder.id}/deliver`, {
        delivery_notes: deliverNotes || null,
      });
      showToast('Order marked as delivered');
      setDeliverOrder(null);
      setDeliverNotes('');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Delivery failed', 'error');
    } finally {
      setDelivering(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${truncateId(order.id)}?`)) return;
    try {
      await api.post(`/v1/admin/orders/${order.id}/cancel`, { reason: 'Cancelled by admin' });
      showToast('Order cancelled');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Cancel failed', 'error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ color: '#9b95aa', fontSize: '0.85rem' }}>From:</label>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          style={dateInputStyle} />
        <label style={{ color: '#9b95aa', fontSize: '0.85rem' }}>To:</label>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          style={dateInputStyle} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          style={selectStyle}>
          <option value="">All Statuses</option>
          {ORDER_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchOrders} style={refreshBtnStyle}>
          <i className="fas fa-sync-alt" /> Refresh
        </button>
        <span style={{ color: '#9b95aa', fontSize: '0.85rem', marginLeft: 'auto' }}>
          {total} order{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9b95aa' }}>
          <i className="fas fa-spinner fa-spin" /> Loading...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9b95aa' }}>No orders found</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={getStyle('tableHeader')}>Customer</th>
                <th style={getStyle('tableHeader')}>Items</th>
                <th style={getStyle('tableHeader')}>Amount</th>
                <th style={getStyle('tableHeader')}>Status</th>
                <th style={getStyle('tableHeader')}>Payment ID</th>
                <th style={getStyle('tableHeader')}>Date</th>
                <th style={getStyle('tableHeader')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={trStyle}>
                  <td style={getStyle('tableCell')}>
                    <div style={{ fontWeight: 600 }}>{o.user_name || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9b95aa' }}>{o.user_email || '—'}</div>
                  </td>
                  <td style={getStyle('tableCell')}>
                    {(o.items || []).map((it) => it.report_name).join(', ') || '—'}
                  </td>
                  <td style={getStyle('tableCell')}>{formatUSD(o.amount)}</td>
                  <td style={getStyle('tableCell')}>{statusBadge(o.status, getStyle)}</td>
                  <td style={{ ...getStyle('tableCell'), fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {o.payment_id ? truncateId(o.payment_id) : (
                      <span style={{ color: '#6b7280', fontFamily: 'inherit', fontStyle: 'italic' }}>Awaiting payment</span>
                    )}
                  </td>
                  <td style={getStyle('tableCell')}>{formatDate(o.created_at)}</td>
                  <td style={getStyle('tableCell')}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetailOrder(o)} style={actionBtnStyle('#3b82f6')}>
                        View
                      </button>
                      {o.status === 'paid' && (
                        <>
                          <button onClick={() => setRefundOrder(o)} style={actionBtnStyle('#ef4444')}>
                            Refund
                          </button>
                          <button onClick={() => setDeliverOrder(o)} style={actionBtnStyle('#06b6d4')}>
                            Deliver
                          </button>
                        </>
                      )}
                      {o.status === 'pending' && (
                        <button onClick={() => handleCancelOrder(o)} style={actionBtnStyle('#6b7280')}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)} style={pageBtnStyle}>Prev</button>
          <span style={{ color: '#9b95aa', padding: '8px 12px' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={pageBtnStyle}>Next</button>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailOrder && (
        <Modal onClose={() => setDetailOrder(null)} title="Order Details">
          <div style={{ color: '#e8e2f4' }}>
            <div style={detailRowStyle}><strong>Order ID:</strong> <code style={codeStyle}>{detailOrder.id}</code></div>
            <div style={detailRowStyle}><strong>Customer:</strong> {detailOrder.user_name || '—'} ({detailOrder.user_email || '—'})</div>
            <div style={detailRowStyle}><strong>Amount:</strong> {formatUSD(detailOrder.amount)} {detailOrder.currency}</div>
            <div style={detailRowStyle}><strong>Status:</strong> {statusBadge(detailOrder.status, getStyle)}</div>
            <div style={detailRowStyle}><strong>Gateway ID:</strong> <code style={codeStyle}>{truncateId(detailOrder.gateway_order_id)}</code></div>
            <div style={detailRowStyle}><strong>Payment ID:</strong> <code style={codeStyle}>{detailOrder.payment_id || '—'}</code></div>
            <div style={detailRowStyle}><strong>Receipt:</strong> {detailOrder.receipt || '—'}</div>
            <div style={detailRowStyle}><strong>Created:</strong> {formatDateTime(detailOrder.created_at)}</div>
            <div style={detailRowStyle}><strong>Updated:</strong> {formatDateTime(detailOrder.updated_at)}</div>

            {detailOrder.items && detailOrder.items.length > 0 && (
              <>
                <h4 style={{ marginTop: 16, marginBottom: 8 }}>Items</h4>
                <table style={{ ...tableStyle, marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={getStyle('tableHeader')}>Report</th>
                      <th style={getStyle('tableHeader')}>Type</th>
                      <th style={getStyle('tableHeader')}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOrder.items.map((it) => (
                      <tr key={it.id} style={trStyle}>
                        <td style={getStyle('tableCell')}>{it.report_name}</td>
                        <td style={getStyle('tableCell')}>{it.report_type_id}</td>
                        <td style={getStyle('tableCell')}>{formatUSD(it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setDetailOrder(null)} style={modalCancelBtnStyle}>Close</button>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <Modal onClose={() => setRefundOrder(null)} title="Process Refund">
          <p style={{ color: '#e8e2f4', marginBottom: 12 }}>
            Refund order for <strong>{refundOrder.user_email}</strong> — {formatUSD(refundOrder.amount)}
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Refund amount (cents, leave empty for full refund)</label>
            <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Full refund: ${refundOrder.amount} cents`} style={inputStyle} min="1" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason</label>
            <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} style={selectStyle}>
              <option value="requested_by_customer">Requested by customer</option>
              <option value="duplicate">Duplicate</option>
              <option value="fraudulent">Fraudulent</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setRefundOrder(null)} style={modalCancelBtnStyle}>Cancel</button>
            <button onClick={handleRefund} disabled={refunding} style={modalActionBtnStyle('#ef4444')}>
              {refunding ? 'Processing...' : 'Confirm Refund'}
            </button>
          </div>
        </Modal>
      )}

      {/* Deliver Modal */}
      {deliverOrder && (
        <Modal onClose={() => setDeliverOrder(null)} title="Deliver Digital Goods">
          <p style={{ color: '#e8e2f4', marginBottom: 12 }}>
            Mark order as delivered for <strong>{deliverOrder.user_email}</strong>
          </p>
          <div style={{ marginBottom: 8, color: '#9b95aa', fontSize: '0.85rem' }}>
            Items: {(deliverOrder.items || []).map((it) => it.report_name).join(', ')}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Delivery notes (optional)</label>
            <textarea value={deliverNotes} onChange={(e) => setDeliverNotes(e.target.value)}
              placeholder="e.g. PDF reports emailed to customer" rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeliverOrder(null)} style={modalCancelBtnStyle}>Cancel</button>
            <button onClick={handleDeliver} disabled={delivering} style={modalActionBtnStyle('#06b6d4')}>
              {delivering ? 'Delivering...' : 'Mark as Delivered'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Shared Modal
   ════════════════════════════════════════════════════════════ */

function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: '#1a1730', borderRadius: 12, padding: 24, minWidth: 400,
        maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
        border: '1px solid #2a2545', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#e8e2f4', marginTop: 0, marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ── Shared Styles ─────────────────────────────────────── */

const dateInputStyle = {
  background: '#1a1730', border: '1px solid #2a2545', borderRadius: 6,
  padding: '6px 10px', color: '#e8e2f4', fontSize: '0.85rem',
};

const selectStyle = {
  background: '#1a1730', border: '1px solid #2a2545', borderRadius: 6,
  padding: '6px 12px', color: '#e8e2f4', fontSize: '0.85rem', cursor: 'pointer',
};

const refreshBtnStyle = {
  background: '#7c5cfc', border: 'none', borderRadius: 6,
  padding: '6px 14px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer',
};

const tableStyle = {
  width: '100%', borderCollapse: 'collapse', borderSpacing: 0,
};

const thStyle = {
  textAlign: 'left', padding: '10px 12px', color: '#9b95aa',
  borderBottom: '1px solid #2a2545', fontSize: '0.82rem', fontWeight: 600,
  whiteSpace: 'nowrap',
};

const trStyle = {
  borderBottom: '1px solid rgba(42,37,69,.5)',
};

const tdStyle = {
  padding: '10px 12px', color: '#e8e2f4', fontSize: '0.88rem',
  verticalAlign: 'middle',
};

const actionBtnStyle = (bg) => ({
  background: bg, border: 'none', borderRadius: 4,
  padding: '4px 10px', color: '#fff', fontSize: '0.78rem',
  cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
});

const pageBtnStyle = {
  background: '#1e1b30', border: '1px solid #2a2545', borderRadius: 6,
  padding: '6px 14px', color: '#e8e2f4', cursor: 'pointer', fontSize: '0.85rem',
};

const labelStyle = {
  display: 'block', color: '#9b95aa', fontSize: '0.82rem', marginBottom: 4,
};

const inputStyle = {
  width: '100%', background: '#0f0d1a', border: '1px solid #2a2545',
  borderRadius: 6, padding: '8px 12px', color: '#e8e2f4', fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const modalCancelBtnStyle = {
  background: '#1e1b30', border: '1px solid #2a2545', borderRadius: 6,
  padding: '8px 16px', color: '#9b95aa', cursor: 'pointer', fontSize: '0.85rem',
};

const modalActionBtnStyle = (bg) => ({
  background: bg, border: 'none', borderRadius: 6,
  padding: '8px 16px', color: '#fff', cursor: 'pointer',
  fontSize: '0.85rem', fontWeight: 600,
});

const detailRowStyle = {
  marginBottom: 8, fontSize: '0.9rem',
};

const codeStyle = {
  background: '#0f0d1a', padding: '2px 6px', borderRadius: 4,
  fontSize: '0.82rem', fontFamily: 'monospace',
};
