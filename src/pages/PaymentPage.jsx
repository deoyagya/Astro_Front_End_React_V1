import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';
import { useStyles } from '../context/StyleContext';

/**
 * PaymentPage — Post-checkout landing page.
 *
 * With Stripe hosted checkout, the user is redirected here after payment.
 * Query params: ?payment_success=true or ?payment_cancelled=true
 *
 * If no query params, redirects to /order (the cart page).
 */
export default function PaymentPage() {
  const { getOverride } = useStyles('payment');
  useSharedEffects();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const success = searchParams.get('payment_success');
    const cancelled = searchParams.get('payment_cancelled');

    if (success === 'true') {
      setStatus('success');
      // Clean up cart
      localStorage.removeItem('cart');
      localStorage.removeItem('cart_ids');
      // Redirect to My Reports after short delay
      setTimeout(() => navigate('/my-reports'), 3000);
    } else if (cancelled === 'true') {
      setStatus('cancelled');
    } else {
      // No payment context — redirect to order page
      navigate('/order');
    }
  }, [searchParams, navigate]);

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '32px', maxWidth: '500px', margin: '0 auto' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#22c55e', marginBottom: '16px', display: 'block' }}></i>
                <h2 style={{ color: '#22c55e', marginBottom: '12px' }}>Payment Successful!</h2>
                <p style={{ color: '#c7cfdd' }}>Your reports are being generated. Redirecting to My Reports...</p>
              </div>
            </div>
          )}

          {status === 'cancelled' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', padding: '32px', maxWidth: '500px', margin: '0 auto' }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '16px', display: 'block' }}></i>
                <h2 style={{ color: '#fbbf24', marginBottom: '12px' }}>Payment Cancelled</h2>
                <p style={{ color: '#c7cfdd', marginBottom: '20px' }}>Your payment was not completed. No charges were made.</p>
                <button className="btn" onClick={() => navigate('/order')} style={{ marginRight: '12px' }}>
                  Return to Cart
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/reports')}>
                  Browse Reports
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#7c5cfc' }}></i>
              <p style={{ marginTop: '16px', color: '#c7cfdd' }}>Loading...</p>
            </div>
          )}

          {/* Security badge */}
          <div style={{ textAlign: 'center', marginTop: '32px', opacity: 0.5, fontSize: '13px' }}>
            <i className="fas fa-lock" style={{ marginRight: '6px' }}></i>
            Secured by Stripe &middot; PCI DSS Level 1 Compliant
          </div>
        </div>
      </div>
    </PageShell>
  );
}
