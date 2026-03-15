import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { useAuth } from '../context/AuthContext';
import { useStyles } from '../context/StyleContext';
import { api } from '../api/client';

const OTP_LENGTH = 6;
const TIMER_SECONDS = 120;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

export default function LoginPage() {
  useSharedEffects();
  const { login, isAuthenticated } = useAuth();
  const { getOverride } = useStyles('login');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/reports';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  // ---- State ----
  const [identifier, setIdentifier] = useState('');
  const [inputType, setInputType] = useState(null); // "email" | "sms" | null
  const [countryCode, setCountryCode] = useState('+91');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dialCodes, setDialCodes] = useState([]);
  const [step, setStep] = useState('input'); // "input" | "otp"
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedId, setMaskedId] = useState('');
  const [fullName, setFullName] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);
  const googleBtnRef = useRef(null);
  const fbInitialized = useRef(false);

  // ---- Social login handler (shared) ----
  const handleSocialLogin = useCallback(async (provider, tokenPayload) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.post(`/v1/auth/social/${provider}`, tokenPayload);
      await login({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || `${provider} sign-in failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [login, navigate, from]);

  // ---- Initialize Google GSI ----
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          handleSocialLogin('google', { id_token: response.credential });
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 340,
          text: 'continue_with',
          shape: 'pill',
        });
      }
    };

    // SDK may already be loaded or may load later
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [handleSocialLogin]);

  // ---- Initialize Facebook SDK ----
  useEffect(() => {
    if (!FACEBOOK_APP_ID || fbInitialized.current) return;

    const initFB = () => {
      if (!window.FB) return;
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
      fbInitialized.current = true;
    };

    // Load Facebook SDK dynamically (avoids GDPR autoload from index.html)
    if (window.FB) {
      initFB();
    } else if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = initFB;
      document.body.appendChild(script);
    }
  }, []);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh and try again.');
      return;
    }
    setLoading(true);
    setError('');
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          handleSocialLogin('facebook', { access_token: response.authResponse.accessToken });
        } else {
          setLoading(false);
        }
      },
      { scope: 'email,public_profile' },
    );
  };

  // ---- Auto-detect country code from IP ----
  useEffect(() => {
    api.get('/v1/auth/geo/detect')
      .then((data) => {
        setCountryCode(data.dial_code || '+91');
      })
      .catch(() => {});

    api.get('/v1/auth/geo/dial-codes')
      .then((codes) => setDialCodes(codes))
      .catch(() => {});
  }, []);

  // ---- Detect email vs phone ----
  useEffect(() => {
    const val = identifier.trim();
    if (val.includes('@')) {
      setInputType('email');
    } else if (/^\d{4,}$/.test(val.replace(/[\s\-()]/g, ''))) {
      setInputType('sms');
    } else {
      setInputType(null);
    }
  }, [identifier]);

  // ---- Timer countdown ----
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timerRef.current);
    }
  }, [timer]);

  // ---- Build full identifier ----
  const getFullIdentifier = useCallback(() => {
    if (inputType === 'email') return identifier.trim();
    // For phone: prepend country code if not already present
    const phone = identifier.trim().replace(/[\s\-()]/g, '');
    if (phone.startsWith('+')) return phone;
    return `${countryCode}${phone}`;
  }, [identifier, inputType, countryCode]);

  // ---- Send OTP ----
  const handleSendCode = async () => {
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!inputType) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('/v1/auth/otp/send', {
        identifier: getFullIdentifier(),
      });
      setMaskedId(result.masked);
      // Pre-fill name for returning users
      if (result.full_name) {
        setFullName(result.full_name);
      }
      setStep('otp');
      setTimer(TIMER_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      // Auto-focus first OTP box
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---- Resend OTP ----
  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.post('/v1/auth/otp/resend', {
        identifier: getFullIdentifier(),
      });
      setMaskedId(result.masked);
      if (result.full_name) {
        setFullName(result.full_name);
      }
      setTimer(TIMER_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ---- OTP input handlers ----
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // single digit
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Submit on Enter when all digits filled
    if (e.key === 'Enter') {
      const code = otp.join('');
      if (code.length === OTP_LENGTH) handleVerify();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
      e.preventDefault();
    }
  };

  // ---- Verify OTP ----
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await api.postLong('/v1/auth/otp/verify', {
        identifier: getFullIdentifier(),
        otp_code: code,
        full_name: fullName.trim(),
        marketing_consent: marketingConsent,
      }, 30_000);
      // Login (stores token, triggers user fetch)
      await login({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      // Navigate to the originally requested page
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || '';
      const isConnectionIssue =
        msg.includes('connection error') ||
        msg.includes('took too long') ||
        msg.includes('temporarily unavailable') ||
        msg.includes('try again in');
      if (isConnectionIssue) {
        // Keep OTP digits so user can retry without re-entering
        setError('Could not reach the server. Please check your connection and try again.');
      } else {
        // Invalid OTP or similar — clear and re-enter
        setError(msg || 'Invalid code. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- Back to input step ----
  const handleBack = () => {
    setStep('input');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setTimer(0);
  };

  // ---- Format timer ----
  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const hasSocialLogin = GOOGLE_CLIENT_ID || FACEBOOK_APP_ID;

  return (
    <PageShell activeNav="login">
      <section className="login-section" style={getOverride('loginSection')}>
        <div className="container">
          <div className="login-card">
            <div className="login-header" style={getOverride('loginHeader')}>
              <i className="fas fa-star-and-crescent"></i>
              <h2>Welcome</h2>
              <p>
                {step === 'input'
                  ? 'Sign in to access your astrological insights'
                  : `Code sent to ${maskedId}`}
              </p>
            </div>

            {error && (
              <div className="login-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {step === 'input' ? (
              /* ---- Step 1: Social + Enter email or phone ---- */
              <div className="login-form">
                {/* Social Login Buttons */}
                {hasSocialLogin && (
                  <>
                    <div className="social-buttons">
                      {GOOGLE_CLIENT_ID && (
                        <div ref={googleBtnRef} className="google-btn-container"></div>
                      )}
                      {FACEBOOK_APP_ID && (
                        <button
                          type="button"
                          className="btn-social btn-facebook"
                          onClick={handleFacebookLogin}
                          disabled={loading}
                        >
                          <i className="fab fa-facebook-f"></i> Continue with Facebook
                        </button>
                      )}
                    </div>
                    <div className="social-login-divider">
                      <span>or continue with email / phone</span>
                    </div>
                  </>
                )}

                <div className="identifier-group">
                  {inputType === 'sms' && (
                    <select
                      className="country-code-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {dialCodes.length > 0
                        ? dialCodes.map((dc) => (
                            <option key={dc.code} value={dc.dial_code}>
                              {dc.code} {dc.dial_code}
                            </option>
                          ))
                        : <option value={countryCode}>{countryCode}</option>
                      }
                    </select>
                  )}
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or phone number"
                    className={`identifier-input ${inputType === 'sms' ? 'with-code' : ''}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                    autoFocus
                  />
                </div>
                {inputType && (
                  <p className="input-type-hint">
                    <i className={`fas fa-${inputType === 'email' ? 'envelope' : 'phone'}`}></i>
                    {' '}Code will be sent via {inputType === 'email' ? 'email' : 'SMS'}
                  </p>
                )}
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#" id="terms-link-cb">Terms of Use</a> and{' '}
                    <a href="#" id="privacy-link-cb">Privacy Policy</a>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn-send"
                  onClick={handleSendCode}
                  disabled={loading || !inputType || !termsAccepted}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Send Code</>
                  )}
                </button>
              </div>
            ) : (
              /* ---- Step 2: Enter OTP ---- */
              <div className="login-form">
                <label className="otp-label">Enter 6-digit verification code</label>
                <div className="otp-inputs">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength="1"
                      inputMode="numeric"
                      className="otp-box"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      ref={(el) => (otpRefs.current[idx] = el)}
                    />
                  ))}
                </div>

                {timer > 0 && (
                  <p className="timer">Code expires in {formatTimer(timer)}</p>
                )}

                {/* Name + consent — shown during OTP step */}
                <div className="consent-group">
                  <input
                    type="text"
                    className="name-input"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && otp.join('').length === OTP_LENGTH && handleVerify()}
                    required
                  />
                  <label className="consent-checkbox">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                    />
                    <span>Send me astrological insights &amp; offers</span>
                  </label>
                </div>

                <button
                  type="button"
                  className="btn-verify"
                  onClick={handleVerify}
                  disabled={loading || otp.join('').length !== OTP_LENGTH}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                  ) : (
                    <><i className="fas fa-check-circle"></i> Verify & Continue</>
                  )}
                </button>

                <div className="otp-actions">
                  {timer === 0 && (
                    <button type="button" className="btn-resend" onClick={handleResend} disabled={loading}>
                      <i className="fas fa-redo"></i> Resend Code
                    </button>
                  )}
                  <button type="button" className="btn-back" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Change {inputType === 'email' ? 'email' : 'number'}
                  </button>
                </div>
              </div>
            )}

            <div className="login-footer">
              <p>Your data is secure and encrypted</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
