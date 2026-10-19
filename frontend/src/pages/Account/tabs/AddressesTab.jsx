import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { getCustomerProfile, saveCustomerAddresses } from '../../../lib/customerService';

// ─── Helpers / Icons ─────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).slice(2, 10);

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

const EMPTY_ADDR = { id: '', label: '', full_name: '', phone: '', address: '', city: '', state: '', pincode: '', is_default: false };

// ─── Address Modal ────────────────────────────────────────────────────────────

function AddressModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_ADDR, ...initial });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (field) => () => setForm((f) => ({ ...f, [field]: !f[field] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      toast.error('Please fill all required fields.');
      return;
    }
    onSave({ ...form, id: form.id || generateId() });
  };

  return (
    <div className="patron-modal-overlay" onClick={onClose}>
      <div className="patron-modal" onClick={(e) => e.stopPropagation()}>
        <div className="patron-modal-header">
          <h2 className="patron-modal-title">{form.id ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="patron-modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="patron-form-group">
            <label className="patron-form-label">Address Label (e.g. Home, Office)</label>
            <input className="patron-form-input" value={form.label} onChange={set('label')} placeholder="Home" />
          </div>

          <div className="patron-form-grid">
            <div className="patron-form-group">
              <label className="patron-form-label">Full Name *</label>
              <input className="patron-form-input" value={form.full_name} onChange={set('full_name')} placeholder="Sushma Sharma" required />
            </div>
            <div className="patron-form-group">
              <label className="patron-form-label">Phone Number</label>
              <input className="patron-form-input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" type="tel" />
            </div>
          </div>

          <div className="patron-form-group">
            <label className="patron-form-label">Street Address *</label>
            <input className="patron-form-input" value={form.address} onChange={set('address')} placeholder="House No, Street, Locality" required />
          </div>

          <div className="patron-form-grid">
            <div className="patron-form-group">
              <label className="patron-form-label">City *</label>
              <input className="patron-form-input" value={form.city} onChange={set('city')} placeholder="Lucknow" required />
            </div>
            <div className="patron-form-group">
              <label className="patron-form-label">PIN Code *</label>
              <input className="patron-form-input" value={form.pincode} onChange={set('pincode')} placeholder="226001" maxLength={6} pattern="[0-9]{6}" required />
            </div>
          </div>

          <div className="patron-form-group">
            <label className="patron-form-label">State</label>
            <select className="patron-form-input" value={form.state} onChange={set('state')}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={toggle('is_default')}>
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${form.is_default ? '#AE8A54' : '#EADFCF'}`,
              background: form.is_default ? '#AE8A54' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease', flexShrink: 0,
            }}>
              {form.is_default && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5A4A42' }}>Set as Default Address</span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button type="submit" className="patron-btn-primary" style={{ flex: 1 }}>Save Address</button>
            <button type="button" className="patron-btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Addresses Tab ────────────────────────────────────────────────────────────

export default function AddressesTab() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editAddr, setEditAddr] = useState(null);   // null = closed, {} = new, {...} = edit
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    getCustomerProfile(user.id)
      .then((profile) => {
        setProfileId(user.id);
        const saved = profile?.saved_addresses;
        setAddresses(Array.isArray(saved) ? saved : []);
      })
      .catch((e) => console.warn('Address load error:', e))
      .finally(() => setLoading(false));
  }, [user]);

  const persist = async (newList) => {
    setSaving(true);
    try {
      await saveCustomerAddresses(profileId, newList);
      setAddresses(newList);
      toast.success('Addresses saved!');
    } catch (err) {
      toast.error('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (addr) => {
    let updated = addresses.some((a) => a.id === addr.id)
      ? addresses.map((a) => (a.id === addr.id ? addr : a))
      : [...addresses, addr];

    // If this address is default, unset others
    if (addr.is_default) {
      updated = updated.map((a) => ({ ...a, is_default: a.id === addr.id }));
    }

    setEditAddr(null);
    persist(updated);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this address?')) return;
    persist(addresses.filter((a) => a.id !== id));
  };

  const handleSetDefault = (id) => {
    persist(addresses.map((a) => ({ ...a, is_default: a.id === id })));
  };

  if (loading) {
    return (
      <div className="patron-loading">
        <div className="patron-spinner" />
        <span className="patron-loading-text">Loading addresses…</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="patron-section-title">Delivery Addresses</h2>
          <p className="patron-section-subtitle" style={{ margin: 0 }}>Manage your saved shipping addresses</p>
        </div>
        <button className="patron-btn-primary" onClick={() => setEditAddr({ ...EMPTY_ADDR })}>
          <PlusIcon /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="patron-empty-state">
          <svg className="patron-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <h3 className="patron-empty-title">No Saved Addresses</h3>
          <p className="patron-empty-desc">Add a shipping address for faster checkout.</p>
          <button className="patron-btn-primary" onClick={() => setEditAddr({ ...EMPTY_ADDR })}>
            <PlusIcon /> Add First Address
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="patron-card"
              style={{
                position: 'relative',
                border: addr.is_default ? '1.5px solid #AE8A54' : '1px solid #EADFCF',
                background: addr.is_default ? 'linear-gradient(135deg, #fffdf8 0%, #fdf9f0 100%)' : '#FFFFFF',
              }}
            >
              {addr.is_default && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#AE8A54', color: '#FFFFFF',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem', borderRadius: 12,
                }}>
                  Default
                </div>
              )}

              {addr.label && (
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#AE8A54', marginBottom: '0.5rem' }}>
                  {addr.label}
                </div>
              )}

              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2A211D', marginBottom: '0.2rem' }}>{addr.full_name}</div>
              {addr.phone && <div style={{ fontSize: '0.8rem', color: '#8B7863', marginBottom: '0.3rem' }}>{addr.phone}</div>}
              <div style={{ fontSize: '0.82rem', color: '#5A4A42', lineHeight: 1.6 }}>
                {addr.address}
                {(addr.city || addr.state) && <div>{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` — ${addr.pincode}` : ''}</div>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {!addr.is_default && (
                  <button className="patron-btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => handleSetDefault(addr.id)} disabled={saving}>
                    Set Default
                  </button>
                )}
                <button className="patron-btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => setEditAddr(addr)}>
                  <EditIcon /> Edit
                </button>
                <button
                  className="patron-btn-ghost"
                  style={{ fontSize: '0.7rem', color: '#9B3A3A', borderColor: '#f5c0c0' }}
                  onClick={() => handleDelete(addr.id)}
                  disabled={saving}
                >
                  <TrashIcon /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editAddr && (
        <AddressModal initial={editAddr} onSave={handleSave} onClose={() => setEditAddr(null)} />
      )}
    </div>
  );
}
