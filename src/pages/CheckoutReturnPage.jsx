/**
 * CheckoutReturnPage — Post-payment return handler for Stripe Embedded Checkout.
 *
 * Stripe redirects here after payment with ?session_id={CHECKOUT_SESSION_ID}.
 * Checks session status via backend and shows success/pending/error state.
 * Auto-redirects to the appropriate page after success.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CheckoutReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | complete | pending | error
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const razorpayPayment = searchParams.get('payment');
    const gateway = searchParams.get('gateway');

    // Razorpay success — already verified by frontend before redirect
    if (gateway === 'razorpay' && razorpayPayment === 'success') {
      setStatus('complete');
      localStorage.removeItem('cart');
      localStorage.removeItem('cart_ids');
      if (refreshUser) refreshUser();
      setTimeout(() => navigate('/my-reports', { replace: true }), 3000);
      return;
    }

    if (!sessionId) {
      navigate('/order', { replace: true });
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      try {
        const data = await api.get(`/v1/payment/session-status?session_id=${sessionId}`);

        if (data.status === 'complete') {
          setStatus('complete');
          setEmail(data.customer_email || '');

          // Also verify subscription if applicable
          try {
            await api.post('/v1/subscription/verify-stripe', { session_id: sessionId });
          } catch {
            // Not a subscription checkout — that's fine
          }

          if (refreshUser) await refreshUser();

          // Clear cart data
          localStorage.removeItem('cart');
          localStorage.removeItem('cart_ids');

          // Auto-redirect after 3 seconds
          setTimeout(() => navigate('/my-reports', { replace: true }), 3000);
          return;
        }

        // Still processing — retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          setStatus('pending');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Unable to verify payment status.');
        setStatus('error');
      }
    };

    checkStatus();
  }, [searchParams, navigate, refreshUser]);

  return (
    <PageShell activeNav="">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 20px',
      }}>
        <div style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}>
          {status === 'loading' && (
            <>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '36px', color: '#7b5bff', marginBottom: '20px', display: 'block' }}></i>
              <h2 style={{ color: '#e6edf3', marginBottom: '8px' }}>Verifying Payment...</h2>
              <p style={{ color: '#8b949e' }}>Please wait while we confirm your payment.</p>
            </>
          )}

          {status === 'complete' && (
            <>
              <i className="fas fa-check-circle" style={{ fontSize: '48px', color: '#3fb950', marginBottom: '20px', display: 'block' }}></i>
              <h2 style={{ color: '#e6edf3', marginBottom: '8px' }}>Payment Successful!</h2>
              <p style={{ color: '#8b949e' }}>
                {email ? `A confirmation has been sent to ${email}.` : 'Your payment has been processed.'}
              </p>
              <p style={{ color: '#484f58', fontSize: '13px', marginTop: '16px' }}>
                Redirecting you shortly...
              </p>
            </>
          )}

          {status === 'pending' && (
            <>
              <i className="fas fa-clock" style={{ fontSize: '48px', color: '#d29922', marginBottom: '20px', display: 'block' }}></i>
              <h2 style={{ color: '#e6edf3', marginBottom: '8px' }}>Payment Processing</h2>
              <p style={{ color: '#8b949e' }}>
                Your payment is still being processed. You'll receive a confirmation email once complete.
              </p>
              <button
                onClick={() => navigate('/my-reports', { replace: true })}
                style={{
                  marginTop: '20px',
                  padding: '10px 24px',
                  background: '#7b5bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Go to My Reports
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#f85149', marginBottom: '20px', display: 'block' }}></i>
              <h2 style={{ color: '#e6edf3', marginBottom: '8px' }}>Verification Failed</h2>
              <p style={{ color: '#8b949e' }}>{errorMsg || 'Unable to verify your payment. Please contact support.'}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => navigate('/order', { replace: true })}
                  style={{
                    padding: '10px 24px',
                    background: '#21262d',
                    color: '#e6edf3',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Return to Cart
                </button>
                <button
                  onClick={() => navigate('/my-reports', { replace: true })}
                  style={{
                    padding: '10px 24px',
                    background: '#7b5bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  My Reports
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
