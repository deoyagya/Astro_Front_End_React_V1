/**
 * CheckoutSuccessPage — Post-payment success/verification screen.
 *
 * Phase 48: Stripe redirects here after successful checkout.
 *
 * Flow:
 *   1. Stripe redirects to /checkout/success?session_id=cs_xxx
 *   2. This page auto-verifies the session with backend
 *   3. Shows success confirmation with plan details
 *   4. Redirects to subscription management after brief delay
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStyles } from '../context/StyleContext';

export default function CheckoutSuccessPage() {
  const { getOverride } = useStyles('payment');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser, isAuthenticated } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [planName, setPlanName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isDev = searchParams.get('dev') === 'true';

    // Dev mode: skip verification
    if (isDev) {
      setStatus('success');
      setPlanName('your selected plan');
      return;
    }

    if (!sessionId) {
      setStatus('error');
      setError('No session ID found. Please contact support if you were charged.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const verify = async () => {
      try {
        const result = await api.post('/v1/subscription/verify-stripe', {
          session_id: sessionId,
        });
        if (refreshUser) await refreshUser();
        setPlanName(result.plan_name || result.plan || 'your plan');
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Payment verification failed. Please contact support.');
      }
    };

    verify();
  }, [searchParams, isAuthenticated, refreshUser, navigate]);

  return (
    <PageShell activeNav="pricing">
      <div className="cos">
        {status === 'verifying' && (
          <div className="cos-card">
            <div className="cos-spinner"></div>
            <h2 className="cos-title">Verifying your payment...</h2>
            <p className="cos-text">Please wait while we confirm your subscription.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="cos-card success">
            <div className="cos-icon-wrap">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="cos-title">You're all set!</h2>
            <p className="cos-text">
              Your <strong>{planName}</strong> subscription is now active.
              You have full access to all included features.
            </p>
            <div className="cos-actions">
              <button
                className="cos-btn primary"
                onClick={() => navigate('/my-data/subscription')}
              >
                View My Subscription
              </button>
              <button
                className="cos-btn secondary"
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="cos-card error">
            <div className="cos-icon-wrap err">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 className="cos-title">Something went wrong</h2>
            <p className="cos-text">{error}</p>
            <div className="cos-actions">
              <button
                className="cos-btn primary"
                onClick={() => navigate('/pricing')}
              >
                Back to Pricing
              </button>
              <button
                className="cos-btn secondary"
                onClick={() => navigate('/my-data/subscription')}
              >
                Check My Subscription
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cos {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          padding: 40px 20px;
        }
        .cos-card {
          text-align: center;
          max-width: 480px;
          width: 100%;
          background: rgba(18, 16, 32, 0.9);
          border: 1px solid #2a2545;
          border-radius: 20px;
          padding: 48px 40px;
        }
        .cos-card.success {
          border-color: rgba(46, 213, 115, 0.3);
        }
        .cos-card.error {
          border-color: rgba(239, 68, 68, 0.3);
        }
        .cos-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #2a2545;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: cos-spin 0.7s linear infinite;
          margin: 0 auto 24px;
        }
        @keyframes cos-spin {
          to { transform: rotate(360deg); }
        }
        .cos-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          background: rgba(46, 213, 115, 0.12);
          color: #2ed573;
          font-size: 1.6rem;
        }
        .cos-icon-wrap.err {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }
        .cos-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 12px;
        }
        .cos-text {
          font-size: 0.95rem;
          color: #9b95aa;
          margin: 0 0 28px;
          line-height: 1.6;
        }
        .cos-text strong {
          color: #c4b5ff;
        }
        .cos-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cos-btn {
          padding: 13px 24px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
        }
        .cos-btn.primary {
          background: #8b5cf6;
          color: #fff;
        }
        .cos-btn.primary:hover {
          background: #7c3aed;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.35);
        }
        .cos-btn.secondary {
          background: transparent;
          border: 1px solid #3a3555;
          color: #c4b5ff;
        }
        .cos-btn.secondary:hover {
          border-color: #8b5cf6;
          color: #fff;
        }
        @media (max-width: 480px) {
          .cos-card {
            padding: 36px 24px;
          }
          .cos-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </PageShell>
  );
}
