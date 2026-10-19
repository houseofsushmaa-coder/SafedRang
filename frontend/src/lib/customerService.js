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

/**
 * Fetch the authenticated customer's profile row.
 */
export const getCustomerProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Update profile fields: full_name, phone, default_address, saved_addresses.
 */
export const updateCustomerProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Addresses ───────────────────────────────────────────────────────────────

/**
 * Replace the saved_addresses JSONB array on the profile.
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
