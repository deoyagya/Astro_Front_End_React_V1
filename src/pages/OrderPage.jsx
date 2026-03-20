import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ApiError from '../components/ApiError';
import EmbeddedCheckoutModal from '../components/EmbeddedCheckoutModal';
import RazorpayCheckoutModal from '../components/RazorpayCheckoutModal';
import usePaymentGateway from '../hooks/usePaymentGateway';
import { api } from '../api/client';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

export default function OrderPage() {
  const { getOverride } = useStyles('order');
  useSharedEffects();
  const gw = usePaymentGateway();

  /* ── State ─────────────────────────────────────────────── */
  const [reports, setReports] = useState([]);        // from GET /report-prices
  const [fetchingPrices, setFetchingPrices] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // report IDs in cart
  const [validatedCart, setValidatedCart] = useState(null); // from POST /validate-cart
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);      // order creation
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(''); // Stripe Embedded Checkout
  const [razorpayOrder, setRazorpayOrder] = useState(null); // Razorpay order data
  const debounceRef = useRef(null);

  /* ── Fetch report prices on mount ──────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/v1/payment/report-prices?currency=${encodeURIComponent(gw.currency || 'USD')}`);
        if (!cancelled) {
          setReports(data.reports || []);
          // Restore previously selected IDs from localStorage
          const saved = JSON.parse(localStorage.getItem('cart_ids') || '[]');
          if (Array.isArray(saved) && saved.length > 0) {
            setSelectedIds(saved);
          }
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load report prices. Please refresh.');
      } finally {
        if (!cancelled) setFetchingPrices(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gw.currency]);

  /* ── Debounced cart validation on selection change ──────── */
  const validateCart = useCallback(async (ids) => {
    if (ids.length === 0) {
      setValidatedCart(null);
      localStorage.removeItem('cart_ids');
      localStorage.removeItem('cart');
      return;
    }
    setValidating(true);
    try {
      const data = await api.post('/v1/payment/validate-cart', {
        item_ids: ids,
        currency: gw.currency || 'USD',
      });
      setValidatedCart(data);
      // Persist selected items
      localStorage.setItem('cart_ids', JSON.stringify(ids));
      localStorage.setItem('cart', JSON.stringify(
        data.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price_cents,
          icon: it.icon,
        }))
      ));
      setError('');
    } catch (err) {
      setError(err.message || 'Cart validation failed.');
      setValidatedCart(null);
    } finally {
      setValidating(false);
    }
  }, [gw.currency]);

  useEffect(() => {
    if (fetchingPrices) return; // Don't validate until prices are loaded
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validateCart(selectedIds), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [selectedIds, fetchingPrices, validateCart]);

  /* ── Helpers ────────────────────────────────────────────── */
  const isSelected = (id) => selectedIds.includes(id);

  const toggleReport = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displayTotal = useMemo(() => {
    if (validatedCart) return validatedCart.total_display;
    return gw.currency === 'INR' ? '₹0' : '$0.00';
  }, [gw.currency, validatedCart]);

  /* ── Create payment order (Stripe or Razorpay) ────────── */
  const proceedToPayment = async () => {
    if (!selectedIds.length) {
      setError('Please select at least one report.');
      return;
    }
    if (!validatedCart) {
      setError('Please wait for price validation to complete.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const orderData = await api.postLong('/v1/payment/create-order', {
        amount: validatedCart.total_cents,
        currency: gw.currency || 'USD',
        gateway: gw.gateway || undefined,
        items: validatedCart.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price_cents,
        })),
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
      setError('Unable to start checkout. Please try again.');
    } catch (err) {
      setError(err.message || 'Unable to process your order. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <PageShell activeNav="reports">
      {clientSecret && (
        <EmbeddedCheckoutModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret('')}
        />
      )}
      {razorpayOrder && (
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
              setError('Payment verification failed. Please contact support.');
            }
          }}
          onClose={() => setRazorpayOrder(null)}
        />
      )}
      <div className="report-page">
        <div className="container">
          <div className="cart-header">
            <h1>Select Your Reports</h1>
            <p>Choose the life areas you want to explore in depth</p>
          </div>

          {fetchingPrices ? (
            <div className="reports-loading">
              <i className="fas fa-spinner"></i>
              Loading report prices...
            </div>
          ) : (
            <div className="order-layout">
              {/* LEFT COLUMN: Report List */}
              <div className="report-list" id="reportList">
                {reports.map((report) => (
                  <div className="report-item" key={report.id}>
                    <input
                      type="checkbox"
                      id={report.id}
                      aria-label={`${report.name} selection`}
                      checked={isSelected(report.id)}
                      disabled={report.id === 'sade-sati'}
                      onChange={() => toggleReport(report.id)}
                    />
                    <div className="report-info">
                      <h3><i className={`fas ${report.icon}`}></i> {report.name}</h3>
                      <p>
                        {report.id === 'sade-sati'
                          ? 'Requires saved chart selection from the dedicated Sade Sati landing page.'
                          : 'Detailed Vedic astrology analysis with predictions and remedies'}
                      </p>
                      {report.id === 'sade-sati' && (
                        <p style={{ marginTop: '8px' }}>
                          <Link to="/sade-sati-report" style={{ color: '#7b5bff', fontWeight: 600 }}>
                            Open Sade Sati order page
                          </Link>
                        </p>
                      )}
                    </div>
                    <div className="report-price">{report.price_display}</div>
                  </div>
                ))}
              </div>

              {/* RIGHT COLUMN: Order Summary (sticky) */}
              <div className="order-summary-col">
                <div className="cart-summary" id="cartSummary">
                  <h3>Order Summary</h3>
                  <div id="selectedItems">
                    {!selectedIds.length ? (
                      <p className="empty-cart">No reports selected</p>
                    ) : validatedCart ? (
                      <ul style={{ listStyle: 'none', marginBottom: '20px' }}>
                        {validatedCart.items.map((item) => (
                          <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>{item.name}</span>
                            <span>{item.price_display}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-cart" style={{ padding: '20px' }}>
                        {validating ? 'Validating...' : 'Select reports to see summary'}
                      </p>
                    )}
                  </div>
                  <div className="total-amount">
                    Total: <span id="totalPrice">{displayTotal}</span>
                  </div>
                  {validatedCart && (
                    <p className="validation-note">
                      <i className="fas fa-check-circle"></i> Prices confirmed
                    </p>
                  )}

                  <ApiError message={error} onDismiss={() => setError('')} />

                  <button
                    className="btn place-order-btn"
                    id="placeOrderBtn"
                    onClick={proceedToPayment}
                    disabled={loading || validating || !validatedCart}
                    style={(loading || validating || !validatedCart) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    {loading ? 'Creating Order...' : validating ? 'Validating...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
