import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useLoginEffects } from '../hooks/useLoginEffects';

export default function LoginPage() {
  useSharedEffects();
  useLoginEffects();

  return (
    <PageShell activeNav="login">
      <section className="login-section">
                    <div className="container">
                        <div className="login-card">
                            <div className="login-header">
                                <i className="fas fa-star-and-crescent"></i>
                                <h2>Welcome Back</h2>
                                <p>Enter your email to receive a verification code</p>
                            </div>
      
                            <form id="loginForm" className="login-form">
                                <div className="email-group">
                                    <input type="email" id="email" placeholder="Your email address" required />
                                    <button type="button" id="sendCodeBtn" className="btn-send">Send Code</button>
                                </div>
      
                                <div className="otp-group" id="otpGroup" style={{ display: 'none' }}>
                                    <label>Enter 6-digit verification code</label>
                                    <div className="otp-inputs">
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                        <input type="text" maxLength="1" className="otp-box" inputMode="numeric" />
                                    </div>
                                    <p className="timer" id="timer"></p>
                                </div>
      
                                <button type="submit" id="verifyBtn" className="btn-verify" style={{ display: 'none' }}>Verify & Continue</button>
                            </form>
      
                            <div className="login-footer">
                                <p>By continuing, you agree to our
                                    <a href="#" id="terms-link-login">Terms of Use</a> and
                                    <a href="#" id="privacy-link-login">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
    </PageShell>
  );
}
