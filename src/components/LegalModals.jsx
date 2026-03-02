export default function LegalModals() {
  return (
    <>
      <div className="modal" id="termsModal">
        <div className="modal-content">
          <button className="modal-close" id="closeTerms"><i className="fas fa-times"></i></button>
          <h2>Terms of Use</h2>
          <div className="modal-body">
            <p>Last updated: February 2025</p>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using Astro Yagya services, you agree to be bound by these Terms of Use.</p>
            <h3>2. Service Description</h3>
            <p>Astro Yagya provides astrological calculations, interpretations, and guidance based on Vedic astrology principles. All services are for entertainment and guidance purposes only.</p>
            <h3>3. User Responsibilities</h3>
            <p>You agree to provide accurate birth information and use the services responsibly.</p>
            <h3>4. Privacy</h3>
            <p>Your data is protected as described in our Privacy Policy.</p>
            <h3>5. Limitation of Liability</h3>
            <p>Astro Yagya is not liable for any decisions made based on astrological guidance.</p>
          </div>
        </div>
      </div>

      <div className="modal" id="privacyModal">
        <div className="modal-content">
          <button className="modal-close" id="closePrivacy"><i className="fas fa-times"></i></button>
          <h2>Privacy Policy</h2>
          <div className="modal-body">
            <p>Last updated: February 2025</p>
            <h3>1. Information We Collect</h3>
            <p>We collect birth details (date, time, place), email address, and usage data to provide astrological services.</p>
            <h3>2. How We Use Information</h3>
            <p>To generate birth charts, provide predictions, and improve our services.</p>
            <h3>3. Data Security</h3>
            <p>We implement security measures to protect your personal information.</p>
            <h3>4. Third Party Disclosure</h3>
            <p>We do not sell or share your data with third parties.</p>
            <h3>5. Your Rights</h3>
            <p>You may request deletion of your data at any time.</p>
          </div>
        </div>
      </div>
    </>
  );
}
