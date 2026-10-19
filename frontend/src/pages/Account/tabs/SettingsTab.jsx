import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { getCustomerProfile, updateCustomerProfile, changePassword } from '../../../lib/customerService';

// ─── Settings Tab ─────────────────────────────────────────────────────────────

export default function SettingsTab() {
  const { user, logout } = useAuth();

  // ── Profile Form ──
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password Form ──
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getCustomerProfile(user.id)
      .then((profile) => {
        setProfileForm({
          full_name: profile?.full_name || user?.name || '',
          phone: profile?.phone || '',
        });
      })
      .catch((e) => console.warn('Profile load:', e))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      toast.error('Full name is required.');
      return;
    }
    setProfileSaving(true);
    try {
      await updateCustomerProfile(user.id, {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
      });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      toast.error('Passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.newPw);
      toast.success('Password changed successfully!');
      setPwForm({ newPw: '', confirmPw: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="patron-loading">
        <div className="patron-spinner" />
        <span className="patron-loading-text">Loading settings…</span>
      </div>
    );
  }

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {showPw
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  return (
    <div>
      <h2 className="patron-section-title">Profile & Settings</h2>
      <p className="patron-section-subtitle">Manage your personal information and account security</p>

      {/* ── Personal Information ── */}
      <div className="patron-card" style={{ marginBottom: '1.5rem' }}>
        <div className="patron-card-header">
          <h3 className="patron-card-title">Personal Information</h3>
        </div>

        <form onSubmit={handleProfileSave}>
          <div className="patron-form-grid">
            <div className="patron-form-group">
              <label className="patron-form-label">Full Name *</label>
              <input
                className="patron-form-input"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="patron-form-group">
              <label className="patron-form-label">Phone Number</label>
              <input
                className="patron-form-input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                type="tel"
              />
            </div>
          </div>

          <div className="patron-form-group">
            <label className="patron-form-label">Email Address</label>
            <input
              className="patron-form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#8B7863', marginTop: '0.2rem' }}>Email cannot be changed from here. Contact support if needed.</span>
          </div>

          <button type="submit" className="patron-btn-primary" disabled={profileSaving}>
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Change Password ── */}
      <div className="patron-card" style={{ marginBottom: '1.5rem' }}>
        <div className="patron-card-header">
          <h3 className="patron-card-title">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange}>
          <div className="patron-form-group" style={{ position: 'relative' }}>
            <label className="patron-form-label">New Password</label>
            <input
              className="patron-form-input"
              type={showPw ? 'text' : 'password'}
              value={pwForm.newPw}
              onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
              placeholder="Minimum 8 characters"
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={{ position: 'absolute', right: '0.8rem', top: '2.1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#8B7863' }}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <EyeIcon />
            </button>
          </div>

          <div className="patron-form-group">
            <label className="patron-form-label">Confirm New Password</label>
            <input
              className="patron-form-input"
              type={showPw ? 'text' : 'password'}
              value={pwForm.confirmPw}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPw: e.target.value }))}
              placeholder="Re-enter your new password"
            />
          </div>

          {/* Password strength hint */}
          {pwForm.newPw.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                {[1, 2, 3, 4].map((level) => {
                  const strength = Math.min(
                    4,
                    (pwForm.newPw.length >= 8 ? 1 : 0) +
                    (/[A-Z]/.test(pwForm.newPw) ? 1 : 0) +
                    (/[0-9]/.test(pwForm.newPw) ? 1 : 0) +
                    (/[^a-zA-Z0-9]/.test(pwForm.newPw) ? 1 : 0)
                  );
                  return (
                    <div key={level} style={{
                      height: 4, flex: 1, borderRadius: 2,
                      background: level <= strength
                        ? strength <= 1 ? '#e05151' : strength <= 2 ? '#e09c51' : strength <= 3 ? '#AE8A54' : '#4caf80'
                        : '#EADFCF',
                      transition: 'background 0.3s ease',
                    }} />
                  );
                })}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#8B7863' }}>
                Use uppercase, numbers, and special characters for a stronger password.
              </span>
            </div>
          )}

          <button type="submit" className="patron-btn-primary" disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ── Danger Zone ── */}
      <div className="patron-card" style={{ border: '1px solid #f0c0c0', background: '#fffafa' }}>
        <div className="patron-card-header">
          <h3 className="patron-card-title" style={{ color: '#922222' }}>Account Actions</h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#8B7863', marginBottom: '1rem', lineHeight: 1.6 }}>
          Signing out will end your current session. Your orders and saved addresses will remain intact.
        </p>
        <button
          className="patron-btn-secondary"
          style={{ borderColor: '#e05151', color: '#922222' }}
          onClick={async () => {
            await logout();
            window.location.href = '/';
          }}
        >
          Sign Out of All Sessions
        </button>
      </div>
    </div>
  );
}
