import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  LogOut,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import "../admin/pages/Login.css";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"

  // Sign In state
  const [signInEmail, setSignInEmail] = useState(() => {
    return localStorage.getItem("safedrang_customer_email") || "";
  });
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem("safedrang_customer_email");
  });

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // Status & Loading
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { user, login, signup, loginWithGoogle, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      setMode("signup");
    } else if (params.get("mode") === "reset") {
      setMode("forgot");
    }
  }, [location]);

  // Handle Customer Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!signInEmail.trim() || !signInPassword) {
      setError("Please fill in both your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(signInEmail.trim(), signInPassword);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("safedrang_customer_email", signInEmail.trim());
        } else {
          localStorage.removeItem("safedrang_customer_email");
        }

        toast.success(`Welcome back, ${result.user?.name || "Patron"}!`, {
          icon: "✨",
        });

        navigate(from, { replace: true });
      } else {
        setError(result.error || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "Sign in failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Customer Sign Up (Create Account)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!signUpName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!signUpEmail.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(
        signUpEmail.trim(),
        signUpPassword,
        signUpName.trim()
      );

      if (result.success) {
        toast.success(`Account created! Welcome to Safed Rang, ${signUpName.trim()}!`, {
          icon: "🧵",
        });

        navigate(from, { replace: true });
      } else {
        setError(result.error || "Could not create account. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "Account creation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign In for Customers
  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle(from);
      if (!result.success) {
        setError(result.error || "Google sign in failed. Please try again.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError("Google authentication error.");
      setIsGoogleLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess(false);

    const targetEmail = forgotEmail.trim() || signInEmail.trim();
    if (!targetEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const result = await resetPassword(targetEmail);
      if (result.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(result.error || "Could not send password reset link.");
      }
    } catch (err) {
      setForgotError(err?.message || "Failed to request password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  // If user is already logged in as customer, show elegant profile card
  if (user && mode !== "forgot") {
    return (
      <div className="heritage-login-wrapper">
        <div className="heritage-login-bg" />
        <div className="heritage-login-overlay" />

        <header className="heritage-login-topbar">
          <Link to="/" className="heritage-back-link">
            <ArrowLeft size={16} />
            <span>Return to Boutique</span>
          </Link>
          <div className="heritage-topbar-badge">
            <Sparkles size={14} className="gold-sparkle" />
            <span>Lucknowi Chikankari Heritage</span>
          </div>
        </header>

        <main className="heritage-login-main">
          <div className="heritage-glass-card" style={{ maxWidth: "460px", textAlign: "center" }}>
            <div className="card-filigree corner-tl" aria-hidden="true"></div>
            <div className="card-filigree corner-br" aria-hidden="true"></div>

            <div className="glass-card-header">
              <div className="heritage-brand-logo-frame">
                <img src="/favicon.png" alt="Safed Rang" className="heritage-brand-logo-img" />
              </div>
              <h1 className="heritage-brand-title">SAFED RANG</h1>
              <p className="heritage-brand-subtitle">VALUED PATRON PROFILE</p>
              <div className="heritage-motif-divider">
                <span className="motif-line"></span>
                <span className="motif-symbol">✦</span>
                <span className="motif-line"></span>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(212, 175, 55, 0.28)",
                borderRadius: "10px",
                padding: "20px",
                margin: "10px 0 24px 0",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#C4B3A3", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Active Account
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#FAF5EC", marginTop: "4px" }}>
                {user.name || user.email?.split("@")[0] || "Patron"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#C4B3A3", marginTop: "2px" }}>
                {user.email}
              </div>
              <div
                style={{
                  display: "inline-block",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#D4AF37",
                  background: "rgba(212, 175, 55, 0.12)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  marginTop: "12px",
                }}
              >
                ROLE: USER / PATRON
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link to="/shop" className="glass-primary-btn" style={{ textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <ShoppingBag size={17} />
                <span>Explore Saree Collection</span>
              </Link>
              <button
                type="button"
                className="glass-btn-secondary"
                onClick={async () => {
                  await logout();
                  toast.success("Signed out successfully");
                }}
                style={{ width: "100%", padding: "12px" }}
              >
                <LogOut size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                <span>Sign Out of Account</span>
              </button>
            </div>

            <footer className="glass-card-footer" style={{ marginTop: "28px" }}>
              <div className="security-status-tag">
                <ShieldCheck size={14} className="gold-icon" />
                <span>Safed Rang Patron Circle · GI Certified Handloom</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="heritage-login-wrapper">
      <div className="heritage-login-bg" />
      <div className="heritage-login-overlay" />

      {/* Top Bar with Return Link & Brand Badge */}
      <header className="heritage-login-topbar">
        <Link to="/" className="heritage-back-link">
          <ArrowLeft size={16} />
          <span>Return to Boutique</span>
        </Link>
        <div className="heritage-topbar-badge">
          <Sparkles size={14} className="gold-sparkle" />
          <span>Lucknowi Chikankari Heritage</span>
        </div>
      </header>

      {/* Main Glassmorphic Container */}
      <main className="heritage-login-main">
        <div className="heritage-glass-card" style={{ maxWidth: "480px" }}>
          {/* Decorative Corner Filigree Accents */}
          <div className="card-filigree corner-tl" aria-hidden="true"></div>
          <div className="card-filigree corner-br" aria-hidden="true"></div>

          {/* Card Header & Traditional Brand Logo */}
          <div className="glass-card-header">
            <div className="heritage-brand-logo-frame">
              <img src="/favicon.png" alt="Safed Rang" className="heritage-brand-logo-img" />
            </div>
            <h1 className="heritage-brand-title">SAFED RANG</h1>
            <p className="heritage-brand-subtitle">
              {mode === "signin"
                ? "PATRON CLIENTELE SIGN IN"
                : mode === "signup"
                ? "JOIN THE PATRON CIRCLE"
                : "ACCOUNT RECOVERY PORTAL"}
            </p>
            <div className="heritage-motif-divider">
              <span className="motif-line"></span>
              <span className="motif-symbol">✦</span>
              <span className="motif-line"></span>
            </div>
          </div>

          {/* Mode Switch Tabs (Sign In vs Create Account) */}
          {mode !== "forgot" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "5px",
                borderRadius: "30px",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                style={{
                  background: mode === "signin" ? "#AE8A54" : "transparent",
                  color: mode === "signin" ? "#FFFFFF" : "#C4B3A3",
                  border: "none",
                  borderRadius: "24px",
                  padding: "9px 16px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  fontFamily: '"Manrope", sans-serif',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                style={{
                  background: mode === "signup" ? "#AE8A54" : "transparent",
                  color: mode === "signup" ? "#FFFFFF" : "#C4B3A3",
                  border: "none",
                  borderRadius: "24px",
                  padding: "9px 16px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  fontFamily: '"Manrope", sans-serif',
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="glass-alert glass-alert-error" style={{ marginBottom: "20px" }}>
              <AlertCircle size={18} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* ── 1. SIGN IN VIEW ── */}
          {mode === "signin" && (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="glass-google-btn"
                disabled={isGoogleLoading || isLoading}
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
                <span>{isGoogleLoading ? "Connecting with Google…" : "Continue with Google"}</span>
              </button>

              <div className="glass-divider">
                <span>or sign in with email</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="glass-login-form">
                <div className="glass-form-group">
                  <label htmlFor="customer-email">Email Address</label>
                  <div className="glass-input-wrapper">
                    <Mail size={18} className="glass-input-icon" />
                    <input
                      id="customer-email"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="glass-form-group">
                  <div className="label-with-action">
                    <label htmlFor="customer-password">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(signInEmail);
                        setMode("forgot");
                        setError("");
                      }}
                      className="glass-link-btn forgot-link"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="glass-input-wrapper">
                    <Lock size={18} className="glass-input-icon" />
                    <input
                      id="customer-password"
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="glass-eye-btn"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                      title={showSignInPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="glass-options-row">
                  <label htmlFor="remember-customer" className="glass-checkbox-label">
                    <input
                      id="remember-customer"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="glass-checkbox-input"
                    />
                    <span className="checkbox-text">Remember my email</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="glass-primary-btn"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <span className="btn-spinner-text">
                      <span className="btn-mini-spinner"></span> Signing In…
                    </span>
                  ) : (
                    "Sign In to Safed Rang"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── 2. CREATE ACCOUNT VIEW (SIGN UP) ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="glass-login-form">
              <div className="glass-form-group">
                <label htmlFor="signup-name">Full Name</label>
                <div className="glass-input-wrapper">
                  <User size={18} className="glass-input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Sushma Sharma"
                    required
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="glass-form-group">
                <label htmlFor="signup-email">Email Address</label>
                <div className="glass-input-wrapper">
                  <Mail size={18} className="glass-input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="glass-form-group">
                <label htmlFor="signup-password">Create Password (min. 6 characters)</label>
                <div className="glass-input-wrapper">
                  <Lock size={18} className="glass-input-icon" />
                  <input
                    id="signup-password"
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="glass-eye-btn"
                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                    title={showSignUpPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showSignUpPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="glass-form-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <div className="glass-input-wrapper">
                  <Lock size={18} className="glass-input-icon" />
                  <input
                    id="signup-confirm-password"
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <p style={{ fontSize: "0.76rem", color: "#C4B3A3", margin: "4px 0 16px 0", lineHeight: "1.5" }}>
                Creating an account assigns you Patron membership with access to orders, GI-certified craft updates, and one-of-one heirloom previews.
              </p>

              <button
                type="submit"
                className="glass-primary-btn"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <span className="btn-spinner-text">
                    <span className="btn-mini-spinner"></span> Creating Account…
                  </span>
                ) : (
                  "Create Patron Account"
                )}
              </button>
            </form>
          )}

          {/* ── 3. FORGOT PASSWORD VIEW ── */}
          {mode === "forgot" && (
            <div className="forgot-password-panel">
              <div className="forgot-panel-intro">
                <div className="forgot-icon-bubble">
                  <KeyRound size={22} />
                </div>
                <h3>Reset Password</h3>
                <p>
                  Enter your registered patron email. We will send secure recovery instructions to your inbox.
                </p>
              </div>

              {forgotSuccess ? (
                <div className="glass-success-notice">
                  <CheckCircle2 size={20} className="notice-icon" />
                  <div>
                    <strong>Reset link dispatched!</strong>
                    <p>
                      Check your inbox for <em>{forgotEmail || signInEmail}</em> to set a new password.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
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
                        value={forgotEmail || signInEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
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
                        <span className="btn-mini-spinner"></span> Sending Link…
                      </span>
                    ) : (
                      "Send Password Reset Link"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
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
          )}

          {/* Security & Heritage Footer */}
          <footer className="glass-card-footer">
            <div className="security-status-tag">
              <ShieldCheck size={14} className="gold-icon" />
              <span>Safed Rang Patron Circle · Lucknow, Uttar Pradesh</span>
            </div>
            <div className="footer-copyright">
              © {new Date().getFullYear()} SAFED RANG · HANDCRAFTED HEIRLOOM CRAFT
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
