import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import '../styles/report-pages.css';

const REPORTS = [
  { id: 'career', name: 'Career & Finance Report', price: 1499, icon: 'fa-briefcase' },
  { id: 'love', name: 'Love & Marriage Report', price: 1799, icon: 'fa-heart' },
  { id: 'education', name: 'Education & Intelligence Report', price: 1299, icon: 'fa-graduation-cap' },
  { id: 'health', name: 'Health & Wellness Report', price: 1399, icon: 'fa-heartbeat' },
  { id: 'spiritual', name: 'Spiritual Growth Report', price: 1599, icon: 'fa-om' },
  { id: 'family', name: 'Family & Children Report', price: 1499, icon: 'fa-home' }
];

export default function OrderPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart') || '[]');
    if (Array.isArray(saved)) setCart(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const hasReport = (id) => cart.some((item) => item.id === id);

  const toggleReport = (report) => {
    setCart((prev) => {
      if (prev.some((item) => item.id === report.id)) {
        return prev.filter((item) => item.id !== report.id);
      }
      return [...prev, report];
    });
  };

  const removeReport = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const proceedToPayment = () => {
    if (!cart.length) {
      window.alert('Please select at least one report.');
      return;
    }
    navigate('/payment');
  };

  return (
    <PageShell activeNav="reports">
      <div className="report-page">
        <div className="container">
          <div className="cart-header">
            <h1>Select Your Reports</h1>
            <p>Choose the life areas you want to explore in depth</p>
          </div>

          <div className="report-list" id="reportList">
            {REPORTS.map((report) => (
              <div className="report-item" key={report.id}>
                <input
                  type="checkbox"
                  id={report.id}
                  checked={hasReport(report.id)}
                  onChange={() => toggleReport(report)}
                />
                <div className="report-info">
                  <h3><i className={`fas ${report.icon}`}></i> {report.name}</h3>
                  <p>Detailed Vedic astrology analysis with predictions and remedies</p>
                </div>
                <div className="report-price">₹{report.price}</div>
                <button className="delete-btn" onClick={() => removeReport(report.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary" id="cartSummary">
            <h3>Order Summary</h3>
            <div id="selectedItems">
              {!cart.length ? (
                <p className="empty-cart">No reports selected</p>
              ) : (
                <ul style={{ listStyle: 'none', marginBottom: '20px' }}>
                  {cart.map((item) => (
                    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="total-amount">
              Total: <span id="totalPrice">₹{total}</span>
            </div>
            <button className="btn place-order-btn" id="placeOrderBtn" onClick={proceedToPayment}>
              Place Order
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
