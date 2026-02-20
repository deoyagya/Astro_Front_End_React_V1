import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

export default function PaymentPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const [method, setMethod] = useState('razorpay');

  const processPayment = () => {
    window.alert(`Proceeding with ${method} payment. This is a demo – in a real implementation, you would redirect to the payment gateway.`);
  };

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
          <div className="payment-header">
            <h1>Complete Payment</h1>
            <p>Select your preferred payment method</p>
          </div>

          <div className="payment-methods">
            <label className={`method ${method === 'razorpay' ? 'selected' : ''}`} id="razorpayMethod">
              <input type="radio" name="payment" value="razorpay" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
              <div className="method-content">
                <i className="fas fa-bolt"></i>
                <div>
                  <h3>Razorpay</h3>
                  <p>Pay via UPI, Credit/Debit Card, Net Banking, Wallet</p>
                </div>
              </div>
            </label>

            <label className={`method ${method === 'stripe' ? 'selected' : ''}`} id="stripeMethod">
              <input type="radio" name="payment" value="stripe" checked={method === 'stripe'} onChange={() => setMethod('stripe')} />
              <div className="method-content">
                <i className="fab fa-stripe-s"></i>
                <div>
                  <h3>Stripe</h3>
                  <p>International payments accepted</p>
                </div>
              </div>
            </label>

            <div className="payment-actions">
              <button className="btn" onClick={processPayment}>Pay Now</button>
              <button className="btn btn-outline" onClick={() => navigate('/order')}>Back to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
