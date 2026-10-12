import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, Clock } from "lucide-react";
import "./AdminPages.css";
import "./Login.css";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Rate-limiting / Brute-force protection state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("error") === "unauthorized") {
      setError("Access denied: You do not have Admin privileges.");
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
      setFailedAttempts(0); // Reset after cooldown
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
            `Access denied: Your account role is "${result.role}". Only verified store admins can access this portal.`
          );
          await logout();
        } else {
          setFailedAttempts(0);
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
      // On success, Supabase will redirect to Google then back to /admin
    } catch (err) {
      setError("Google authentication error. Ensure Google provider is enabled in Supabase.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <span>S</span>
          </div>
          <h2>Safed Rang</h2>
          <p>Admin · Sign in to your store portal</p>
        </div>

        {/* Lockout Notice */}
        {lockoutTimer > 0 && (
          <div className="admin-lockout-box">
            <Clock size={18} />
            <span>Too many attempts. Retry in <strong>{lockoutTimer}s</strong></span>
          </div>
        )}

        {/* Error Notice */}
        {error && lockoutTimer === 0 && (
          <div className="admin-login-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="admin-google-btn"
          disabled={isGoogleLoading || isLoading || lockoutTimer > 0}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
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
          {isGoogleLoading ? "Connecting to Google..." : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div className="login-divider">
          <span>or sign in with email</span>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@safedrang.com"
                required
                disabled={lockoutTimer > 0}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={lockoutTimer > 0}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn"
            disabled={isLoading || isGoogleLoading || lockoutTimer > 0}
          >
            {isLoading ? "Authenticating..." : "Sign In to Admin"}
          </button>
        </form>

        {/* Footer & Security Badge */}
        <div className="admin-login-footer">
          <div>safedrang.com · Store Management</div>
          <div className="security-badge">
            <ShieldCheck size={14} color="#AE8A54" />
            <span>256-bit Encrypted · Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
