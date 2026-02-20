import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

/* Load Razorpay SDK script once */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState('idle');   // idle | processing | success | failed
  const [error, setError] = useState('');

  /* Load order data from localStorage (set by OrderPage) */
  useEffect(() => {
    const saved = localStorage.getItem('razorpay_order');
    if (!saved) { navigate('/order'); return; }
    try {
      setOrder(JSON.parse(saved));
    } catch { navigate('/order'); }

    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (Array.isArray(savedCart)) setCart(savedCart);
  }, [navigate]);

  /* Open Razorpay checkout modal */
  const openCheckout = useCallback(async () => {
    if (!order) return;
    setStatus('processing');
    setError('');

    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      setError('Failed to load payment gateway. Please check your internet connection and try again.');
      setStatus('idle');
      return;
    }

    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: 'Vedic Astro',
      description: cart.map((r) => r.name).join(', ').slice(0, 255),
      prefill: {
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: { color: '#7c3aed' },

      /* Payment success */
      handler: async (response) => {
        try {
          await api.post('/v1/payment/razorpay/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          setStatus('success');
          // Clean up cart + order
          localStorage.removeItem('razorpay_order');
          localStorage.removeItem('cart');

          // Redirect to My Reports after short delay
          setTimeout(() => navigate('/my-reports'), 2500);
        } catch (err) {
          setStatus('failed');
          setError(err.message || 'Payment verification failed. Please contact support.');
        }
      },

      /* Payment dismissed / cancelled */
      modal: {
        ondismiss: () => {
          setStatus('idle');
        },
      },
    };

    const rzp = new window.Razorpay(options);

    /* Payment failure (network / bank rejection) */
    rzp.on('payment.failed', (resp) => {
      setStatus('failed');
      setError(resp.error?.description || 'Payment failed. Please try again.');
    });

    rzp.open();
  }, [order, cart, user, navigate]);

  const amountDisplay = order ? `₹${(order.amount / 100).toLocaleString('en-IN')}` : '—';

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
          <div className="payment-header">
            <h1>Complete Payment</h1>
            <p>Secure checkout powered by Razorpay</p>
          </div>

          {/* Order details recap */}
          {order && (
            <div className="payment-methods" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Order Details</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                {cart.map((item) => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span><i className={`fas ${item.icon}`} style={{ marginRight: '8px', opacity: 0.7 }}></i>{item.name}</span>
                    <span>₹{item.price}</span>
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: '#a78bfa' }}>{amountDisplay}</span>
              </div>
              {order.receipt && (
                <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>Receipt: {order.receipt}</p>
              )}
            </div>
          )}

          {/* Status messages */}
          {status === 'success' && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#22c55e', marginBottom: '12px', display: 'block' }}></i>
              <h3 style={{ color: '#22c55e', marginBottom: '8px' }}>Payment Successful!</h3>
              <p>Your reports are being generated. Redirecting to My Reports...</p>
            </div>
          )}

          {status === 'failed' && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <i className="fas fa-times-circle" style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '12px', display: 'block' }}></i>
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Payment Failed</h3>
              <p>{error}</p>
            </div>
          )}

          {error && status === 'idle' && (
            <p style={{ color: '#ff6b6b', textAlign: 'center', margin: '10px 0' }}>{error}</p>
          )}

          {/* Action buttons */}
          <div className="payment-methods">
            <div className="payment-actions">
              {status !== 'success' && (
                <button
                  className="btn"
                  onClick={openCheckout}
                  disabled={status === 'processing' || !order}
                  style={status === 'processing' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  {status === 'processing' ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Processing...</>
                  ) : status === 'failed' ? (
                    'Retry Payment'
                  ) : (
                    <>Pay {amountDisplay}</>
                  )}
                </button>
              )}
              <button className="btn btn-outline" onClick={() => navigate('/order')}>Back to Cart</button>
            </div>
          </div>

          {/* Security badge */}
          <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.5, fontSize: '13px' }}>
            <i className="fas fa-lock" style={{ marginRight: '6px' }}></i>
            Secured by Razorpay &middot; PCI DSS Level 1 Compliant
          </div>
        </div>
      </div>
    </PageShell>
  );
}
