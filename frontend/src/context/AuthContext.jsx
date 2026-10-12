import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to resolve role and profile details
  const resolveUserProfile = async (authUser) => {
    if (!authUser) return null;

    let role =
      authUser.app_metadata?.role ||
      authUser.user_metadata?.role ||
      null;
    let fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "";

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.full_name) fullName = profile.full_name;
      }
    } catch (err) {
      console.warn("Could not fetch profile:", err);
    }

    const cleanRole = (role || "customer").toLowerCase();

    return {
      ...authUser,
      role: cleanRole,
      name: fullName,
      isAdmin: ["admin", "super_admin", "manager"].includes(cleanRole),
    };
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const enrichedUser = await resolveUserProfile(session.user);
        setUser(enrichedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const enrichedUser = await resolveUserProfile(session.user);
        setUser(enrichedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      return { success: false, error: error.message };
    }

    const enrichedUser = await resolveUserProfile(data.user);
    setUser(enrichedUser);

    return {
      success: true,
      user: enrichedUser,
      isAdmin: enrichedUser?.isAdmin ?? false,
      role: enrichedUser?.role ?? "customer",
    };
  };

  const loginWithGoogle = async (redirectToPath = "/admin") => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://safedrang.com";
    const redirectTo = `${origin}${redirectToPath}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Google login failed:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminToken");
    setUser(null);
    setSession(null);
  };

  const token = session?.access_token || (user ? "authenticated" : null);
  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider
      value={{ user, session, token, loading, login, loginWithGoogle, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
