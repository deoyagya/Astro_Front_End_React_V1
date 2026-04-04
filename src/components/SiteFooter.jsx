import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLegalModal } from '../context/LegalModalContext';

export default function SiteFooter() {
  const { user } = useAuth();
  const { openPrivacy, openTerms } = useLegalModal();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleNavigate = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="footer">
      <div className="container">
        {!isAdmin && (
          <div className="footer-grid">
            <div className="footer-about">
              <h4><i className="fas fa-star-and-crescent"></i> Astro Yagya</h4>
              <p>Ancient Vedic wisdom for modern life. Accurate predictions, personalized guidance, and effective remedies.</p>
            </div>

            <div className="footer-links">
              <h4>Free Tools</h4>
              <ul>
                <li><a href="/birth-chart" onClick={(e) => handleNavigate(e, '/birth-chart')}><i className="fas fa-chevron-right"></i> Birth Chart (Kundli)</a></li>
                <li><a href="/dasha" onClick={(e) => handleNavigate(e, '/dasha')}><i className="fas fa-chevron-right"></i> Dasha Calculator</a></li>
                <li><a href="/compatibility" onClick={(e) => handleNavigate(e, '/compatibility')}><i className="fas fa-chevron-right"></i> Compatibility</a></li>
                <li><a href="/horoscope" onClick={(e) => handleNavigate(e, '/horoscope')}><i className="fas fa-chevron-right"></i> Daily Horoscope</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Kundli Reports</h4>
              <ul>
                <li><a href="/birth-chart" onClick={(e) => handleNavigate(e, '/birth-chart')}><i className="fas fa-chevron-right"></i> Free Kundli Generation</a></li>
                <li><a href="/compatibility" onClick={(e) => handleNavigate(e, '/compatibility')}><i className="fas fa-chevron-right"></i> Kundli Matching</a></li>
                <li><a href="/manglik-dosha" onClick={(e) => handleNavigate(e, '/manglik-dosha')}><i className="fas fa-chevron-right"></i> Manglik Dosha Remedies</a></li>
                <li><a href="/birth-chart-analysis" onClick={(e) => handleNavigate(e, '/birth-chart-analysis')}><i className="fas fa-chevron-right"></i> Birth Chart Analysis (Premium)</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Consult Astrologer</h4>
              <ul>
                <li><a href="/chat" onClick={(e) => handleNavigate(e, '/chat')}><i className="fas fa-chevron-right"></i> Live Chat with Astrologer</a></li>
                <li><a href="/ask-question" onClick={(e) => handleNavigate(e, '/ask-question')}><i className="fas fa-chevron-right"></i> Ask a Question</a></li>
                <li><a href="/pricing" onClick={(e) => handleNavigate(e, '/pricing')}><i className="fas fa-chevron-right"></i> Pricing Plans</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Contact</h4>
              <p><i className="fas fa-envelope"></i> support@astroyagyadeo.com</p>
            </div>
          </div>
        )}

        <div className="footer-bottom">
          <p>
            © 2025 – {new Date().getFullYear()} Astro Yagya. All rights reserved. |{' '}
            <button type="button" className="footer-link-button" onClick={openTerms}>Terms of Use</button>
            {' '}|{' '}
            <button type="button" className="footer-link-button" onClick={openPrivacy}>Privacy Policy</button>
          </p>
        </div>
      </div>
    </footer>
  );
}
