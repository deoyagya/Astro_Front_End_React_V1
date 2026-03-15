import { useAuth } from '../context/AuthContext';

export default function SiteFooter() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
                <li><a href="/birth-chart"><i className="fas fa-chevron-right"></i> Birth Chart (Kundli)</a></li>
                <li><a href="/dasha"><i className="fas fa-chevron-right"></i> Dasha Calculator</a></li>
                <li><a href="/compatibility"><i className="fas fa-chevron-right"></i> Compatibility</a></li>
                <li><a href="/horoscope"><i className="fas fa-chevron-right"></i> Daily Horoscope</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Kundli Reports</h4>
              <ul>
                <li><a href="/birth-chart"><i className="fas fa-chevron-right"></i> Free Kundli Generation</a></li>
                <li><a href="/compatibility"><i className="fas fa-chevron-right"></i> Kundli Matching</a></li>
                <li><a href="/manglik-dosha"><i className="fas fa-chevron-right"></i> Manglik Dosha Remedies</a></li>
                <li><a href="/reports"><i className="fas fa-chevron-right"></i> Birth Chart Analysis (Premium)</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Consult Astrologer</h4>
              <ul>
                <li><a href="/chat"><i className="fas fa-chevron-right"></i> Live Chat with Astrologer</a></li>
                <li><a href="/ask-question"><i className="fas fa-chevron-right"></i> Ask a Question</a></li>
                <li><a href="/pricing"><i className="fas fa-chevron-right"></i> Pricing Plans</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Contact</h4>
              <p><i className="fas fa-envelope"></i> support@astroyagyadeo.com</p>
            </div>
          </div>
        )}

        <div className="footer-bottom">
          <p>© 2025 – {new Date().getFullYear()} Astro Yagya. All rights reserved. | <a href="#" id="terms-link">Terms of Use</a> | <a href="#" id="privacy-link">Privacy Policy</a></p>
        </div>
      </div>
    </footer>
  );
}
