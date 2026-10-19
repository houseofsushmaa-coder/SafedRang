import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  KeyRound,
} from "lucide-react";
import "./Login.css";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const AdminLogin = () => {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("safedrang_remembered_email") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem("safedrang_remembered_email");
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot password flow
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Rate-limiting / Brute-force protection state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const { login, loginWithGoogle, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("error") === "unauthorized") {
      setError("Access denied: You do not have verified Admin privileges.");
    }
    if (params.get("mode") === "reset") {
      setIsForgotMode(true);
    }
  }, [location]);

  // Lockout countdown timer
  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setFailedAttempts(0);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer, failedAttempts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (!result.isAdmin) {
          setError(
            `Access denied: Your account role is "${result.role}". Only verified store admins can access the administrative dashboard.`
          );
          await logout();
        } else {
          setFailedAttempts(0);
          if (rememberMe) {
            localStorage.setItem("safedrang_remembered_email", email);
          } else {
            localStorage.removeItem("safedrang_remembered_email");
          }
          navigate("/admin");
        }
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          setLockoutTimer(LOCKOUT_SECONDS);
          setError(`Too many failed attempts. Login temporarily locked for ${LOCKOUT_SECONDS}s.`);
        } else {
          setError(result.error || "Invalid email or password.");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle("/admin");
      if (!result.success) {
        setError(result.error || "Google authentication failed. Please try again.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError("Google authentication error. Ensure Google provider is enabled in Supabase.");
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess(false);
    setForgotLoading(true);

    const targetEmail = forgotEmail.trim() || email.trim();
    if (!targetEmail) {
      setForgotError("Please enter your registered email address.");
      setForgotLoading(false);
      return;
    }

    try {
      const result = await resetPassword(targetEmail);
      if (result.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(result.error || "Could not send reset link. Please verify your email.");
      }
    } catch (err) {
      setForgotError("An unexpected error occurred while requesting password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="heritage-login-wrapper">
      {/* Background Ambience Layer with Chikankari Saree & Heritage Diya */}
      <div className="heritage-login-bg" aria-hidden="true" />
      <div className="heritage-login-overlay" aria-hidden="true" />

      {/* Navigation Top Bar */}
      <header className="heritage-login-topbar">
        <Link to="/" className="heritage-back-link" title="Return to Safed Rang Boutique">
          <ArrowLeft size={16} />
          <span>Return to Boutique</span>
        </Link>
        <div className="heritage-topbar-tag">
          <Sparkles size={14} className="gold-sparkle" />
          <span>Lucknowi Chikankari Heritage</span>
        </div>
      </header>

      {/* Main Glassmorphic Container */}
      <main className="heritage-login-main">
        <div className="heritage-glass-card">
          {/* Decorative Corner Filigree Accents */}
          <div className="card-filigree corner-tl" aria-hidden="true"></div>
          <div className="card-filigree corner-br" aria-hidden="true"></div>

          {/* Card Header & Traditional Monogram / Brand Logo */}
          <div className="glass-card-header">
            <div className="heritage-brand-logo-frame">
              <img
                src="/favicon.png"
                alt="Safed Rang"
                className="heritage-brand-logo-img"
              />
            </div>
            <h1 className="heritage-brand-title">SAFED RANG</h1>
            <p className="heritage-brand-subtitle">
              {isForgotMode ? "ACCOUNT RECOVERY PORTAL" : "ADMINISTRATIVE CONSOLE"}
            </p>
            <div className="heritage-motif-divider">
              <span className="motif-line"></span>
              <span className="motif-symbol">✦</span>
              <span className="motif-line"></span>
            </div>
          </div>

          {/* Conditional: Forgot Password vs Sign In */}
          {isForgotMode ? (
            /* ── Forgot Password View ── */
            <div className="forgot-password-panel">
              <div className="forgot-panel-intro">
                <div className="forgot-icon-bubble">
                  <KeyRound size={22} />
                </div>
                <h3>Reset Password</h3>
                <p>
                  Enter your registered admin or store email. We will dispatch a secure link to
                  restore your access credentials.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="glass-success-notice">
                  <CheckCircle2 size={20} className="notice-icon" />
                  <div>
                    <strong>Reset link dispatched!</strong>
                    <p>
                      Check your inbox for <em>{forgotEmail || email}</em>. Follow the instructions
                      in the email to set a new password.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotSuccess(false);
                    }}
                    className="glass-btn-secondary"
                    style={{ marginTop: "14px", width: "100%" }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="glass-login-form">
                  {forgotError && (
                    <div className="glass-alert glass-alert-error">
                      <AlertCircle size={18} className="alert-icon" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div className="glass-form-group">
                    <label htmlFor="forgot-email">Registered Email Address</label>
                    <div className="glass-input-wrapper">
                      <Mail size={18} className="glass-input-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail || email}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@safedrang.com"
                        required
                        disabled={forgotLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="glass-primary-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <span className="btn-spinner-text">
                        <span className="btn-mini-spinner"></span> Sending Reset Link…
                      </span>
                    ) : (
                      "Send Password Reset Link"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotError("");
                    }}
                    className="glass-link-btn"
                    style={{ marginTop: "12px", width: "100%", textAlign: "center" }}
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ── Main Sign In View ── */
            <>
              {/* Lockout Alert */}
              {lockoutTimer > 0 && (
                <div className="glass-alert glass-alert-warning">
                  <Clock size={18} className="alert-icon" />
                  <span>
                    Too many failed attempts. Security cooldown active. Retry in{" "}
                    <strong>{lockoutTimer}s</strong>.
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {error && lockoutTimer === 0 && (
                <div className="glass-alert glass-alert-error">
                  <AlertCircle size={18} className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="glass-google-btn"
                disabled={isGoogleLoading || isLoading || lockoutTimer > 0}
              >
                <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isGoogleLoading ? "Connecting with Google…" : "Continue with Google"}
                </span>
              </button>

              {/* Or Divider */}
              <div className="glass-divider">
                <span>or authenticate with credentials</span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="glass-login-form">
                <div className="glass-form-group">
                  <label htmlFor="admin-email">Admin / Store Email</label>
                  <div className="glass-input-wrapper">
                    <Mail size={18} className="glass-input-icon" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@safedrang.com"
                      required
                      autoComplete="username"
                      disabled={lockoutTimer > 0 || isLoading}
                    />
                  </div>
                </div>

                <div className="glass-form-group">
                  <div className="label-with-action">
                    <label htmlFor="admin-password">Secure Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setIsForgotMode(true);
                      }}
                      className="glass-link-btn forgot-link"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="glass-input-wrapper">
                    <Lock size={18} className="glass-input-icon" />
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      disabled={lockoutTimer > 0 || isLoading}
                    />
                    <button
                      type="button"
                      className="glass-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="glass-options-row">
                  <label htmlFor="remember-workstation" className="glass-checkbox-label">
                    <input
                      id="remember-workstation"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="glass-checkbox-input"
                    />
                    <span className="checkbox-text">Remember this workstation</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="glass-primary-btn"
                  disabled={isLoading || isGoogleLoading || lockoutTimer > 0}
                >
                  {isLoading ? (
                    <span className="btn-spinner-text">
                      <span className="btn-mini-spinner"></span> Authenticating Credentials…
                    </span>
                  ) : (
                    "Enter Portal"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Security & Heritage Footer */}
          <footer className="glass-card-footer">
            <div className="security-status-tag">
              <ShieldCheck size={14} className="gold-icon" />
              <span>256-Bit Encrypted · Role-Based Access Control</span>
            </div>
            <div className="footer-copyright">
              Safed Rang Craft Collective · Lucknow, Uttar Pradesh
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
