/**
 * SafedRang — Customer Service Layer
 * All Supabase queries scoped to the authenticated customer.
 * RLS on Supabase guarantees customers only ever see their own data.
 */

import { supabase } from './supabase';

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Fetch all orders for a customer, ordered newest first.
 * Matches on customer_email (existing orders table pattern).
 */
export const getCustomerOrders = async (email) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ─── Profile ─────────────────────────────────────────────────────────────────

// The profiles table only has id, email, role and full_name. Phone and saved
// addresses live in the customer's own auth metadata (private to them, and
// ignored for roles), so no schema change is needed.
const PROFILE_COLUMNS = ['full_name'];

/**
 * Fetch the authenticated customer's profile, merged with their phone and
 * saved addresses from account metadata.
 */
export const getCustomerProfile = async (userId) => {
  const [{ data, error }, { data: auth }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  const meta = auth?.user?.id === userId ? auth.user.user_metadata || {} : {};
  return {
    ...(data || {}),
    phone: meta.phone || '',
    saved_addresses: Array.isArray(meta.saved_addresses) ? meta.saved_addresses : [],
  };
};

/**
 * Update profile fields: full_name (table), phone and saved_addresses (metadata).
 */
export const updateCustomerProfile = async (userId, updates) => {
  const columns = {};
  const meta = {};
  for (const [key, value] of Object.entries(updates)) {
    (PROFILE_COLUMNS.includes(key) ? columns : meta)[key] = value;
  }
  if (Object.keys(columns).length) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...columns, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  }
  if (Object.keys(meta).length) {
    const { error } = await supabase.auth.updateUser({ data: meta });
    if (error) throw error;
  }
  return getCustomerProfile(userId);
};

// ─── Addresses ───────────────────────────────────────────────────────────────

/**
 * Replace the customer's saved addresses.
 * Addresses structure: [{ id, label, full_name, phone, address, city, state, pincode, is_default }]
 */
export const saveCustomerAddresses = async (userId, addresses) => {
  return updateCustomerProfile(userId, { saved_addresses: addresses });
};

// ─── Password ────────────────────────────────────────────────────────────────

/**
 * Update the authenticated user's password.
 */
export const changePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
};

/**
 * Sign out the current session.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
