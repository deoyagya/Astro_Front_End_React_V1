import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ApiError from '../components/ApiError';
import { api } from '../api/client';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function OrderPage() {
  useSharedEffects();
  const navigate = useNavigate();

  /* ── State ─────────────────────────────────────────────── */
  const [reports, setReports] = useState([]);        // from GET /report-prices
  const [fetchingPrices, setFetchingPrices] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); // report IDs in cart
  const [validatedCart, setValidatedCart] = useState(null); // from POST /validate-cart
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);      // order creation
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  /* ── Fetch report prices on mount ──────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/v1/payment/report-prices');
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
  }, []);

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
      const data = await api.post('/v1/payment/validate-cart', { item_ids: ids });
      setValidatedCart(data);
      // Persist for PaymentPage compatibility
      localStorage.setItem('cart_ids', JSON.stringify(ids));
      localStorage.setItem('cart', JSON.stringify(
        data.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price_paisa / 100, // PaymentPage expects rupees
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
  }, []);

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
    return '₹0';
  }, [validatedCart]);

  /* ── Create Razorpay order on backend then navigate ────── */
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
      const orderData = await api.post('/v1/payment/razorpay/create-order', {
        amount: validatedCart.total_paisa,
        currency: 'INR',
        items: validatedCart.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price_paisa,
        })),
        receipt: `astroyagya_order_${Date.now()}`,
      });

      localStorage.setItem('razorpay_order', JSON.stringify(orderData));
      navigate('/payment');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('not configured') || msg.includes('503')) {
        setError('Payment gateway is being set up. Please try again later or contact support.');
      } else if (msg.includes('401') || msg.includes('Not authenticated')) {
        setError('Please log in to place an order.');
      } else if (msg.includes('mismatch')) {
        setError('Price changed. Please refresh the page and try again.');
      } else {
        setError(msg || 'Failed to create order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <PageShell activeNav="reports">
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
                      checked={isSelected(report.id)}
                      onChange={() => toggleReport(report.id)}
                    />
                    <div className="report-info">
                      <h3><i className={`fas ${report.icon}`}></i> {report.name}</h3>
                      <p>Detailed Vedic astrology analysis with predictions and remedies</p>
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
                      <i className="fas fa-check-circle"></i> Prices verified by server
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
