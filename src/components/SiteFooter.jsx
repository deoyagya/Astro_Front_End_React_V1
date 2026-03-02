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
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/"><i className="fas fa-chevron-right"></i> Home</a></li>
                <li><a href="/#free-tools"><i className="fas fa-chevron-right"></i> Free Tools</a></li>
                <li><a href="/reports"><i className="fas fa-chevron-right"></i> Reports</a></li>
                <li><a href="/login"><i className="fas fa-chevron-right"></i> Login</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Tools</h4>
              <ul>
                <li><a href="/birth-chart"><i className="fas fa-chevron-right"></i> Birth Chart</a></li>
                <li><a href="/dasha"><i className="fas fa-chevron-right"></i> Dasha Calculator</a></li>
                <li><a href="/compatibility"><i className="fas fa-chevron-right"></i> Compatibility</a></li>
                <li><a href="/horoscope"><i className="fas fa-chevron-right"></i> Horoscope</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4>Contact</h4>
              <p><i className="fas fa-envelope"></i> support@stroyagya.com</p>
              <p><i className="fas fa-phone-alt"></i> +91 98765 43210</p>
            </div>
          </div>
        )}

        <div className="footer-bottom">
          <p>© 2025 Astro Yagya. All rights reserved. | <a href="#" id="terms-link">Terms of Use</a> | <a href="#" id="privacy-link">Privacy Policy</a></p>
        </div>
      </div>
    </footer>
  );
}
